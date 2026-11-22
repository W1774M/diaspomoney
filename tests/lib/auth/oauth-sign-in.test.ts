// @vitest-environment node
/**
 * Connexion Google / Facebook (callback NextAuth `signIn`) : même règle de statut que la
 * connexion par mot de passe. Actif : accepté ; en attente : activé (e-mail vérifié par le
 * fournisseur) ; suspendu ou inactif : refusé.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  emitUserLoggedIn: vi.fn(async () => undefined),
}));

vi.mock('@/repositories', () => ({
  getUserRepository: () => ({ findByEmail: h.findByEmail, create: h.create, update: h.update }),
}));
vi.mock('@/lib/events', () => ({ authEvents: { emitUserLoggedIn: h.emitUserLoggedIn } }));

import { authConfig } from '@/auth.config';

type SignIn = (args: { user: Record<string, unknown>; account: Record<string, unknown> | null }) => Promise<boolean | string>;
const signIn = authConfig.callbacks!.signIn as unknown as SignIn;
const google = { provider: 'google', providerAccountId: 'g-123' };
const oauthUser = () => ({ email: 'Awa@Test.fr', name: 'Awa Diallo', image: 'a.png' });

beforeEach(() => {
  vi.clearAllMocks();
  h.create.mockResolvedValue({ id: 'new1' });
  h.update.mockResolvedValue({});
});

describe('signIn OAuth : statut du compte existant', () => {
  it('accepte un compte actif et rattache le fournisseur', async () => {
    h.findByEmail.mockResolvedValueOnce({ id: 'u1', status: 'ACTIVE' });
    const user = oauthUser();
    expect(await signIn({ user, account: google })).toBe(true);
    expect(h.findByEmail).toHaveBeenCalledWith('awa@test.fr');
    expect(h.update).toHaveBeenCalledWith('u1', {
      'oauth.google.linked': true,
      'oauth.google.providerAccountId': 'g-123',
      image: 'a.png',
      name: 'Awa Diallo',
    });
    expect(user).toMatchObject({ id: 'u1' });
  });

  it('accepte un ancien compte sans statut', async () => {
    h.findByEmail.mockResolvedValueOnce({ id: 'u1' });
    expect(await signIn({ user: oauthUser(), account: google })).toBe(true);
    expect(h.update.mock.calls[0]![1]).not.toHaveProperty('status');
  });

  it('active un compte en attente : le fournisseur a vérifié l’e-mail', async () => {
    h.findByEmail.mockResolvedValueOnce({ id: 'u1', status: 'PENDING' });
    expect(await signIn({ user: oauthUser(), account: { provider: 'facebook', providerAccountId: 'f-1' } })).toBe(true);
    expect(h.update).toHaveBeenCalledWith('u1', expect.objectContaining({
      status: 'ACTIVE',
      emailVerified: expect.any(Date),
      'oauth.facebook.linked': true,
    }));
  });

  it.each(['SUSPENDED', 'INACTIVE'])('refuse un compte %s sans le modifier, avec le message dédié', async (status) => {
    h.findByEmail.mockResolvedValueOnce({ id: 'u1', status });
    expect(await signIn({ user: oauthUser(), account: google })).toBe('/login?status=suspended');
    expect(h.update).not.toHaveBeenCalled();
    expect(h.emitUserLoggedIn).not.toHaveBeenCalled();
  });
});

describe('signIn OAuth : autres cas', () => {
  it('crée un compte actif pour un nouvel e-mail', async () => {
    h.findByEmail.mockResolvedValueOnce(null);
    const user = oauthUser();
    expect(await signIn({ user, account: google })).toBe(true);
    expect(h.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'awa@test.fr',
      status: 'ACTIVE',
      oauth: { google: { linked: true, providerAccountId: 'g-123' } },
    }));
    expect(user).toMatchObject({ id: 'new1' });
  });

  it('refuse un fournisseur sans e-mail', async () => {
    expect(await signIn({ user: { name: 'X' }, account: google })).toBe(false);
    expect(h.findByEmail).not.toHaveBeenCalled();
  });

  it('accepte la connexion par mot de passe déjà validée par authorize', async () => {
    expect(await signIn({ user: { id: 'u1', email: 'a@test.fr' }, account: { provider: 'credentials' } })).toBe(true);
    expect(await signIn({ user: { id: 'u1' }, account: { provider: 'credentials' } })).toBe(false);
    expect(await signIn({ user: { email: 'a@test.fr' }, account: { provider: 'credentials' } })).toBe(false);
  });
});
