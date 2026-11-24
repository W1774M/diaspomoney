/**
 * GET/POST/DELETE /api/messaging/attachments
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectId } from 'mongodb';

const USER = '507f1f77bcf86cd799439011';
const OTHER = '507f1f77bcf86cd799439012';
const ATT_ID = '507f1f77bcf86cd799439013';
const CONV = '507f1f77bcf86cd799439014';

const {
  mockAuth,
  find,
  findOne,
  findOneAndDelete,
  save,
  AttachmentCtor,
  existsSync,
  mkdir,
  writeFile,
  unlink,
} = vi.hoisted(() => {
  const save = vi.fn();
  const AttachmentCtor = vi.fn(function (this: Record<string, unknown>, data: Record<string, unknown>) {
    Object.assign(this, data, {
      _id: new ObjectId(ATT_ID),
      createdAt: new Date(),
      save,
    });
  });
  return {
    mockAuth: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndDelete: vi.fn(),
    save,
    AttachmentCtor,
    existsSync: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
  };
});

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/models/Attachment', () => ({
  default: Object.assign(AttachmentCtor, { find, findOne, findOneAndDelete }),
}));
vi.mock('fs', () => ({ existsSync }));
vi.mock('fs/promises', () => ({ mkdir, writeFile, unlink }));

import { GET, POST, DELETE } from '@/app/api/messaging/attachments/route';

function get(qs = '') {
  return GET(new NextRequest(`http://localhost/api/messaging/attachments${qs}`));
}

function del(qs: string) {
  return DELETE(new NextRequest(`http://localhost/api/messaging/attachments${qs}`, { method: 'DELETE' }));
}

describe('/api/messaging/attachments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: USER } });
    existsSync.mockReturnValue(true);
    mkdir.mockResolvedValue(undefined);
    writeFile.mockResolvedValue(undefined);
    unlink.mockResolvedValue(undefined);
    save.mockResolvedValue(undefined);
    findOneAndDelete.mockResolvedValue({});
  });

  describe('GET', () => {
    it('répond 401 sans session', async () => {
      mockAuth.mockResolvedValue(null);
      expect((await get()).status).toBe(401);
    });

    it('liste les pièces jointes filtrées (image + search)', async () => {
      const lean = vi.fn().mockResolvedValue([
        {
          _id: new ObjectId(ATT_ID),
          name: 'photo.png',
          type: 'image/png',
          size: 100,
          url: '/uploads/attachments/x.png',
          uploadedBy: { name: 'Ada' },
          createdAt: new Date('2026-01-01'),
          conversationId: new ObjectId(CONV),
        },
      ]);
      const populate = vi.fn(() => ({ lean }));
      const sort = vi.fn(() => ({ populate }));
      find.mockReturnValue({ sort });

      const res = await get(`?conversationId=${CONV}&type=image&search=photo`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.attachments).toHaveLength(1);
      expect(body.attachments[0].name).toBe('photo.png');
      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedBy: expect.anything(),
          conversationId: expect.anything(),
          type: { $regex: /^image\// },
          name: { $regex: 'photo', $options: 'i' },
        }),
      );
    });
  });

  describe('POST', () => {
    it('répond 400 sans fichier', async () => {
      const form = new FormData();
      const res = await POST(
        new NextRequest('http://localhost/api/messaging/attachments', {
          method: 'POST',
          body: form,
        }),
      );
      expect(res.status).toBe(400);
    });

    it('refuse un type non autorisé', async () => {
      const form = new FormData();
      form.append('file', new File(['x'], 'x.exe', { type: 'application/octet-stream' }));
      const res = await POST(
        new NextRequest('http://localhost/api/messaging/attachments', {
          method: 'POST',
          body: form,
        }),
      );
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/non autorisé/i);
    });

    it('refuse un fichier trop volumineux', async () => {
      const form = new FormData();
      const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.pdf', {
        type: 'application/pdf',
      });
      form.append('file', big);
      expect(
        (
          await POST(
            new NextRequest('http://localhost/api/messaging/attachments', {
              method: 'POST',
              body: form,
            }),
          )
        ).status,
      ).toBe(400);
    });

    it('upload un PDF et crée l’entrée', async () => {
      existsSync.mockReturnValue(false);
      const form = new FormData();
      form.append('file', new File(['hello'], 'doc.pdf', { type: 'application/pdf' }));
      form.append('conversationId', CONV);

      const res = await POST(
        new NextRequest('http://localhost/api/messaging/attachments', {
          method: 'POST',
          body: form,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mkdir).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();
      expect(AttachmentCtor).toHaveBeenCalled();
      expect(save).toHaveBeenCalled();
      expect(body.attachment.name).toBe('doc.pdf');
    });
  });

  describe('DELETE', () => {
    it('répond 400 sans id', async () => {
      expect((await del('')).status).toBe(400);
    });

    it('répond 404 si introuvable', async () => {
      findOne.mockResolvedValue(null);
      expect((await del(`?id=${ATT_ID}`)).status).toBe(404);
    });

    it('répond 403 si non propriétaire', async () => {
      findOne.mockResolvedValue({
        uploadedBy: { toString: () => OTHER },
        url: '/uploads/attachments/x.pdf',
      });
      expect((await del(`?id=${ATT_ID}`)).status).toBe(403);
    });

    it('supprime le fichier et l’entrée', async () => {
      findOne.mockResolvedValue({
        uploadedBy: { toString: () => USER },
        url: '/uploads/attachments/x.pdf',
      });
      const res = await del(`?id=${ATT_ID}`);
      expect(res.status).toBe(200);
      expect(unlink).toHaveBeenCalled();
      expect(findOneAndDelete).toHaveBeenCalled();
    });
  });
});
