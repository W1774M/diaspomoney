// @vitest-environment node
/**
 * NotificationService : gabarits, planification, préférences e-mail et canaux d'envoi.
 * Journal, cache et mesure sont neutres ; la validation (@Validate) et le domaine Comms
 * restent réels.
 */
import * as Sentry from '@sentry/nextjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  passThrough: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  notifRepo: { create: vi.fn(), updateStatus: vi.fn(), findById: vi.fn(), getStats: vi.fn() },
  templateRepo: { findByNameAndLocale: vi.fn() },
  userRepo: { findByEmail: vi.fn(), findById: vi.fn() },
  sendEmail: vi.fn(),
  recordMetric: vi.fn(),
}));

vi.mock('@/lib/decorators/cache.decorator', () => ({ Cacheable: h.passThrough }));
vi.mock('@/lib/decorators/log.decorator', () => ({ Log: h.passThrough }));
vi.mock('@/lib/decorators/performance.decorator', () => ({ Performance: h.passThrough }));
vi.mock('@/repositories', () => ({
  getNotificationRepository: () => h.notifRepo,
  getNotificationTemplateRepository: () => h.templateRepo,
  getUserRepository: () => h.userRepo,
}));
vi.mock('@/lib/email/resend', () => ({ sendEmail: h.sendEmail }));
vi.mock('@/lib/monitoring/advanced-monitoring', () => ({ monitoringManager: { recordMetric: h.recordMetric } }));

import { notificationService as svc } from '@/services/notification/notification.service';

