/**
 * POST/DELETE /api/users/me/avatar — upload et suppression de photo de profil
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectId } from 'mongodb';

const USER = '507f1f77bcf86cd799439011';

const {
  mockAuth,
  findOne,
  updateOne,
  existsSync,
  mkdir,
  writeFile,
  unlink,
  invalidateAppCache,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  findOne: vi.fn(),
  updateOne: vi.fn(),
  existsSync: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
  invalidateAppCache: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/cache/redis', () => ({ invalidateAppCache }));
vi.mock('@/lib/mongodb', () => ({
  getMongoClient: async () => ({
    db: () => ({
      collection: () => ({ findOne, updateOne }),
    }),
  }),
}));
vi.mock('fs', () => ({ existsSync }));
vi.mock('fs/promises', () => ({ mkdir, writeFile, unlink }));

import { POST, DELETE } from '@/app/api/users/me/avatar/route';

function postForm(form: FormData) {
  return POST(
    new NextRequest('http://localhost/api/users/me/avatar', {
      method: 'POST',
      body: form,
    }),
  );
}

describe('/api/users/me/avatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: USER, email: 'ada@test.fr' },
    });
    existsSync.mockReturnValue(true);
    mkdir.mockResolvedValue(undefined);
    writeFile.mockResolvedValue(undefined);
    unlink.mockResolvedValue(undefined);
    findOne.mockResolvedValue({
      _id: new ObjectId(USER),
      avatar: null,
    });
    updateOne.mockResolvedValue({ matchedCount: 1 });
    invalidateAppCache.mockResolvedValue(undefined);
  });

  describe('POST', () => {
    it('répond 401 sans session', async () => {
      mockAuth.mockResolvedValue(null);
      const form = new FormData();
      form.append('avatar', new File(['x'], 'a.png', { type: 'image/png' }));
      expect((await postForm(form)).status).toBe(401);
    });

    it('répond 400 sans fichier', async () => {
      const res = await postForm(new FormData());
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/fichier/i);
    });

    it('refuse un fichier non image', async () => {
      const form = new FormData();
      form.append(
        'avatar',
        new File(['x'], 'doc.pdf', { type: 'application/pdf' }),
      );
      const res = await postForm(form);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/image/i);
    });

    it('refuse un fichier trop volumineux (> 5 Mo)', async () => {
      const form = new FormData();
      form.append(
        'avatar',
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', {
          type: 'image/png',
        }),
      );
      expect((await postForm(form)).status).toBe(400);
    });

    it('upload une image, met à jour Mongo et invalide le cache', async () => {
      existsSync.mockReturnValue(false);
      const form = new FormData();
      form.append(
        'avatar',
        new File(['png-bytes'], 'photo.png', { type: 'image/png' }),
      );

      const res = await postForm(form);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.avatar).toMatch(/^\/uploads\/avatars\/507f1f77bcf86cd799439011-\d+\.png$/);
      expect(mkdir).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();
      expect(updateOne).toHaveBeenCalledWith(
        { _id: expect.any(ObjectId) },
        {
          $set: expect.objectContaining({
            avatar: body.avatar,
            updatedAt: expect.any(Date),
          }),
        },
      );
      expect(invalidateAppCache).toHaveBeenCalledWith('UserRepository');
    });

    it('supprime l’ancien avatar local s’il existe', async () => {
      findOne.mockResolvedValue({
        _id: new ObjectId(USER),
        avatar: '/uploads/avatars/old.png',
      });
      existsSync.mockReturnValue(true);

      const form = new FormData();
      form.append(
        'avatar',
        new File(['x'], 'new.jpg', { type: 'image/jpeg' }),
      );

      const res = await postForm(form);
      expect(res.status).toBe(200);
      expect(unlink).toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    it('répond 401 sans session', async () => {
      mockAuth.mockResolvedValue(null);
      expect((await DELETE()).status).toBe(401);
    });

    it('supprime l’avatar fichier + Mongo et invalide le cache', async () => {
      findOne.mockResolvedValue({
        _id: new ObjectId(USER),
        avatar: '/uploads/avatars/old.png',
      });
      existsSync.mockReturnValue(true);

      const res = await DELETE();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(unlink).toHaveBeenCalled();
      expect(updateOne).toHaveBeenCalledWith(
        { _id: expect.any(ObjectId) },
        {
          $set: expect.objectContaining({
            avatar: null,
            updatedAt: expect.any(Date),
          }),
        },
      );
      expect(invalidateAppCache).toHaveBeenCalledWith('UserRepository');
    });

    it('réussit même sans avatar existant', async () => {
      findOne.mockResolvedValue({ _id: new ObjectId(USER), avatar: null });
      const res = await DELETE();
      expect(res.status).toBe(200);
      expect(unlink).not.toHaveBeenCalled();
      expect(updateOne).toHaveBeenCalled();
    });
  });
});
