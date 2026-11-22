// @vitest-environment node
/**
 * AuthService : connexion, inscription, jetons, 2FA et réinitialisation du mot de passe.
 * Journal, cache, limitation, audit et mesure sont neutres ; la validation (@Validate) reste
 * réelle, ainsi que le domaine Identity, jsonwebtoken, speakeasy et qrcode.
 */
import * as Sentry from '@sentry/nextjs';
import jwt from 'jsonwebtoken';
import * as speakeasy from 'speakeasy';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  passThrough: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  repo: {
    findOne: vi.fn(),
    findById: vi.fn(),
    verifyPassword: vi.fn(),
    update: vi.fn(),
    setup2FA: vi.fn(),
    get2FAInfo: vi.fn(),
    enable2FA: vi.fn(),
    update2FABackupCodes: vi.fn(),
    updatePassword: vi.fn(),
  },
  security: {
    detectAnomalies: vi.fn(),
    generateTokens: vi.fn(() => ({ accessToken: 'acc', refreshToken: 'ref' })),
    resetLoginAttempts: vi.fn(),
    verifyToken: vi.fn(),
    blacklistToken: vi.fn(),
  },
  createAuditLog: vi.fn(),
  deleteSession: vi.fn(),
  userFacadeExecute: vi.fn(),
  sendWelcomeEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  dbConnect: vi.fn(),
}));

vi.mock('@/lib/decorators/cache.decorator', () => ({ Cacheable: h.passThrough, InvalidateCache: h.passThrough }));
vi.mock('@/lib/decorators/log.decorator', () => ({ Log: h.passThrough }));
vi.mock('@/lib/decorators/rate-limit.decorator', () => ({ RateLimit: h.passThrough }));
vi.mock('@/lib/decorators/audit.decorator', () => ({ Audit: h.passThrough }));
vi.mock('@/lib/decorators/performance.decorator', () => ({ Performance: h.passThrough }));
vi.mock('@/repositories', () => ({ getUserRepository: () => h.repo }));
vi.mock('@/lib/security/advanced-security', () => ({ securityManager: h.security }));
vi.mock('@/lib/security/audit-logging', () => ({ auditLogging: { createAuditLog: h.createAuditLog } }));
vi.mock('@/lib/redis/redis-client', () => ({ getRedisClient: () => ({ deleteSession: h.deleteSession }) }));
vi.mock('@/lib/email/resend', () => ({
  sendWelcomeEmail: h.sendWelcomeEmail,
  sendPasswordResetEmail: h.sendPasswordResetEmail,
}));
vi.mock('@/lib/mongodb', () => ({ default: h.dbConnect }));
vi.mock('@/facades', () => ({ userFacade: { execute: h.userFacadeExecute } }));

import { authService } from '@/services/auth/auth.service';

const SECRET = 'secret-de-test';
const r = h.repo;
const s = h.security;
const user = (extra: Record<string, unknown> = {}) => ({
  id: 'u1',
  email: 'awa@test.fr',
  name: 'Awa Diallo',
  firstName: 'Awa',
  lastName: 'Diallo',
  status: 'ACTIVE',
  roles: ['CUSTOMER'],
  isEmailVerified: true,
  ...extra,
});
const opts = { ipAddress: '1.2.3.4', userAgent: 'vitest' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('JWT_SECRET', SECRET);
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.test');
  vi.stubEnv('RESEND_API_KEY', '');
  vi.stubEnv('NEXTAUTH_URL', '');
  r.findOne.mockResolvedValue(user());
  r.findById.mockResolvedValue(user());
  r.verifyPassword.mockResolvedValue(true);
  r.updatePassword.mockResolvedValue(true);
  s.generateTokens.mockReturnValue({ accessToken: 'acc', refreshToken: 'ref' });
  s.verifyToken.mockResolvedValue({ userId: 'u1' });
  h.sendWelcomeEmail.mockResolvedValue(true);
  h.sendPasswordResetEmail.mockResolvedValue(true);
});

