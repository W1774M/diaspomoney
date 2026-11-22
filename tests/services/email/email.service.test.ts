// @vitest-environment node
import * as Sentry from '@sentry/nextjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Cache, nouvelles tentatives, journal et mesure : neutres ici. La validation (@Validate)
// reste réelle, car elle fait partie du contrat des méthodes.
const h = vi.hoisted(() => ({
  passThrough: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  resend: {
    sendAppointmentNotificationEmail: vi.fn(),
    sendEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    sendPaymentConfirmationEmail: vi.fn(),
    sendWelcomeEmail: vi.fn(),
    testEmailConnection: vi.fn(),
  },
}));

vi.mock('@/lib/decorators/cache.decorator', () => ({ Cacheable: h.passThrough }));
vi.mock('@/lib/decorators/log.decorator', () => ({ Log: h.passThrough }));
vi.mock('@/lib/decorators/performance.decorator', () => ({ Performance: h.passThrough }));
vi.mock('@/lib/decorators/retry.decorator', () => ({ Retry: h.passThrough, RetryHelpers: { retryOnNetworkOrServerError: () => false } }));
vi.mock('@/lib/email/resend', () => h.resend);

import { EmailService, emailService, testEmailService } from '@/services/email/email.service';

const config = { from: 'DiaspoMoney <noreply@diaspomoney.fr>', replyTo: 'support@diaspomoney.fr', enabled: true };
const r = h.resend;

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of Object.values(r)) fn.mockResolvedValue(true);
});

describe('EmailService : envois', () => {
  const svc = new EmailService(config);

  it('expose sa configuration', () => {
    expect(svc.getConfig()).toBe(config);
    expect(emailService.getConfig()).toMatchObject({ from: config.from, replyTo: config.replyTo });
  });

  it('teste la connexion Resend (succès, échec, exception)', async () => {
    expect(await svc.testConnection()).toBe(true);
    r.testEmailConnection.mockResolvedValueOnce(false);
    expect(await svc.testConnection()).toBe(false);
    r.testEmailConnection.mockRejectedValueOnce(new Error('réseau'));
    expect(await svc.testConnection()).toBe(false);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  // Chaque envoi typé : arguments transmis tels quels, false + alerte si Resend refuse ou plante.
  const typed = [
    ['sendWelcomeEmail', ['awa@test.fr', 'Awa', 'https://app.test/verify?t=1']],
    ['sendPasswordResetEmail', ['awa@test.fr', 'Awa', 'https://app.test/reset?t=1']],
    ['sendPaymentConfirmationEmail', ['awa@test.fr', 'Awa', 24, 'EUR', 'Consultation']],
    ['sendAppointmentNotificationEmail', ['awa@test.fr', 'Awa', 'Dr Bah', '2026-12-01', '09:00', 'reminder']],
  ] as const;

  it.each(typed)('%s : transmet à Resend et gère refus et panne', async (name, args) => {
    const call = () => (svc[name] as (...a: unknown[]) => Promise<boolean>)(...args);
    expect(await call()).toBe(true);
    expect(r[name]).toHaveBeenCalledWith(...args);

    r[name].mockResolvedValueOnce(false);
    expect(await call()).toBe(false);
    expect(Sentry.captureMessage).toHaveBeenCalledWith(expect.stringMatching(/^Failed to send/), expect.objectContaining({ level: 'warning' }));

    r[name].mockRejectedValueOnce(new Error('Resend 500'));
    expect(await call()).toBe(false);
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ tags: { component: 'EmailService', action: name } }));
  });

  it('refuse des paramètres invalides sans appeler Resend', async () => {
    await expect(svc.sendWelcomeEmail('pas-un-email', 'Awa', 'https://app.test')).rejects.toThrow();
    await expect(svc.sendPasswordResetEmail('awa@test.fr', '', 'pas une url')).rejects.toThrow();
    await expect(svc.sendPaymentConfirmationEmail('awa@test.fr', 'Awa', -5, 'EUR', 'X')).rejects.toThrow();
    await expect(svc.sendAppointmentNotificationEmail('awa@test.fr', 'Awa', 'Dr', 'd', 't', 'annulation' as 'reminder')).rejects.toThrow();
    expect(r.sendWelcomeEmail).not.toHaveBeenCalled();
    expect(r.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(r.sendPaymentConfirmationEmail).not.toHaveBeenCalled();
    expect(r.sendAppointmentNotificationEmail).not.toHaveBeenCalled();
  });

  it('envoie un email personnalisé à un ou plusieurs destinataires', async () => {
    expect(await svc.sendCustomEmail(['a@test.fr', 'b@test.fr'], 'Objet', '<p>Bonjour</p>', 'Bonjour', [{ name: 'type', value: 'test' }])).toBe(true);
    expect(r.sendEmail).toHaveBeenCalledWith({
      to: ['a@test.fr', 'b@test.fr'], subject: 'Objet', html: '<p>Bonjour</p>', text: 'Bonjour', tags: [{ name: 'type', value: 'test' }],
    });

    expect(await svc.sendCustomEmail('a@test.fr', 'Objet', '<p>x</p>')).toBe(true);
    expect(r.sendEmail).toHaveBeenLastCalledWith({ to: 'a@test.fr', subject: 'Objet', html: '<p>x</p>', text: '', tags: [] });

    r.sendEmail.mockRejectedValueOnce(new Error('quota'));
    expect(await svc.sendCustomEmail('a@test.fr', 'Objet', '<p>x</p>')).toBe(false);
    await expect(svc.sendCustomEmail('pas-un-email', 'Objet', '<p>x</p>')).rejects.toThrow();
  });
});

