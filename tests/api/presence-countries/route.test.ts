/**
 * GET/POST /api/presence-countries
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiErrors } from '@/lib/api/error-handler';
import { ROLES } from '@/lib/constants';

const {
  requireApiRoles,
  listPresenceCountries,
  toPresenceCountry,
  create,
} = vi.hoisted(() => ({
  requireApiRoles: vi.fn(),
  listPresenceCountries: vi.fn(),
  toPresenceCountry: vi.fn((doc: unknown) => doc),
  create: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({ requireApiRoles }));
vi.mock('@/lib/presence-countries.server', () => ({
  listPresenceCountries,
  toPresenceCountry,
}));
vi.mock('@/models/PresenceCountry', () => ({
  default: { create },
}));

import { GET, POST } from '@/app/api/presence-countries/route';

const adminSession = {
  user: { id: 'admin-1', roles: [ROLES.ADMIN] },
};

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/presence-countries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('/api/presence-countries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue(adminSession);
    listPresenceCountries.mockResolvedValue([
      { iso: 'SN', name: 'Sénégal', order: 1 },
    ]);
  });

  describe('GET', () => {
    it('liste les pays (public)', async () => {
      const res = await GET(
        new NextRequest('http://localhost/api/presence-countries'),
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.countries).toHaveLength(1);
      expect(res.headers.get('Cache-Control')).toMatch(/no-store/);
    });
  });

  describe('POST', () => {
    it('refuse sans rôle admin', async () => {
      requireApiRoles.mockRejectedValue(ApiErrors.FORBIDDEN);
      const res = await post({
        iso: 'CI',
        name: 'Côte d’Ivoire',
        preposition: 'en',
        status: 'coming_soon',
      });
      expect(res.status).toBe(403);
      expect(create).not.toHaveBeenCalled();
    });

    it('répond 409 si le pays existe déjà', async () => {
      const res = await post({
        iso: 'SN',
        name: 'Sénégal',
        preposition: 'au',
        status: 'present',
      });
      expect(res.status).toBe(409);
      expect(create).not.toHaveBeenCalled();
    });

    it('crée un pays avec order auto-incrémenté', async () => {
      create.mockResolvedValue({
        id: 'new1',
        toObject: () => ({
          iso: 'CI',
          name: 'Côte d’Ivoire',
          preposition: 'en',
          status: 'coming_soon',
          order: 2,
        }),
      });

      const res = await post({
        iso: 'CI',
        name: 'Côte d’Ivoire',
        preposition: 'en',
        status: 'coming_soon',
      });
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ iso: 'CI', order: 2 }),
      );
    });
  });
});