describe('login', () => {
  const creds = { email: 'Awa@Test.fr', password: 'Secret-123' };

  it('connecte un compte actif : jetons, dernière connexion, compteur remis à zéro, audit', async () => {
    const res = await authService.login(creds, opts);
    expect(res).toEqual({
      user: { id: 'u1', email: 'awa@test.fr', role: 'CUSTOMER', isVerified: true, kycStatus: 'PENDING' },
      accessToken: 'acc',
      refreshToken: 'ref',
      expiresIn: 900,
    });
    expect(r.findOne).toHaveBeenCalledWith({ email: 'awa@test.fr' });
    expect(r.verifyPassword).toHaveBeenCalledWith('u1', 'Secret-123');
    expect(r.update).toHaveBeenCalledWith('u1', { lastLogin: expect.any(Date) });
    expect(s.resetLoginAttempts).toHaveBeenCalledWith('u1');
    expect(h.createAuditLog).toHaveBeenCalledWith('LOGIN_SUCCESS', 'AUTH_SYSTEM', expect.anything(),
      expect.objectContaining({ userId: 'u1', outcome: 'SUCCESS', ipAddress: '1.2.3.4' }));
  });

  it('prend le nom complet et le rôle client par défaut', async () => {
    r.findOne.mockResolvedValueOnce(user({ firstName: '', lastName: '', roles: undefined, isEmailVerified: undefined }));
    const res = await authService.login(creds);
    expect(res.user).toMatchObject({ role: 'CUSTOMER', isVerified: false });
    expect(h.createAuditLog).toHaveBeenCalledWith('LOGIN_SUCCESS', 'AUTH_SYSTEM', expect.anything(),
      expect.objectContaining({ ipAddress: 'unknown', userAgent: 'unknown' }));
  });

  it('refuse un utilisateur inconnu, un compte inactif et un mauvais mot de passe', async () => {
    r.findOne.mockResolvedValueOnce(null);
    await expect(authService.login(creds, opts)).rejects.toThrow('Identifiants invalides');
    expect(s.detectAnomalies).toHaveBeenLastCalledWith('Awa@Test.fr', 'LOGIN_FAILED', expect.objectContaining({ reason: 'user_not_found_or_inactive' }));

    r.findOne.mockResolvedValueOnce(user({ status: 'SUSPENDED' }));
    await expect(authService.login(creds)).rejects.toThrow('Identifiants invalides');
    r.findOne.mockResolvedValueOnce(user({ status: undefined, name: undefined, firstName: '', lastName: '' }));
    await expect(authService.login(creds)).rejects.toThrow('Identifiants invalides');
    expect(r.verifyPassword).not.toHaveBeenCalled();

    r.verifyPassword.mockResolvedValueOnce(false);
    await expect(authService.login(creds)).rejects.toThrow('Identifiants invalides');
    expect(s.detectAnomalies).toHaveBeenLastCalledWith('u1', 'LOGIN_FAILED', expect.objectContaining({ reason: 'invalid_password' }));
    expect(s.generateTokens).not.toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledTimes(4);
  });

  it('valide les identifiants avant tout accès à la base', async () => {
    await expect(authService.login({ email: 'pas-un-email', password: 'x' })).rejects.toThrow();
    await expect(authService.login({ email: 'a@test.fr', password: '' })).rejects.toThrow();
    expect(r.findOne).not.toHaveBeenCalled();
  });
});