const repo = h.notifRepo;
const users = h.userRepo;
type Channel = { type: 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP' | 'IN_APP'; enabled: boolean };
const ch = (...types: Channel['type'][]): Channel[] => types.map((type) => ({ type, enabled: true }));
const send = (extra: Record<string, unknown> = {}) =>
  svc.sendNotification({
    recipient: 'awa@test.fr',
    type: 'WELCOME_EMAIL',
    template: 'welcome',
    data: { userName: 'Awa', appName: 'DiaspoMoney' },
    channels: ch('EMAIL'),
    locale: 'fr',
    priority: 'MEDIUM',
    ...extra,
  } as never);
const statuses = () => repo.updateStatus.mock.calls.map((c) => c[1]);

beforeEach(() => {
  vi.clearAllMocks();
  repo.create.mockImplementation(async (n: Record<string, unknown>) => ({ ...n }));
  h.templateRepo.findByNameAndLocale.mockResolvedValue(null);
  users.findByEmail.mockResolvedValue(null);
  users.findById.mockResolvedValue(null);
  h.sendEmail.mockResolvedValue(true);
});

describe('sendNotification : gabarit et enregistrement', () => {
  it('remplit le gabarit par défaut, enregistre puis envoie l’e-mail', async () => {
    const n = await send();
    expect(n).toMatchObject({
      recipient: 'awa@test.fr',
      subject: 'Bienvenue sur DiaspoMoney',
      content: 'Bonjour Awa, bienvenue sur DiaspoMoney ! Votre compte a été créé avec succès.',
      status: 'PENDING',
      userId: 'unknown',
      metadata: { template: 'welcome', locale: 'fr', priority: 'MEDIUM' },
    });
    expect(n.id).toMatch(/^notif_\d+_/);
    expect(h.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'awa@test.fr',
      subject: 'Bienvenue sur DiaspoMoney',
      tags: [{ name: 'notification_type', value: 'WELCOME_EMAIL' }, { name: 'notification_id', value: n.id }],
    }));
    expect(statuses()).toEqual(['SENT']);
    expect(h.recordMetric).toHaveBeenCalledWith(expect.objectContaining({ name: 'notifications_sent' }));
  });

  it('préfère un gabarit en base, et convertit les retours à la ligne en <br> dans le HTML', async () => {
    h.templateRepo.findByNameAndLocale.mockResolvedValueOnce({ subject: 'Salut {{userName}}', content: 'Ligne 1\n{{userName}} {{userName}}' });
    await send();
    expect(h.templateRepo.findByNameAndLocale).toHaveBeenCalledWith('welcome', 'fr');
    expect(h.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ subject: 'Salut Awa', html: 'Ligne 1<br>Awa Awa', text: 'Ligne 1\nAwa Awa' }));
  });

  it('trouve aussi les gabarits additionnels', async () => {
    const n = await send({ template: 'payment_refunded', data: { transactionId: 'T1', amount: 10, currency: 'EUR' } });
    expect(n.subject).toBe('Remboursement confirmé - Transaction T1');
  });

  it('échoue avec métrique et alerte si le gabarit est introuvable', async () => {
    await expect(send({ template: 'inconnu', locale: undefined })).rejects.toThrow('Template non trouvé: inconnu (locale: default)');
    expect(h.recordMetric).toHaveBeenCalledWith(expect.objectContaining({ name: 'notification_template_not_found' }));
    expect(repo.create).not.toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it('retombe sur les gabarits par défaut si la base échoue', async () => {
    h.templateRepo.findByNameAndLocale.mockRejectedValueOnce(new Error('mongo HS'));
    await expect(send()).rejects.toThrow('Template non trouvé');
  });

  it('valide la demande (au moins un canal, destinataire)', async () => {
    await expect(send({ channels: [] })).rejects.toThrow();
    await expect(send({ recipient: '' })).rejects.toThrow();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('déduit l’identifiant utilisateur d’un destinataire qui n’est pas un e-mail', async () => {
    users.findById.mockResolvedValue({ email: 'awa@test.fr' });
    expect((await send({ recipient: 'u1' })).userId).toBe('u1');
    expect((await send({ userId: 'u9' })).userId).toBe('u9');
    expect(h.sendEmail).toHaveBeenLastCalledWith(expect.objectContaining({ to: 'awa@test.fr' }));
  });
});

describe('sendNotification : planification et conditions', () => {
  it('n’envoie pas une notification planifiée dans le futur', async () => {
    const n = await send({ scheduledAt: new Date(Date.now() + 3600_000) });
    expect(n.scheduledAt).toBeInstanceOf(Date);
    expect(h.sendEmail).not.toHaveBeenCalled();
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('expire une notification déjà échue', async () => {
    await send({ expiresAt: new Date(Date.now() - 1000) });
    expect(h.sendEmail).not.toHaveBeenCalled();
    expect(statuses()).toEqual(['EXPIRED']);
  });

  it('n’envoie un rappel KYC que si le statut attendu est toujours celui du compte', async () => {
    users.findByEmail.mockResolvedValue({ kycStatus: 'APPROVED' });
    await send({ data: { userName: 'Awa', requiredKycStatus: 'PENDING' } });
    expect(h.sendEmail).not.toHaveBeenCalled();
    expect(repo.updateStatus.mock.calls[0]![2].failureReason).toContain('KYC=APPROVED, attendu=PENDING');

    vi.clearAllMocks();
    repo.create.mockImplementation(async (n: Record<string, unknown>) => ({ ...n }));
    users.findByEmail.mockResolvedValue({ kycStatus: 'PENDING' });
    await send({ data: { userName: 'Awa', requiredKycStatus: 'PENDING' } });
    expect(h.sendEmail).toHaveBeenCalled();
  });

  it('expire le rappel KYC si le compte est introuvable', async () => {
    users.findByEmail.mockRejectedValue(new Error('mongo HS'));
    await send({ data: { requiredKycStatus: 'PENDING' } });
    expect(repo.updateStatus.mock.calls[0]![2].failureReason).toContain('KYC=unknown');
  });
});

describe('préférences e-mail', () => {
  it('respecte la désactivation globale des e-mails et le choix par type', async () => {
    users.findByEmail.mockResolvedValueOnce({ preferences: { emailNotifications: false } });
    await send();
    expect(h.sendEmail).not.toHaveBeenCalled();
    expect(statuses()).toEqual(['EXPIRED']);

    users.findByEmail.mockResolvedValueOnce({ preferences: { notificationEmailByType: { WELCOME_EMAIL: false } } });
    await send();
    users.findByEmail.mockResolvedValueOnce({ preferences: { notificationEmailByType: { WELCOME_EMAIL: true } } });
    await send();
    users.findByEmail.mockResolvedValueOnce({ preferences: { notificationEmailByType: { AUTRE: false } } });
    await send();
    expect(h.sendEmail).toHaveBeenCalledTimes(2);
  });

  it('force les e-mails de paiement, KYC et sécurité malgré les préférences', async () => {
    users.findByEmail.mockResolvedValue({ preferences: { emailNotifications: false } });
    await svc.sendPaymentSuccessNotification('awa@test.fr', 24, 'EUR', 'Consultation', 'fr');
    await svc.sendKYCApprovedNotification('awa@test.fr', 'Awa');
    expect(h.sendEmail).toHaveBeenCalledTimes(2);
    expect(h.sendEmail.mock.calls[0]![0].subject).toBe('Paiement confirmé - Consultation');
    expect(users.findByEmail).not.toHaveBeenCalled();
  });
});

describe('canaux', () => {
  it('envoie par SMS, push, WhatsApp et in-app, en ignorant les canaux désactivés', async () => {
    await send({ channels: [...ch('SMS', 'PUSH', 'WHATSAPP', 'IN_APP'), { type: 'EMAIL', enabled: false }] });
    expect(statuses()).toEqual(['SENT', 'SENT', 'SENT', 'SENT']);
    expect(h.sendEmail).not.toHaveBeenCalled();
  });

  it('marque l’échec d’un canal et continue avec les autres', async () => {
    h.sendEmail.mockResolvedValueOnce(false);
    await send({ channels: ch('EMAIL', 'IN_APP') });
    expect(statuses()).toEqual(['FAILED', 'SENT']);
    expect(repo.updateStatus.mock.calls[0]![2].failureReason).toBe("Erreur lors de l'envoi via EMAIL: Failed to send email via Resend");
  });

  it('envoie l’e-mail d’un invité à l’adresse fournie, sans chercher un utilisateur', async () => {
    const n = await send({
      recipient: 'guest-tnpris-mwvsdo2o',
      recipientEmail: 'ada@example.com',
    });
    expect(users.findById).not.toHaveBeenCalled();
    expect(h.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'ada@example.com' }));
    expect(n.metadata?.['recipientEmail']).toBe('ada@example.com');
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(statuses()).toEqual(['SENT']);
  });

  it('ignore l’e-mail d’un invité sans adresse et n’ouvre pas d’erreur Sentry', async () => {
    await send({ recipient: 'guest-tnpris-mwvsdo2o' });
    expect(users.findById).not.toHaveBeenCalled();
    expect(h.sendEmail).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(statuses()).toEqual(['EXPIRED']);
  });

  it('échoue l’e-mail si l’identifiant destinataire n’a pas d’adresse', async () => {
    await send({ recipient: 'u1' });
    expect(statuses()).toEqual(['FAILED', 'EXPIRED']);
    expect(repo.updateStatus.mock.calls[0]![2].failureReason).toContain('Failed to resolve user email: u1');
  });

  it('remonte une panne d’enregistrement du statut in-app', async () => {
    repo.updateStatus.mockRejectedValueOnce(new Error('mongo HS')).mockResolvedValue(undefined);
    await send({ channels: ch('IN_APP') });
    expect(statuses()).toEqual(['SENT', 'FAILED', 'EXPIRED']);
  });

  it('remonte une panne d’enregistrement pour SMS, push et WhatsApp', async () => {
    for (const type of ['SMS', 'PUSH', 'WHATSAPP'] as const) {
      repo.updateStatus.mockRejectedValueOnce(new Error('mongo HS'));
      await send({ channels: ch(type) });
    }
    expect(statuses().filter((s) => s === 'FAILED')).toHaveLength(3);
  });
});

describe('raccourcis métier', () => {
  it('construit chaque notification avec son gabarit et ses canaux', async () => {
    users.findById.mockResolvedValue({ email: 'awa@test.fr' });
    await svc.sendWelcomeNotification('awa@test.fr', 'Awa');
    await svc.sendLoginNotification('u1', 'awa@test.fr', new Date('2026-11-22T10:00:00Z'));
    await svc.sendPaymentFailedNotification('awa@test.fr', 24, 'EUR', 'carte refusée');
    await svc.send2FACode('+33600000000', '123456');
    await svc.sendAppointmentReminder('awa@test.fr', new Date(Date.now() + 3 * 86400_000), 'Consultation', 'Dr Bah');

    const created = repo.create.mock.calls.map((c) => c[0]);
    expect(created.map((n) => n.metadata.template)).toEqual(['welcome', 'login_success', 'payment_failed', '2fa_code', 'appointment_reminder']);
    expect(created[1]).toMatchObject({ userId: 'u1', channels: [{ type: 'IN_APP' }] });
    expect(created[1].content).toContain('22 novembre 2026');
    expect(created[3].expiresAt).toBeInstanceOf(Date);
    expect(created[4].scheduledAt).toBeInstanceOf(Date);
    expect(h.sendEmail).toHaveBeenCalledTimes(2);
  });

  it('remonte les échecs des raccourcis', async () => {
    repo.create.mockRejectedValue(new Error('mongo HS'));
    const calls = [
      () => svc.sendWelcomeNotification('a@test.fr', 'A'),
      () => svc.sendLoginNotification('u1', 'a@test.fr'),
      () => svc.sendPaymentSuccessNotification('a@test.fr', 1, 'EUR', 'S'),
      () => svc.sendPaymentFailedNotification('a@test.fr', 1, 'EUR', 'R'),
      () => svc.sendKYCApprovedNotification('a@test.fr', 'A'),
      () => svc.send2FACode('+33600000000', '1'),
      () => svc.sendAppointmentReminder('a@test.fr', new Date(), 'S', 'P'),
    ];
    for (const call of calls) await expect(call()).rejects.toThrow('mongo HS');
  });
});

describe('livraison différée et statistiques', () => {
  it('livre une notification existante par identifiant', async () => {
    repo.findById.mockResolvedValueOnce(null);
    expect(await svc.deliverNotificationById('n0')).toBe(false);

    repo.findById.mockResolvedValueOnce({ id: 'n1', recipient: 'awa@test.fr', type: 'WELCOME_EMAIL', subject: 's', content: 'c', channels: ch('EMAIL') });
    expect(await svc.deliverNotificationById('n1')).toBe(true);
    expect(repo.updateStatus).toHaveBeenCalledWith('n1', 'SENT', expect.anything());
  });

  it('renvoie les statistiques du dépôt', async () => {
    repo.getStats.mockResolvedValueOnce({ total: 3 });
    expect(await svc.getNotificationStats()).toEqual({ total: 3 });
    expect(repo.getStats).toHaveBeenCalledWith('day');
    repo.getStats.mockRejectedValueOnce(new Error('mongo HS'));
    await expect(svc.getNotificationStats('week')).rejects.toThrow('mongo HS');
  });
});
