/**
 * GET/PUT /api/users/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const USER = '507f1f77bcf86cd799439011';

const { mockAuth, getUserProfile, updateUser } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  getUserProfile: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/user/user.service', () => ({
  userService: { getUserProfile, updateUser },
}));

import { GET, PUT } from '@/app/api/users/[id]/route';

const params = { params: { id: USER } };

function get() {
  return GET(new NextRequest(`http://localhost/api/users/${USER}`), params);
}

function put(body: Record<string, unknown>) {
  return PUT(
    new NextRequest(`http://localhost/api/users/${USER}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params,
  );
}

describe('/api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: USER, email: 'ada@test.fr', roles: ['ADMIN'] },
    });
    getUserProfile.mockResolvedValue({
      id: USER,
      email: 'ada@test.fr',
      firstName: 'Ada',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
    });
  });

  describe('GET', () => {
    it('répond 401 sans session', async () => {
      mockAuth.mockResolvedValue(null);
      expect((await get()).status).toBe(401);
    });

    it('répond 400 pour un ID invalide', async () => {
      const res = await GET(
        new NextRequest('http://localhost/api/users/bad'),
        { params: { id: 'bad' } },
      );
      expect(res.status).toBe(400);
    });

    it('répond 404 si utilisateur introuvable', async () => {
      getUserProfile.mockRejectedValue(new Error('Utilisateur non trouvé'));
      expect((await get()).status).toBe(404);
    });

    it('retourne le profil', async () => {
      const res = await get();
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.user.email).toBe('ada@test.fr');
      expect(body.user.createdAt).toMatch(/2026-01-01/);
    });
  });

  describe('PUT', () => {
    it('répond 401 sans session', async () => {
      mockAuth.mockResolvedValue(null);
      expect((await put({ firstName: 'Ada' })).status).toBe(401);
    });
  });
});
