/**
 * PATCH/DELETE /api/home-announcements/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiErrors } from '@/lib/api/error-handler';
import { ROLES } from '@/lib/constants';

const ID = '507f1f77bcf86cd799439011';

const {
  requireApiRoles,
  invalidateHomeContent,
  deleteAnnouncementImageIfUnused,
  toAnnouncement,
  findById,
  findByIdAndUpdate,
  findByIdAndDelete,
  dbConnect,
} = vi.hoisted(() => {
  const leanFind = vi.fn();
  const leanUpdate = vi.fn();
  const leanDelete = vi.fn();
  return {
    requireApiRoles: vi.fn(),
    invalidateHomeContent: vi.fn(),
    deleteAnnouncementImageIfUnused: vi.fn(),
    toAnnouncement: vi.fn((doc: unknown) => doc),
    findById: vi.fn(() => ({ lean: leanFind })),
    findByIdAndUpdate: vi.fn(() => ({ lean: leanUpdate })),
    findByIdAndDelete: vi.fn(() => ({ lean: leanDelete })),
    dbConnect: vi.fn(),
    leanFind,
    leanUpdate,
    leanDelete,
  };
});

vi.mock('@/lib/api/auth', () => ({ requireApiRoles }));
vi.mock('@/lib/home-content.server', () => ({
  invalidateHomeContent,
  deleteAnnouncementImageIfUnused,
  toAnnouncement,
}));
vi.mock('@/lib/mongodb', () => ({ default: dbConnect }));
vi.mock('@/models/HomeContent', () => ({
  HomeAnnouncementModel: { findById, findByIdAndUpdate, findByIdAndDelete },
}));

import { PATCH, DELETE } from '@/app/api/home-announcements/[id]/route';

const adminSession = { user: { id: 'admin-1', roles: [ROLES.ADMIN] } };
const params = { params: { id: ID } };

function patch(body: unknown) {
  return PATCH(
    new NextRequest(`http://localhost/api/home-announcements/${ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params,
  );
}

describe('/api/home-announcements/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue(adminSession);
    dbConnect.mockResolvedValue(undefined);
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: ID,
        title: 'Old',
        imageUrl: '/uploads/announcements/old.png',
      }),
    });
    findByIdAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: ID,
        title: 'New',
        imageUrl: '/uploads/announcements/new.png',
      }),
    });
    findByIdAndDelete.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: ID,
        imageUrl: '/uploads/announcements/old.png',
      }),
    });
  });

  describe('PATCH', () => {
    it('refuse sans rôle admin', async () => {
      requireApiRoles.mockRejectedValue(ApiErrors.FORBIDDEN);
      expect((await patch({ title: 'X' })).status).toBe(403);
    });

    it('répond 404 pour un id invalide', async () => {
      const res = await PATCH(
        new NextRequest('http://localhost/api/home-announcements/bad', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'X' }),
        }),
        { params: { id: 'bad' } },
      );
      expect(res.status).toBe(404);
    });

    it('met à jour et purge l’ancienne image si changée', async () => {
      const res = await patch({
        title: 'New',
        imageUrl: '/uploads/announcements/new.png',
      });
      expect(res.status).toBe(200);
      expect(deleteAnnouncementImageIfUnused).toHaveBeenCalledWith(
        '/uploads/announcements/old.png',
      );
      expect(invalidateHomeContent).toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    it('supprime l’annonce et son image', async () => {
      const res = await DELETE(
        new NextRequest(`http://localhost/api/home-announcements/${ID}`, {
          method: 'DELETE',
        }),
        params,
      );
      expect(res.status).toBe(200);
      expect(deleteAnnouncementImageIfUnused).toHaveBeenCalled();
      expect(invalidateHomeContent).toHaveBeenCalled();
    });
  });
});
