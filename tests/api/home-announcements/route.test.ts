/**
 * GET/POST /api/home-announcements
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiErrors } from '@/lib/api/error-handler';
import { ROLES } from '@/lib/constants';

const {
  requireApiRoles,
  listAnnouncements,
  toAnnouncement,
  invalidateHomeContent,
  create,
  dbConnect,
} = vi.hoisted(() => ({
  requireApiRoles: vi.fn(),
  listAnnouncements: vi.fn(),
  toAnnouncement: vi.fn((doc: unknown) => doc),
  invalidateHomeContent: vi.fn(),
  create: vi.fn(),
  dbConnect: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({ requireApiRoles }));
vi.mock('@/lib/home-content.server', () => ({
  listAnnouncements,
  toAnnouncement,
  invalidateHomeContent,
}));
vi.mock('@/lib/mongodb', () => ({ default: dbConnect }));
vi.mock('@/models/HomeContent', () => ({
  HomeAnnouncementModel: { create },
}));

import { GET, POST } from '@/app/api/home-announcements/route';

const adminSession = { user: { id: 'admin-1', roles: [ROLES.ADMIN] } };

const validBody = {
  title: 'Offre rentrée',
  message: 'Découvrez nos packs',
  imageUrl: '/uploads/announcements/a.png',
  imageAlt: 'Illustration offre',
  isActive: true,
};

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/home-announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('/api/home-announcements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue(adminSession);
    listAnnouncements.mockResolvedValue([{ id: 'a1', title: 'Hello' }]);
    dbConnect.mockResolvedValue(undefined);
  });

  describe('GET', () => {
    it('refuse sans rôle admin', async () => {
      requireApiRoles.mockRejectedValue(ApiErrors.FORBIDDEN);
      const res = await GET(
        new NextRequest('http://localhost/api/home-announcements'),
      );
      expect(res.status).toBe(403);
    });

    it('liste les annonces', async () => {
      const res = await GET(
        new NextRequest('http://localhost/api/home-announcements'),
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.announcements).toHaveLength(1);
    });
  });

  describe('POST', () => {
    it('crée une annonce et invalide le cache', async () => {
      create.mockResolvedValue({
        id: 'a2',
        toObject: () => ({ ...validBody, id: 'a2' }),
      });

      const res = await post(validBody);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(create).toHaveBeenCalled();
      expect(invalidateHomeContent).toHaveBeenCalled();
    });
  });
});
