/**
 * GET /api/providers/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES, USER_STATUSES } from '@/lib/constants';

const ID = '507f1f77bcf86cd799439011';

const { getUserProfile } = vi.hoisted(() => ({
  getUserProfile: vi.fn(),
}));

vi.mock('@/services/user/user.service', () => ({
  userService: { getUserProfile },
}));

import { GET } from '@/app/api/providers/[id]/route';

describe('GET /api/providers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserProfile.mockResolvedValue({
      _id: ID,
      email: 'pro@test.fr',
      roles: [ROLES.PROVIDER],
      status: USER_STATUSES.ACTIVE,
    });
  });

  it('répond 400 pour un id invalide', async () => {
    const res = await GET(new NextRequest('http://localhost/api/providers/bad'), {
      params: { id: 'bad' },
    });
    expect(res.status).toBe(400);
  });

  it('répond 404 si pas de rôle PROVIDER', async () => {
    getUserProfile.mockResolvedValue({
      _id: ID,
      roles: [ROLES.CUSTOMER],
      status: USER_STATUSES.ACTIVE,
    });
    const res = await GET(new NextRequest(`http://localhost/api/providers/${ID}`), {
      params: { id: ID },
    });
    expect(res.status).toBe(404);
  });

  it('répond 404 si prestataire inactif', async () => {
    getUserProfile.mockResolvedValue({
      _id: ID,
      roles: [ROLES.PROVIDER],
      status: USER_STATUSES.SUSPENDED,
    });
    const res = await GET(new NextRequest(`http://localhost/api/providers/${ID}`), {
      params: { id: ID },
    });
    expect(res.status).toBe(404);
  });

  it('retourne le prestataire actif', async () => {
    const res = await GET(new NextRequest(`http://localhost/api/providers/${ID}`), {
      params: { id: ID },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('pro@test.fr');
  });
});
