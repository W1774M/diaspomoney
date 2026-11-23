/**
 * POST /api/auth/complete-profile
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuth, updateOne, findByEmail, invalidateAppCache } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  updateOne: vi.fn(),
  findByEmail: vi.fn(),
  invalidateAppCache: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/database/mongodb', () => ({
  getMongoClient: vi.fn(async () => ({
    db: () => ({ collection: () => ({ updateOne }) }),
  })),
}));
vi.mock('@/repositories', () => ({
  getUserRepository: () => ({ findByEmail }),
}));
vi.mock('@/lib/cache/redis', () => ({ invalidateAppCache }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { POST } from '@/app/api/auth/complete-profile/route';

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/auth/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/auth/complete-profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'Ada@Example.com' },
    });
    updateOne.mockResolvedValue({ matchedCount: 1 });
    findByEmail.mockResolvedValue({
      _id: { toString: () => 'u1' },
      email: 'ada@example.com',
      phone: '+33600000000',
      countryOfResidence: 'FR',
      targetCountry: 'SN',
      targetCity: 'Dakar',
      monthlyBudget: '500-1000',
    });
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await post({ phone: '+336' })).status).toBe(401);
  });

  it('met à jour le profil et invalide le cache', async () => {
    const res = await post({
      phone: ' +33600000000 ',
      countryOfResidence: ' FR ',
      targetCountry: 'SN',
      targetCity: 'Dakar',
      monthlyBudget: '500-1000',
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateOne).toHaveBeenCalledWith(
      { email: 'ada@example.com' },
      {
        $set: expect.objectContaining({
          phone: '+33600000000',
          countryOfResidence: 'FR',
          targetCountry: 'SN',
          targetCity: 'Dakar',
          monthlyBudget: '500-1000',
        }),
      },
    );
    expect(invalidateAppCache).toHaveBeenCalledWith('UserRepository');
    expect(findByEmail).toHaveBeenCalledWith('ada@example.com');
  });

  it('répond 404 si l’utilisateur n’existe pas', async () => {
    updateOne.mockResolvedValue({ matchedCount: 0 });
    expect((await post({ phone: '+336' })).status).toBe(404);
  });
});
