/**
 * POST /api/home-announcements/images
 * GET  /api/home-announcements/images/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { ApiErrors } from '@/lib/api/error-handler';
import { ROLES } from '@/lib/constants';

const { requireApiRoles, insertOne, findOne } = vi.hoisted(() => ({
  requireApiRoles: vi.fn(),
  insertOne: vi.fn(),
  findOne: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({ requireApiRoles }));
vi.mock('@/lib/mongodb', () => ({
  getCollection: async () => ({ insertOne, findOne }),
}));

import { POST } from '@/app/api/home-announcements/images/route';
import { GET } from '@/app/api/home-announcements/images/[id]/route';

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const IMG_ID = '507f1f77bcf86cd799439011';

function postForm(file?: File) {
  const form = new FormData();
  if (file) form.append('image', file);
  return POST(
    new NextRequest('http://localhost/api/home-announcements/images', {
      method: 'POST',
      body: form,
    }),
  );
}

describe('/api/home-announcements/images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue({
      user: { id: 'admin-1', roles: [ROLES.ADMIN] },
    });
    insertOne.mockResolvedValue({ insertedId: new ObjectId(IMG_ID) });
  });

  describe('POST', () => {
    it('refuse sans rôle admin', async () => {
      requireApiRoles.mockRejectedValue(ApiErrors.FORBIDDEN);
      expect(
        (
          await postForm(
            new File([PNG_BYTES], 'a.png', { type: 'image/png' }),
          )
        ).status,
      ).toBe(403);
    });

    it('répond 400 sans fichier', async () => {
      expect((await postForm()).status).toBe(400);
    });

    it('refuse un format non image (signature)', async () => {
      const res = await postForm(
        new File(['not-an-image'], 'x.txt', { type: 'text/plain' }),
      );
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/Format/i);
    });

    it('téléverse un PNG et renvoie l’URL', async () => {
      const res = await postForm(
        new File([PNG_BYTES], 'a.png', { type: 'image/png' }),
      );
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.url).toBe(`/api/home-announcements/images/${IMG_ID}`);
      expect(insertOne).toHaveBeenCalled();
    });
  });

  describe('GET [id]', () => {
    it('répond 404 pour un id invalide', async () => {
      const res = await GET(new Request('http://localhost/api/home-announcements/images/bad'), {
        params: { id: 'bad' },
      });
      expect(res.status).toBe(404);
    });

    it('sert l’image avec cache immutable', async () => {
      findOne.mockResolvedValue({
        data: { buffer: PNG_BYTES },
        contentType: 'image/png',
      });
      const res = await GET(
        new Request(`http://localhost/api/home-announcements/images/${IMG_ID}`),
        { params: { id: IMG_ID } },
      );
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('image/png');
      expect(res.headers.get('Cache-Control')).toMatch(/immutable/);
    });
  });
});
