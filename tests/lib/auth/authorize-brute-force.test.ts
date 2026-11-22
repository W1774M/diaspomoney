// @vitest-environment node
/**
 * Connexion par identifiants (NextAuth `authorize`) : protection contre la force brute.
 * - un compte bloqué est refusé avant même la vérification du mot de passe ;
 * - chaque mauvais mot de passe est compté (blocage au seuil, dans SecurityManager) ;
 * - une connexion réussie remet le compteur à zéro.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  compare: vi.fn(),
  security: {
    isUserBlocked: vi.fn(async () => false),
    detectAnomalies: vi.fn(async () => undefined),
    resetLoginAttempts: vi.fn(async () => undefined),
  },
  emitUserLoggedIn: vi.fn(async () => undefined),
}));

vi.mock('@/repositories', () => ({ getUserRepository: () => ({ findByEmail: h.findByEmail }) }));
vi.mock('bcryptjs', () => ({ default: { compare: h.compare } }));
vi.mock('@/lib/security/advanced-security', () => ({ securityManager: h.security }));
vi.mock('@/lib/events', () => ({ authEvents: { emitUserLoggedIn: h.emitUserLoggedIn } }));

import * as Sentry from '@sentry/nextjs';

import { authConfig } from '@/auth.config';

type Authorize = (c?: Record<'email' | 'password', string>) => Promise<{ id: string; email: string; name: string } | null>;
const provider = authConfig.providers.find((p) => p.id === 'credentials') as unknown as { options: { authorize: Authorize } };
const authorize = provider.options.authorize;

const HASH = '$2b$12$abcdefghijklmnopqrstuuvwxyzABCDEFGHIJKLMNOPQRSTU';
const user = (extra: Record<string, unknown> = {}) => ({ id: 'u1', email: 'awa@test.fr', name: 'Awa Diallo', password: HASH, status: 'ACTIVE', ...extra });
const login = (password = 'Secret-123', email = 'Awa@Test.fr') => authorize({ email, password });

beforeEach(() => {
  vi.clearAllMocks();
  h.findByEmail.mockResolvedValue(user());
  h.compare.mockResolvedValue(true);
  h.security.isUserBlocked.mockResolvedValue(false);
});

describe('authorize : connexion réussie', () => {
  it('connecte, remet le compteur d’échecs à zéro et émet l’événement', async () => {
    expect(await login()).toEqual({ id: 'u1', email: 'awa@test.fr', name: 'Awa Diallo', image: null });
    expect(h.findByEmail).toHaveBeenCalledWith('awa@test.fr');
    expect(h.compare).toHaveBeenCalledWith('Secret-123', HASH);
    expect(h.security.resetLoginAttempts).toHaveBeenCalledWith('u1');
    expect(h.security.detectAnomalies).not.toHaveBeenCalled();
    expect(h.emitUserLoggedIn).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1' }));
  });

  it('compose le nom à partir du prénom et du nom', async () => {
    h.findByEmail.mockResolvedValueOnce(user({ name: '', firstName: 'Awa', lastName: 'Diallo', image: 'a.png' }));
    expect(await login()).toMatchObject({ name: 'Awa Diallo', image: 'a.png' });
    h.findByEmail.mockResolvedValueOnce(user({ name: '', status: undefined }));
    expect(await login()).toMatchObject({ name: 'User' });
  });
});

describe('authorize : protection contre la force brute', () => {
  it('compte chaque mauvais mot de passe', async () => {
    h.compare.mockResolvedValue(false);
    expect(await login('mauvais')).toBeNull();
    expect(h.security.detectAnomalies).toHaveBeenCalledWith('u1', 'LOGIN_FAILED', { email: 'awa@test.fr', reason: 'invalid_password' });
    expect(h.security.resetLoginAttempts).not.toHaveBeenCalled();
  });

  it('refuse un compte bloqué sans vérifier le mot de passe, même s’il est bon', async () => {
    h.security.isUserBlocked.mockResolvedValue(true);
    expect(await login()).toBeNull();
    expect(h.security.isUserBlocked).toHaveBeenCalledWith('u1');
    expect(h.compare).not.toHaveBeenCalled();
    expect(h.security.detectAnomalies).not.toHaveBeenCalled();
    expect(h.security.resetLoginAttempts).not.toHaveBeenCalled();
  });

  it('ne compte pas d’échec pour un compte inactif au bon mot de passe', async () => {
    h.findByEmail.mockResolvedValueOnce(user({ status: 'SUSPENDED' }));
    expect(await login()).toBeNull();
    expect(h.security.detectAnomalies).not.toHaveBeenCalled();
    expect(h.security.resetLoginAttempts).not.toHaveBeenCalled();
  });
});

describe('authorize : autres refus', () => {
  it('refuse sans identifiants, utilisateur inconnu, compte OAuth seul ou mot de passe en clair', async () => {
    expect(await authorize(undefined)).toBeNull();
    expect(await authorize({ email: 'a@test.fr', password: '' })).toBeNull();

    h.findByEmail.mockResolvedValueOnce(null);
    expect(await login()).toBeNull();
    h.findByEmail.mockResolvedValueOnce(user({ password: undefined }));
    expect(await login()).toBeNull();
    h.findByEmail.mockResolvedValueOnce(user({ password: 'en-clair' }));
    expect(await login()).toBeNull();
    expect(Sentry.captureMessage).toHaveBeenCalledWith('Password stored in plain text', expect.anything());
    expect(h.compare).not.toHaveBeenCalled();
  });

  it('renvoie null sur une erreur inattendue, et survit à l’échec de l’événement', async () => {
    h.findByEmail.mockRejectedValueOnce(new Error('mongo HS'));
    expect(await login()).toBeNull();
    expect(Sentry.captureException).toHaveBeenCalled();

    h.emitUserLoggedIn.mockRejectedValueOnce(new Error('bus HS'));
    expect(await login()).toMatchObject({ id: 'u1' });
    await new Promise((r) => setTimeout(r, 0));
  });
});
