// @vitest-environment node
/**
 * Envoi des e-mails (lib/email/resend.ts) avec un faux client Resend : aucun e-mail réel.
 * - envoi générique : expéditeur par environnement, tags nettoyés (Resend n'accepte que
 *   l'ASCII), pièces jointes en base64, erreurs et exceptions → false (+ Sentry) ;
 * - sans RESEND_API_KEY : rien n'est envoyé ;
 * - chaque envoi spécialisé : destinataire, sujet, type ; redirection en développement ;
 * - test de connexion.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  send: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: h.send };
  },
}));
// Nouvelles tentatives neutralisées (sinon 2 s puis 4 s d'attente par échec réseau)
vi.mock('@/lib/decorators/retry.decorator', () => ({
  Retry: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  RetryHelpers: { retryOnNetworkOrServerError: () => false },
}));
vi.mock('@sentry/nextjs', () => ({ captureException: h.captureException, captureMessage: h.captureMessage }));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

type ResendModule = typeof import('@/lib/email/resend');

/** Recharge le module : le client Resend est créé au chargement, selon RESEND_API_KEY. */
async function load(apiKey: string | null = 're_test'): Promise<ResendModule> {
  vi.resetModules();
  if (apiKey === null) vi.stubEnv('RESEND_API_KEY', ''); else vi.stubEnv('RESEND_API_KEY', apiKey);
  return import('@/lib/email/resend');
}

const payload = () => h.send.mock.calls.at(-1)?.[0] as Record<string, any>;
const typeTag = () => payload()['tags'].find((t: { name: string }) => t.name === 'type')?.value;

beforeEach(() => {
  vi.clearAllMocks();
  h.send.mockResolvedValue({ data: { id: 'email-1' }, error: null });
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.test');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('sendEmail', () => {
  it('sans clé Resend, n’envoie rien', async () => {
    const m = await load(null);
    expect(await m.sendEmail({ to: 'a@test.fr', subject: 's', html: '<p>x</p>' })).toBe(false);
    expect(await m.testEmailConnection()).toBe(false);
    expect(h.send).not.toHaveBeenCalled();
  });

  it('envoie avec les valeurs par défaut (expéditeur de test, tags service/environnement)', async () => {
    const m = await load();
    expect(await m.sendEmail({ to: 'a@test.fr', subject: 'Sujet', html: '<p>x</p>' })).toBe(true);
    expect(payload()).toEqual({
      from: 'DiaspoMoney <onboarding@resend.dev>',
      to: ['a@test.fr'],
      subject: 'Sujet',
      html: '<p>x</p>',
      text: '',
      reply_to: [],
      tags: [
        { name: 'service', value: 'diaspomoney' },
        { name: 'environment', value: 'test' },
      ],
    });
  });

  it('en production, expédie depuis noreply@diaspomoney.fr ; garde from, replyTo et plusieurs destinataires', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const m = await load();
    await m.sendEmail({ to: ['a@test.fr', 'b@test.fr'], subject: 's', html: 'h', text: 't' });
    expect(payload()).toMatchObject({ from: 'DiaspoMoney <noreply@diaspomoney.fr>', to: ['a@test.fr', 'b@test.fr'], text: 't' });

    await m.sendEmail({ to: 'a@test.fr', subject: 's', html: 'h', from: 'Support <support@x.fr>', replyTo: 'r@x.fr' } as never);
    expect(payload()).toMatchObject({ from: 'Support <support@x.fr>', reply_to: 'r@x.fr' });
  });

  it('nettoie les tags : ASCII, un seul « _ », sans « _ » au bord, 50 caractères au plus', async () => {
    const m = await load();
    await m.sendEmail({
      to: 'a@test.fr', subject: 's', html: 'h',
      tags: [
        { name: 'réservation n°1', value: 'awa.diallo@test.fr' },
        { name: 'long', value: 'x'.repeat(80) },
      ],
    });
    expect(payload()['tags']).toEqual([
      { name: 'r_servation_n_1', value: 'awa_diallo_test_fr' },
      { name: 'long', value: 'x'.repeat(50) },
    ]);
  });

  it('refuse un tag vide après nettoyage (Sentry), sans appeler Resend', async () => {
    const m = await load();
    expect(await m.sendEmail({ to: 'a@test.fr', subject: 's', html: 'h', tags: [{ name: 'type', value: '€€€' }] })).toBe(false);
    expect(h.send).not.toHaveBeenCalled();
    expect(h.captureMessage).toHaveBeenCalledWith('Invalid email tags detected', expect.anything());
  });

  it('encode les pièces jointes (Buffer, Uint8Array, texte) ; PDF par défaut', async () => {
    const m = await load();
    await m.sendEmail({
      to: 'a@test.fr', subject: 's', html: 'h',
      attachments: [
        { filename: 'a.pdf', content: Buffer.from('abc') },
        { filename: 'b.bin', content: new Uint8Array([100, 101]), contentType: 'application/octet-stream' },
        { filename: 'c.txt', content: 'ZGVq', contentType: 'text/plain' },
      ],
    } as never);
    expect(payload()['attachments']).toEqual([
      { filename: 'a.pdf', content: Buffer.from('abc').toString('base64'), type: 'application/pdf' },
      { filename: 'b.bin', content: Buffer.from([100, 101]).toString('base64'), type: 'application/octet-stream' },
      { filename: 'c.txt', content: 'ZGVq', type: 'text/plain' },
    ]);

    await m.sendEmail({ to: 'a@test.fr', subject: 's', html: 'h', attachments: [] } as never);
    expect(payload()).not.toHaveProperty('attachments');
  });

  it('renvoie false si Resend répond en erreur ou lève une exception (Sentry)', async () => {
    const m = await load();
    h.send.mockResolvedValueOnce({ data: null, error: { message: 'domaine non vérifié' } });
    expect(await m.sendEmail({ to: 'a@test.fr', subject: 's', html: 'h' })).toBe(false);
    h.send.mockRejectedValueOnce(new Error('réseau'));
    expect(await m.sendEmail({ to: 'a@test.fr', subject: 's', html: 'h' })).toBe(false);
    expect(h.captureException).toHaveBeenCalledTimes(2);
  });
});

