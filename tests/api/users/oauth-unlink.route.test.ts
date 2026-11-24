/**
 * POST /api/users/oauth/unlink — dissociation Google / Facebook
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuth, findOne, updateOne, invalidateAppCache } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  findOne: vi.fn(),
  updateOne: vi.fn(),
  invalidateAppCache: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/cache/redis', () => ({ invalidateAppCache }));
vi.mock('@/lib/mongodb', () => ({
  mongoClient: Promise.resolve({
    db: () => ({
      collection: () => ({ findOne, updateOne }),
    }),
  }),
}));

import { POST } from '@/app/api/users/oauth/unlink/route';

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest('http://localhost/api/users/oauth/unlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/users/oauth/unlink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { email: 'Ada@Test.fr' } });
    updateOne.mockResolvedValue({ matchedCount: 1 });
    invalidateAppCache.mockResolvedValue(undefined);
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await post({ provider: 'google' })).status).toBe(401);
  });

  it('répond 400 si provider invalide', async () => {
    const res = await post({ provider: 'twitter' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/provider/i);
  });

  it('répond 404 si utilisateur introuvable', async () => {
    findOne.mockResolvedValue(null);
    expect((await post({ provider: 'google' })).status).toBe(404);
  });

  it('refuse de dissocier le dernier moyen de connexion', async () => {
    findOne.mockResolvedValue({
      email: 'ada@test.fr',
      password: null,
      oauth: { google: { linked: true, providerAccountId: 'g-1' } },
    });

    const res = await post({ provider: 'google' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Impossible de dissocier/i);
    expect(updateOne).not.toHaveBeenCalled();
  });

  it('dissocie Google quand un mot de passe existe', async () => {
    findOne.mockResolvedValue({
      email: 'ada@test.fr',
      password: 'hashed',
      oauth: { google: { linked: true, providerAccountId: 'g-1' } },
    });

    const res = await post({ provider: 'google' });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(findOne).toHaveBeenCalledWith({ email: 'ada@test.fr' });
    expect(updateOne).toHaveBeenCalledWith(
      { email: 'ada@test.fr' },
      {
        $set: { 'oauth.google.linked': false },
        $unset: { 'oauth.google.providerAccountId': '' },
      },
    );
    expect(invalidateAppCache).toHaveBeenCalledWith('UserRepository');
  });

  it('dissocie Facebook s’il reste Google lié', async () => {
    findOne.mockResolvedValue({
      email: 'ada@test.fr',
      password: '',
      oauth: {
        google: { linked: true, providerAccountId: 'g-1' },
        facebook: { linked: true, providerAccountId: 'f-1' },
      },
    });

    const res = await post({ provider: 'facebook' });
    expect(res.status).toBe(200);
    expect(updateOne).toHaveBeenCalledWith(
      { email: 'ada@test.fr' },
      {
        $set: { 'oauth.facebook.linked': false },
        $unset: { 'oauth.facebook.providerAccountId': '' },
      },
    );
  });
});