describe('register', () => {
  const data = {
    email: 'Moussa@Test.fr',
    password: 'Secret-123',
    firstName: 'Moussa',
    lastName: 'Bah',
    phone: ' 0601020304 ',
    country: 'FR',
    dateOfBirth: '1990-05-01',
    targetCountry: 'SN',
    targetCity: 'Dakar',
    securityQuestion: 'q',
    securityAnswer: 'a',
    selectedServices: ['health'],
    termsAccepted: true,
    marketingConsent: true,
  } as never;
  const created = { _id: { toString: () => 'u2' }, email: 'moussa@test.fr', firstName: 'Moussa', lastName: 'Bah', name: 'Moussa Bah', roles: ['CUSTOMER'] };

  it('crée le compte via la façade, envoie le lien d’activation et renvoie des jetons', async () => {
    h.userFacadeExecute.mockResolvedValueOnce({ success: true, user: created });
    const res = await authService.register(data, { ...opts, baseUrl: 'https://rct.test' });

    expect(h.dbConnect).toHaveBeenCalled();
    const sent = h.userFacadeExecute.mock.calls[0]![0];
    expect(sent).toMatchObject({
      email: 'moussa@test.fr',
      phone: '0601020304',
      roles: ['CUSTOMER'],
      sendWelcomeNotification: false,
      metadata: { targetCity: 'Dakar', isEmailVerified: false, marketingConsent: true, kycConsent: true, kycStatus: 'PENDING' },
    });
    expect(sent.metadata.dateOfBirth).toBeInstanceOf(Date);

    const [to, name, url] = h.sendWelcomeEmail.mock.calls[0]!;
    expect([to, name]).toEqual(['moussa@test.fr', 'Moussa Bah']);
    expect(url).toMatch(/^https:\/\/rct\.test\/activate-account\?token=/);
    const token = new URL(url).searchParams.get('token')!;
    expect(jwt.verify(token, SECRET)).toMatchObject({ userId: 'u2', type: 'account_activation' });

    expect(res).toMatchObject({ user: { id: 'u2', firstName: 'Moussa', isVerified: false }, accessToken: 'acc' });
    expect(h.createAuditLog).toHaveBeenCalledWith('REGISTER_SUCCESS', 'AUTH_SYSTEM', expect.anything(), expect.objectContaining({ userId: 'u2' }));
  });

  it('n’échoue pas si l’e-mail d’activation ne part pas', async () => {
    h.userFacadeExecute.mockResolvedValueOnce({ success: true, user: { id: 'u3', email: 'm@test.fr', firstName: 'M', lastName: 'B' } });
    h.sendWelcomeEmail.mockResolvedValueOnce(false);
    const res = await authService.register({ email: 'm@test.fr', firstName: 'M', lastName: 'B', termsAccepted: true } as never);
    expect(res.user).toMatchObject({ id: 'u3', role: 'CUSTOMER' });
    expect(h.sendWelcomeEmail.mock.calls[0]![2]).toMatch(/^https:\/\/app\.test\/activate-account/);
  });

  it('signale un e-mail déjà utilisé (façade ou index Mongo)', async () => {
    h.userFacadeExecute.mockResolvedValueOnce({ success: false, error: 'Un compte avec cet email existe déjà' });
    await expect(authService.register(data, opts)).rejects.toMatchObject({ isDuplicate: true });
    expect(h.createAuditLog).toHaveBeenCalledWith('REGISTER_FAILED', 'AUTH_SYSTEM', expect.objectContaining({ reason: 'email_already_exists' }), expect.anything());

    h.userFacadeExecute.mockResolvedValueOnce({ success: false, errorCode: 'DUPLICATE_EMAIL', error: 'conflit' });
    await expect(authService.register(data)).rejects.toMatchObject({ message: 'conflit', isDuplicate: true });

    h.userFacadeExecute.mockRejectedValueOnce(Object.assign(new Error('E11000'), { code: 11000 }));
    await expect(authService.register(data)).rejects.toThrow('Un compte avec cet email existe déjà');
  });

  it('remonte les autres échecs à Sentry', async () => {
    h.userFacadeExecute.mockResolvedValueOnce({ success: false });
    await expect(authService.register(data)).rejects.toThrow("Erreur lors de la création de l'utilisateur");
    expect(Sentry.captureException).toHaveBeenCalled();
    await expect(authService.register({ email: 'x@test.fr', firstName: 'X', lastName: 'Y', termsAccepted: false } as never)).rejects.toThrow();
  });
});

