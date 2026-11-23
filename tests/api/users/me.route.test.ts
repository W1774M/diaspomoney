// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  auth: vi.fn(),
  findByEmail: vi.fn(),
  updateOne: vi.fn(),
  invalidateAppCache: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: h.auth }));
vi.mock('@/lib/cache/redis', () => ({ invalidateAppCache: h.invalidateAppCache }));
vi.mock('@/repositories', () => ({
  getUserRepository: () => ({ findByEmail: h.findByEmail }),
}));
vi.mock('@/lib/mongodb', () => ({
  getMongoClient: async () => ({
    db: () => ({
      collection: () => ({ updateOne: h.updateOne }),
    }),
  }),
}));
vi.mock('@/lib/api/error-handler', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/error-handler')>();
  return {
    ...actual,
    handleApiRoute: vi.fn(async (_request, handler) => {
      try {
        const result = await handler();
        return { json: async () => result, status: 200 };
      } catch (error: any) {
        const status = error?.statusCode || error?.status || 500;
        return {
          json: async () => ({ error: error?.message || 'Erreur', success: false }),
          status,
        };
      }
    }),
  };
});
vi.mock('@/lib/mappers/user.mapper', () => ({
  mapUserToResponse: (doc: any) => doc,
}));

import { PUT } from '@/app/api/users/me/route';

const put = (body: Record<string, unknown>) =>
  PUT(
    new NextRequest('http://localhost:3000/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  h.auth.mockResolvedValue({ user: { email: 'user@test.fr' } });
  h.updateOne.mockResolvedValue({ matchedCount: 1 });
  h.findByEmail.mockResolvedValue({
    email: 'user@test.fr',
    roles: ['CUSTOMER'],
    firstName: 'Ada',
    lastName: 'Lovelace',
  });
});

describe('PUT /api/users/me — providerInfo', () => {
  it('refuse providerInfo à un client (non prestataire)', async () => {
    const res = await put({
      providerInfo: { type: 'INDIVIDUAL', isVerified: true },
    });
    expect(res.status).toBe(403);
    expect(h.updateOne).not.toHaveBeenCalled();
  });

  it('laisse un prestataire mettre à jour le profil sans écraser isVerified', async () => {
    h.findByEmail
      .mockResolvedValueOnce({
        email: 'pro@test.fr',
        roles: ['PROVIDER'],
        providerInfo: {
          type: 'INDIVIDUAL',
          isVerified: true,
          rating: 4,
          reviewCount: 3,
          description: 'Avant',
        },
      })
      .mockResolvedValueOnce({
        email: 'pro@test.fr',
        roles: ['PROVIDER'],
        providerInfo: {
          type: 'INDIVIDUAL',
          isVerified: true,
          rating: 4,
          reviewCount: 3,
          description: 'Après',
        },
      });

    const res = await put({
      providerInfo: {
        type: 'INDIVIDUAL',
        isVerified: false,
        rating: 5,
        description: 'Après',
      },
    });

    expect(res.status).toBe(200);
    expect(h.updateOne).toHaveBeenCalledWith(
      { email: 'user@test.fr' },
      {
        $set: expect.objectContaining({
          providerInfo: expect.objectContaining({
            description: 'Après',
            isVerified: true,
            rating: 4,
            reviewCount: 3,
          }),
        }),
      },
    );
  });
});
