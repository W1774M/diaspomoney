// @vitest-environment node
/**
 * POST /api/auth/activate-account : le lien d'activation suffit quand le mot de passe a été
 * choisi à l'inscription ; sinon il faut le définir. Jamais de réactivation d'un compte suspendu.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ findById: vi.fn(), update: vi.fn(), invalidateAppCache: vi.fn() }));
vi.mock('@/repositories', () => ({ getUserRepository: () => ({ findById: h.findById, update: h.update }) }));
vi.mock('@/lib/cache/redis', () => ({ invalidateAppCache: h.invalidateAppCache }));

import { POST } from '@/app/api/auth/activate-account/route';

const SECRET = 'secret-de-test';
const tokenFor = (userId = 'u1', type = 'account_activation') => jwt.sign({ userId, type }, SECRET);
const call = async (body: Record<string, unknown>) => {
  const res = await POST(new NextRequest('http://localhost/api/auth/activate-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
  return { status: res.status, body: await res.json() };
};
const user = (extra: Record<string, unknown> = {}) => ({ id: 'u1', email: 'awa@test.fr', status: 'PENDING', ...extra });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('JWT_SECRET', SECRET);
  h.update.mockResolvedValue({});
});

describe('activation', () => {
  it('active avec le seul lien quand le mot de passe a été choisi à l’inscription', async () => {
    h.findById.mockResolvedValueOnce(user({ password: '$2b$12$hash' }));
    const res = await call({ token: tokenFor() });
    expect(res).toMatchObject({ status: 200, body: { success: true } });
    expect(h.findById).toHaveBeenCalledWith('u1');
    expect(h.update).toHaveBeenCalledWith('u1', { status: 'ACTIVE', isEmailVerified: true, emailVerified: true });
    expect(h.invalidateAppCache).toHaveBeenCalledWith('UserRepository');
  });

  it('ne remplace pas le mot de passe choisi à l’inscription', async () => {
    h.findById.mockResolvedValueOnce(user({ password: '$2b$12$hash' }));
    await call({ token: tokenFor(), password: 'Autre-Secret-1' });
    expect(h.update.mock.calls[0]![1]).not.toHaveProperty('password');
  });

  it('demande un mot de passe quand le compte n’en a pas (création par l’admin)', async () => {
    h.findById.mockResolvedValueOnce(user());
    expect(await call({ token: tokenFor() })).toMatchObject({ status: 400, body: { code: 'PASSWORD_REQUIRED' } });
    expect(h.update).not.toHaveBeenCalled();

    h.findById.mockResolvedValueOnce(user());
    expect((await call({ token: tokenFor(), password: 'Nouveau-Secret-1' })).status).toBe(200);
    const saved = h.update.mock.calls[0]![1];
    expect(saved.status).toBe('ACTIVE');
    expect(await bcrypt.compare('Nouveau-Secret-1', saved.password)).toBe(true);
  });

  it('laisse un compte actif sans mot de passe (créé via Google) en définir un', async () => {
    h.findById.mockResolvedValueOnce(user({ status: 'ACTIVE' }));
    expect((await call({ token: tokenFor(), password: 'Nouveau-Secret-1' })).status).toBe(200);
  });
});

describe('refus', () => {
  it('signale un compte déjà activé', async () => {
    h.findById.mockResolvedValueOnce(user({ status: 'ACTIVE', password: '$2b$12$hash' }));
    expect(await call({ token: tokenFor() })).toMatchObject({ status: 400, body: { code: 'ALREADY_ACTIVATED' } });
  });

  it.each(['SUSPENDED', 'INACTIVE'])('ne réactive jamais un compte %s', async (status) => {
    h.findById.mockResolvedValueOnce(user({ status, password: '$2b$12$hash' }));
    expect(await call({ token: tokenFor() })).toMatchObject({ status: 403, body: { code: 'ACCOUNT_DISABLED' } });
    expect(h.update).not.toHaveBeenCalled();
  });

  it('refuse un jeton invalide, d’un autre type, ou un compte introuvable', async () => {
    expect(await call({ token: 'pas-un-jwt' })).toMatchObject({ status: 400, body: { code: 'INVALID_TOKEN' } });
    expect(await call({ token: tokenFor('u1', 'password_reset') })).toMatchObject({ status: 400, body: { code: 'INVALID_TOKEN_TYPE' } });
    h.findById.mockResolvedValueOnce(null);
    expect(await call({ token: tokenFor() })).toMatchObject({ status: 404, body: { code: 'USER_NOT_FOUND' } });
  });

  it('refuse un mot de passe trop court', async () => {
    expect((await call({ token: tokenFor(), password: 'court' })).status).toBe(400);
    expect(h.findById).not.toHaveBeenCalled();
  });
});
