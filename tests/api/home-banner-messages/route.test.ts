/**
 * GET/POST /api/home-banner-messages
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiErrors } from '@/lib/api/error-handler';
import { ROLES } from '@/lib/constants';

const {
  requireApiRoles,
  listBannerMessages,
  toBannerMessage,
  invalidateHomeContent,
  create,
} = vi.hoisted(() => ({
  requireApiRoles: vi.fn(),
  listBannerMessages: vi.fn(),
  toBannerMessage: vi.fn((doc: unknown) => doc),
  invalidateHomeContent: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({ requireApiRoles }));
vi.mock('@/lib/home-content.server', () => ({
  listBannerMessages,
  toBannerMessage,
  invalidateHomeContent,
}));
vi.mock('@/models/HomeContent', () => ({
  HomeBannerMessageModel: { create },
}));

import { GET, POST } from '@/app/api/home-banner-messages/route';

const adminSession = {
  user: { id: 'admin-1', roles: [ROLES.ADMIN] },
};

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/home-banner-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('/api/home-banner-messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue(adminSession);
    listBannerMessages.mockResolvedValue([
      { id: 'm1', text: 'Hello', order: 1, active: true },
    ]);
  });

  describe('GET', () => {
    it('refuse sans rôle admin', async () => {
      requireApiRoles.mockRejectedValue(ApiErrors.FORBIDDEN);
      const res = await GET(
        new NextRequest('http://localhost/api/home-banner-messages'),
      );
      expect(res.status).toBe(403);
    });

    it('liste les messages bandeau', async () => {
      const res = await GET(
        new NextRequest('http://localhost/api/home-banner-messages'),
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.messages).toHaveLength(1);
    });
  });

  describe('POST', () => {
    it('crée un message et invalide le cache home', async () => {
      create.mockResolvedValue({
        id: 'm2',
        toObject: () => ({ id: 'm2', text: 'Promo', order: 2, active: true }),
      });

      const res = await post({ textBefore: 'Promo', isActive: true });
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ textBefore: 'Promo', order: 2 }),
      );
      expect(invalidateHomeContent).toHaveBeenCalled();
    });
  });
});