describe('jetons de session', () => {
  it('rafraîchit les jetons d’un compte actif', async () => {
    const res = await authService.refreshToken('ref-token');
    expect(s.verifyToken).toHaveBeenCalledWith('ref-token', 'refresh');
    expect(res).toMatchObject({ user: { id: 'u1' }, accessToken: 'acc', refreshToken: 'ref' });
  });

  it('refuse le rafraîchissement pour un compte inactif ou un jeton invalide', async () => {
    r.findById.mockResolvedValueOnce(user({ status: 'SUSPENDED' }));
    await expect(authService.refreshToken('t')).rejects.toThrow('Token de rafraîchissement invalide');
    s.verifyToken.mockRejectedValueOnce(new Error('expiré'));
    await expect(authService.refreshToken('t')).rejects.toThrow('Token de rafraîchissement invalide');
  });

  it('vérifie un jeton d’accès', async () => {
    expect(await authService.verifyToken('acc')).toEqual({ id: 'u1', email: 'awa@test.fr', role: 'CUSTOMER', isVerified: true, kycStatus: 'PENDING' });
    r.findById.mockResolvedValueOnce(null);
    await expect(authService.verifyToken('acc')).rejects.toThrow('Token invalide');
  });

  it('déconnecte : jeton blacklisté et session Redis supprimée, même si Redis échoue', async () => {
    await authService.logout('acc');
    expect(s.blacklistToken).toHaveBeenCalledWith('acc');
    expect(h.deleteSession).toHaveBeenCalledWith('u1');

    h.deleteSession.mockRejectedValueOnce(new Error('redis HS'));
    await expect(authService.logout('acc')).resolves.toBeUndefined();
  });

  it('blackliste quand même un jeton invalide, sans toucher à Redis', async () => {
    s.verifyToken.mockRejectedValueOnce(new Error('invalide'));
    await authService.logout('bad');
    expect(s.blacklistToken).toHaveBeenCalledWith('bad');
    expect(h.deleteSession).not.toHaveBeenCalled();

    s.blacklistToken.mockImplementationOnce(() => { throw new Error('boom'); });
    await expect(authService.logout('acc')).rejects.toThrow('boom');
  });
});

