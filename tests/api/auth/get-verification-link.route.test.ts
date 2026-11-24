/**
 * POST /api/auth/get-verification-link — réservé au support (ADMIN / SUPERADMIN)
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const { mockAuth, dbConnect, findOne, sign } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  dbConnect: vi.fn(),
  findOne: vi.fn(),
  sign: vi.fn(() => 'signed-token'),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/mongodb', () => ({ default: dbConnect }));
vi.mock('@/models/User', () => ({ default: { findOne } }));
vi.mock('jsonwebtoken', () => ({ default: { sign }, sign }));
vi.mock('@/lib/api/public-url', () => ({
  getPublicBaseUrl: () => 'http://localhost:3000',
}));

import { POST } from '@/app/api/auth/get-verification-link/route';

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/auth/get-verification-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/auth/get-verification-link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbConnect.mockResolvedValue(undefined);
    vi.stubEnv('JWT_SECRET', 'test-secret');
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', roles: [ROLES.ADMIN] },
    });
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await post({ email: 'ada@test.fr' })).status).toBe(401);
  });

  it('répond 403 pour un client', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', roles: [ROLES.CUSTOMER] },
    });
    expect((await post({ email: 'ada@test.fr' })).status).toBe(403);
  });

  it('répond 400 sans email', async () => {
    expect((await post({})).status).toBe(400);
  });

  it('répond 404 si utilisateur introuvable', async () => {
    findOne.mockResolvedValue(null);
    expect((await post({ email: 'x@test.fr' })).status).toBe(404);
  });

  it('génère un lien pour un SUPERADMIN', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'sa-1', roles: [ROLES.SUPERADMIN] },
    });
    findOne.mockResolvedValue({ _id: 'u1', email: 'ada@test.fr' });

    const res = await post({ email: 'Ada@Test.fr' });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.verificationUrl).toContain('/verify-email?token=signed-token');
    expect(body.note).toBeUndefined();
    expect(findOne).toHaveBeenCalledWith({ email: 'ada@test.fr' });
  });
});