describe('envois spécialisés', () => {
  it.each([
    ['sendPasswordResetEmail', (m: ResendModule) => m.sendPasswordResetEmail('awa@test.fr', 'Awa', 'https://app.test/reset?token=t'), 'password_reset'],
    ['sendPaymentConfirmationEmail', (m: ResendModule) => m.sendPaymentConfirmationEmail('awa@test.fr', 'Awa', 42, 'EUR', 'Consultation'), 'payment_confirmation'],
    ['sendAppointmentNotificationEmail', (m: ResendModule) => m.sendAppointmentNotificationEmail('awa@test.fr', 'Awa', 'Dr Bah', '25/11/2026', '10:00', 'reminder'), 'appointment_reminder'],
    ['sendBookingTakeChargeEmail', (m: ResendModule) => m.sendBookingTakeChargeEmail('awa@test.fr', 'Awa', 'RES-1', 'Consultation', 42, 'EUR'), 'booking_take_charge'],
    ['sendPaymentLinkEmail', (m: ResendModule) => m.sendPaymentLinkEmail('awa@test.fr', 'Awa', 'RES-1', 'Consultation', '42', 'EUR', 'https://pay.test/x'), 'payment_link'],
    ['sendWelcomeEmail', (m: ResendModule) => m.sendWelcomeEmail('awa@test.fr', 'Awa', 'https://app.test/activate?t=1'), 'welcome'],
    ['sendAccountActivationEmail', (m: ResendModule) => m.sendAccountActivationEmail('awa@test.fr', 'Awa', 'https://app.test/activate?t=1'), 'account_activation'],
    ['sendFeedbackRequestEmail', (m: ResendModule) => m.sendFeedbackRequestEmail('awa@test.fr', 'Awa', 'RES-1', 'Consultation', 'https://app.test/avis'), 'feedback_request'],
  ] as const)('%s : destinataire, sujet et type', async (_name, call, type) => {
    const m = await load();
    expect(await call(m)).toBe(true);
    expect(payload()['to']).toEqual(['awa@test.fr']);
    expect(String(payload()['subject']).length).toBeGreaterThan(0);
    expect(String(payload()['html']).length).toBeGreaterThan(0);
    expect(typeTag()).toBe(type);
  });

  it('attribution à un prestataire externe : tags prestataire et réservation, champs facultatifs', async () => {
    const m = await load();
    expect(await m.sendExternalProviderAssignmentEmail({
      to: 'dr.bah@clinique.sn', reservationNumber: 'RES-2026-11-0007', serviceName: 'Consultation',
      providerName: 'Dr Bah', appointmentDate: '25/11/2026', appointmentTime: '10:00',
      clientName: 'Awa', clientEmail: 'awa@test.fr', clientPhone: '+33', beneficiaryName: 'Mère', beneficiaryPhone: '+221', notes: 'à jeun',
    })).toBe(true);
    expect(payload()['to']).toEqual(['dr.bah@clinique.sn']);
    expect(payload()['tags']).toEqual(expect.arrayContaining([
      { name: 'type', value: 'provider_assignment' },
      { name: 'provider_email', value: 'dr_bah_clinique_sn' },
      { name: 'reservation', value: 'RES-2026-11-0007' },
    ]));
    expect(payload()['html']).toContain('Dr Bah');

    await m.sendExternalProviderAssignmentEmail({ to: 'x@y.fr', reservationNumber: 'R', serviceName: 'S' });
    expect(payload()['to']).toEqual(['x@y.fr']);
  });

  it('en développement, bienvenue, activation, attribution et avis partent vers l’adresse de test, pas au destinataire réel', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const m = await load();
    await m.sendWelcomeEmail('client@reel.fr', 'Awa', 'u');
    await m.sendAccountActivationEmail('client@reel.fr', 'Awa', 'u');
    await m.sendFeedbackRequestEmail('client@reel.fr', 'Awa', 'R', 'S', 'u');
    await m.sendExternalProviderAssignmentEmail({ to: 'client@reel.fr', reservationNumber: 'R', serviceName: 'S' });
    for (const call of h.send.mock.calls) expect(call[0].to).not.toContain('client@reel.fr');
  });
});

describe('testEmailConnection', () => {
  it('vrai si Resend accepte, faux sinon', async () => {
    const m = await load();
    expect(await m.testEmailConnection()).toBe(true);
    h.send.mockResolvedValueOnce({ data: null, error: { message: 'clé invalide' } });
    expect(await m.testEmailConnection()).toBe(false);
    h.send.mockRejectedValueOnce(new Error('réseau'));
    expect(await m.testEmailConnection()).toBe(false);
  });
});