describe('double authentification', () => {
  it('prépare la 2FA : secret, QR code et 8 codes de secours enregistrés', async () => {
    const res = await authService.setup2FA('u1');
    expect(res.qrCode).toMatch(/^data:image\/png;base64,/);
    expect(res.backupCodes).toHaveLength(8);
    expect(r.setup2FA).toHaveBeenCalledWith('u1', res.secret, res.backupCodes);

    r.findById.mockResolvedValueOnce(null);
    await expect(authService.setup2FA('u1')).rejects.toThrow('Utilisateur non trouvé');
  });

  it('active la 2FA avec un code TOTP valide seulement', async () => {
    const secret = speakeasy.generateSecret({ length: 20 }).base32;
    r.get2FAInfo.mockResolvedValue({ twoFactorSecret: secret });
    const code = speakeasy.totp({ secret, encoding: 'base32' });

    expect(await authService.enable2FA('u1', code)).toBe(true);
    expect(r.enable2FA).toHaveBeenCalledWith('u1');
    expect(await authService.enable2FA('u1', '000000x')).toBe(false);

    r.get2FAInfo.mockResolvedValueOnce(null);
    expect(await authService.enable2FA('u1', code)).toBe(false);
    r.get2FAInfo.mockRejectedValueOnce(new Error('mongo HS'));
    await expect(authService.enable2FA('u1', code)).rejects.toThrow('mongo HS');
  });

  it('vérifie un code TOTP ou consomme un code de secours', async () => {
    const secret = speakeasy.generateSecret({ length: 20 }).base32;
    r.get2FAInfo.mockResolvedValue({ twoFactorEnabled: true, twoFactorSecret: secret, twoFactorBackupCodes: ['AAA', 'BBB'] });

    expect(await authService.verify2FA('u1', 'BBB')).toBe(true);
    expect(r.update2FABackupCodes).toHaveBeenCalledWith('u1', ['AAA']);
    expect(await authService.verify2FA('u1', speakeasy.totp({ secret, encoding: 'base32' }))).toBe(true);
    expect(await authService.verify2FA('u1', 'faux')).toBe(false);
  });

  it('refuse sans 2FA activée ou sans secret, et renvoie false sur erreur', async () => {
    r.get2FAInfo.mockResolvedValueOnce({ twoFactorEnabled: false });
    expect(await authService.verify2FA('u1', '123456')).toBe(false);
    r.get2FAInfo.mockResolvedValueOnce({ twoFactorEnabled: true });
    expect(await authService.verify2FA('u1', '123456')).toBe(false);
    r.get2FAInfo.mockRejectedValueOnce(new Error('mongo HS'));
    expect(await authService.verify2FA('u1', '123456')).toBe(false);
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});

describe('réinitialisation du mot de passe', () => {
  it('envoie le lien de réinitialisation quand Resend est configuré', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    expect(await authService.requestPasswordReset('Awa@Test.fr')).toBe(true);
    const [to, name, url] = h.sendPasswordResetEmail.mock.calls[0]!;
    expect([to, name]).toEqual(['awa@test.fr', 'Awa Diallo']);
    const token = new URL(url).searchParams.get('token')!;
    expect(url).toMatch(/^https:\/\/app\.test\/reset-password\?token=/);
    expect(jwt.verify(token, SECRET)).toMatchObject({ userId: 'u1', type: 'password_reset' });

    h.sendPasswordResetEmail.mockResolvedValueOnce(false);
    r.findOne.mockResolvedValueOnce(user({ name: '' }));
    expect(await authService.requestPasswordReset('awa@test.fr')).toBe(true);
    expect(h.sendPasswordResetEmail.mock.calls[1]![1]).toBe('Awa Diallo');
  });

  it('ne révèle rien pour un e-mail inconnu, et n’envoie rien sans Resend', async () => {
    r.findOne.mockResolvedValueOnce(null);
    expect(await authService.requestPasswordReset('inconnu@test.fr')).toBe(false);
    expect(await authService.requestPasswordReset('awa@test.fr')).toBe(true);
    expect(h.sendPasswordResetEmail).not.toHaveBeenCalled();
    r.findOne.mockRejectedValueOnce(new Error('mongo HS'));
    expect(await authService.requestPasswordReset('awa@test.fr')).toBe(false);
  });

  it('change le mot de passe avec un jeton de réinitialisation valide', async () => {
    const token = jwt.sign({ userId: 'u1', type: 'password_reset' }, SECRET);
    expect(await authService.resetPassword(token, 'Nouveau-123')).toBe(true);
    const [id, hash, changedAt] = r.updatePassword.mock.calls[0]!;
    expect([id, changedAt]).toEqual(['u1', true]);
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(h.createAuditLog).toHaveBeenCalledWith('PASSWORD_RESET_SUCCESS', 'AUTH_SYSTEM', {}, expect.objectContaining({ userId: 'u1' }));
  });

  it('refuse un autre type de jeton, un jeton invalide ou un compte introuvable', async () => {
    const activation = jwt.sign({ userId: 'u1', type: 'account_activation' }, SECRET);
    expect(await authService.resetPassword(activation, 'Nouveau-123')).toBe(false);
    expect(await authService.resetPassword('pas-un-jwt', 'Nouveau-123')).toBe(false);
    r.updatePassword.mockResolvedValueOnce(false);
    expect(await authService.resetPassword(jwt.sign({ userId: 'u9', type: 'password_reset' }, SECRET), 'Nouveau-123')).toBe(false);
    await expect(authService.resetPassword('t', 'court')).rejects.toThrow();
  });
});
