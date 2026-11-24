/**
 * GET  /api/admin/provider-applications
 * PATCH /api/admin/provider-applications/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { ApiErrors } from '@/lib/api/error-handler';
import { ROLES } from '@/lib/constants';

const ID = '507f1f77bcf86cd799439011';

const { requireApiRoles, toArray, findOneAndUpdate } = vi.hoisted(() => ({
  requireApiRoles: vi.fn(),
  toArray: vi.fn(),
  findOneAndUpdate: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({ requireApiRoles }));
vi.mock('@/lib/mongodb', () => ({
  getMongoClient: async () => ({
    db: () => ({
      collection: () => ({
        find: () => ({
          sort: () => ({
            limit: () => ({ toArray }),
          }),
        }),
        findOneAndUpdate,
      }),
    }),
  }),
}));

import { GET } from '@/app/api/admin/provider-applications/route';
import { PATCH } from '@/app/api/admin/provider-applications/[id]/route';

const adminSession = { user: { id: 'admin-1', roles: [ROLES.ADMIN] } };

describe('/api/admin/provider-applications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue(adminSession);
    toArray.mockResolvedValue([
      {
        _id: new ObjectId(ID),
        name: 'Ada',
        email: 'ada@test.fr',
        phone: '0601020304',
        status: 'new',
        submittedAt: new Date('2026-01-01'),
      },
    ]);
    findOneAndUpdate.mockResolvedValue({
      _id: new ObjectId(ID),
      name: 'Ada',
      email: 'ada@test.fr',
      phone: '0601020304',
      status: 'contacted',
      note: 'OK',
    });
  });

  describe('GET', () => {
    it('refuse sans admin', async () => {
      requireApiRoles.mockRejectedValue(ApiErrors.FORBIDDEN);
      const res = await GET(
        new NextRequest('http://localhost/api/admin/provider-applications'),
      );
      expect(res.status).toBe(403);
    });

    it('liste les candidatures', async () => {
      const res = await GET(
        new NextRequest('http://localhost/api/admin/provider-applications'),
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.applications).toHaveLength(1);
      expect(body.applications[0].email).toBe('ada@test.fr');
      expect(res.headers.get('Cache-Control')).toMatch(/no-store/);
    });
  });

  describe('PATCH [id]', () => {
    it('répond 404 pour id invalide', async () => {
      const res = await PATCH(
        new NextRequest('http://localhost/api/admin/provider-applications/bad', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'contacted' }),
        }),
        { params: Promise.resolve({ id: 'bad' }) },
      );
      expect(res.status).toBe(404);
    });

    it('met à jour le statut', async () => {
      const res = await PATCH(
        new NextRequest(
          `http://localhost/api/admin/provider-applications/${ID}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'contacted', note: 'OK' }),
          },
        ),
        { params: Promise.resolve({ id: ID }) },
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.application.status).toBe('contacted');
    });
  });
});