describe('EmailService : file d’attente', () => {
  let svc: EmailService;
  beforeEach(() => {
    svc = new EmailService(config);
  });

  it('ajoute des emails en attente avec des identifiants uniques', () => {
    const a = svc.addToQueue('welcome', 'a@test.fr', {});
    const b = svc.addToQueue('custom', ['b@test.fr', 'c@test.fr'], {}, 'high');
    expect(a).toMatch(/^email_\d+_\w+$/);
    expect(a).not.toBe(b);
    expect(svc.getQueueStats()).toEqual({ total: 2, pending: 2, processing: 0, sent: 0, failed: 0 });
  });

  it('traite par priorité, aiguille chaque type vers le bon envoi et ignore les envois programmés', async () => {
    const order: string[] = [];
    for (const fn of Object.values(r)) fn.mockImplementation(async (...a: unknown[]) => (order.push(String(Array.isArray(a[0]) ? a[0][0] : a[0] ?? (a[0] as any)?.to)), true));
    r.sendEmail.mockImplementation(async (o: { to: string }) => (order.push(String(o.to)), true));

    svc.addToQueue('welcome', 'low@test.fr', { name: 'L', verificationUrl: 'https://app.test/v' }, 'low');
    svc.addToQueue('password_reset', 'normal@test.fr', { name: 'N', resetUrl: 'https://app.test/r' });
    svc.addToQueue('payment_confirmation', 'high@test.fr', { name: 'H', amount: 10, currency: 'EUR', service: 'S' }, 'high');
    svc.addToQueue('appointment_notification', 'rdv@test.fr', { name: 'R', provider: 'P', date: 'd', time: 't', type: 'confirmation' });
    svc.addToQueue('newsletter', 'news@test.fr', { subject: 'Infos', html: '<p>news</p>' }, 'low');
    svc.addToQueue('welcome', 'demain@test.fr', { name: 'D', verificationUrl: 'https://app.test/v' }, 'high', new Date(Date.now() + 86_400_000));

    await svc.processQueue();

    expect(order).toEqual(['high@test.fr', 'normal@test.fr', 'rdv@test.fr', 'low@test.fr', 'news@test.fr']);
    expect(r.sendPaymentConfirmationEmail).toHaveBeenCalledWith('high@test.fr', 'H', 10, 'EUR', 'S');
    expect(r.sendAppointmentNotificationEmail).toHaveBeenCalledWith('rdv@test.fr', 'R', 'P', 'd', 't', 'confirmation');
    expect(svc.getQueueStats()).toEqual({ total: 6, pending: 1, processing: 0, sent: 5, failed: 0 });
  });

  it('réessaie un envoi refusé, puis l’abandonne après 3 tentatives', async () => {
    r.sendWelcomeEmail.mockResolvedValue(false);
    svc.addToQueue('welcome', 'a@test.fr', { name: 'A', verificationUrl: 'https://app.test/v' });

    await svc.processQueue();
    await svc.processQueue();
    expect(svc.getQueueStats()).toMatchObject({ pending: 1, failed: 0 });
    await svc.processQueue();
    expect(svc.getQueueStats()).toMatchObject({ pending: 0, failed: 1 });
    expect(Sentry.captureMessage).toHaveBeenCalledWith('Email failed permanently', expect.objectContaining({ extra: expect.objectContaining({ attempts: 3 }) }));
    await svc.processQueue();
    expect(r.sendWelcomeEmail).toHaveBeenCalledTimes(3);
  });

  it('marque en échec un email dont les données sont invalides', async () => {
    svc.addToQueue('welcome', 'a@test.fr', { name: 'A', verificationUrl: 'pas une url' });
    await svc.processQueue();
    expect(svc.getQueueStats()).toMatchObject({ failed: 1 });
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ tags: { component: 'EmailService', action: 'processEmail' } }));
  });

  it('ne lance pas deux traitements en même temps', async () => {
    let release!: (v: boolean) => void;
    r.sendWelcomeEmail.mockReturnValueOnce(new Promise((res) => (release = res)));
    svc.addToQueue('welcome', 'a@test.fr', { name: 'A', verificationUrl: 'https://app.test/v' });

    const first = svc.processQueue();
    await svc.processQueue(); // ignoré : le premier est en cours
    // La validation (@Validate) est asynchrone : l'envoi démarre un peu après.
    await vi.waitFor(() => expect(r.sendWelcomeEmail).toHaveBeenCalledTimes(1));
    release(true);
    await first;
    expect(svc.getQueueStats().sent).toBe(1);
  });

  it('purge les emails envoyés depuis plus de 7 jours, garde le reste', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-01T10:00:00Z'));
    svc.addToQueue('custom', 'vieux@test.fr', { subject: 'S', html: '<p>h</p>' });
    await svc.processQueue();
    svc.addToQueue('custom', 'attente@test.fr', { subject: 'S', html: '<p>h</p>' }, 'normal', new Date('2026-12-01'));

    vi.setSystemTime(new Date('2026-11-09T10:00:00Z'));
    svc.addToQueue('custom', 'recent@test.fr', { subject: 'S', html: '<p>h</p>' });
    await svc.processQueue();
    svc.cleanupQueue();
    expect(svc.getQueueStats()).toEqual({ total: 2, pending: 1, processing: 0, sent: 1, failed: 0 });
    svc.cleanupQueue(); // rien à retirer
    expect(svc.getQueueStats().total).toBe(2);
    vi.useRealTimers();
  });
});

describe('testEmailService', () => {
  it('vérifie la connexion puis un envoi de test', async () => {
    expect(await testEmailService()).toBe(true);
    expect(r.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'test@diaspomoney.fr', subject: 'Test Service Email' }));
  });

  it('échoue si la connexion ou l’envoi échoue', async () => {
    r.testEmailConnection.mockResolvedValueOnce(false);
    expect(await testEmailService()).toBe(false);
    expect(r.sendEmail).not.toHaveBeenCalled();

    r.sendEmail.mockRejectedValueOnce(new Error('quota'));
    expect(await testEmailService()).toBe(false);
  });

  it('capture une erreur inattendue', async () => {
    const spy = vi.spyOn(emailService, 'testConnection').mockRejectedValueOnce(new Error('bug'));
    expect(await testEmailService()).toBe(false);
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), { tags: { component: 'EmailService', action: 'testEmailService' } });
    spy.mockRestore();
  });
});
