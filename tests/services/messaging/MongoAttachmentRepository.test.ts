/**
 * MongoAttachmentRepository — chemins unitaires
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectId } from 'mongodb';

const {
  findById,
  find,
  countDocuments,
  deleteOne,
  deleteMany,
  save,
  AttachmentCtor,
} = vi.hoisted(() => {
  const save = vi.fn();
  const AttachmentCtor = vi.fn(function (this: Record<string, unknown>, data: Record<string, unknown>) {
    Object.assign(this, data, {
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      save,
    });
  });
  return {
    findById: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
    save,
    AttachmentCtor,
  };
});

vi.mock('@/models/Attachment', () => ({
  default: Object.assign(AttachmentCtor, {
    findById,
    find,
    countDocuments,
    deleteOne,
    deleteMany,
  }),
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));
vi.mock('@/lib/decorators/log.decorator', () => ({
  Log: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
}));
vi.mock('@/lib/decorators/cache.decorator', () => ({
  Cacheable: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  InvalidateCache: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
}));

import { MongoAttachmentRepository } from '@/repositories/implementations/MongoAttachmentRepository';

const ATT = '507f1f77bcf86cd799439011';
const USER = '507f1f77bcf86cd799439012';
const CONV = '507f1f77bcf86cd799439013';
const MSG = '507f1f77bcf86cd799439014';

describe('MongoAttachmentRepository', () => {
  let repo: MongoAttachmentRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new MongoAttachmentRepository();
    const lean = vi.fn().mockResolvedValue([
      {
        _id: new ObjectId(ATT),
        name: 'a.pdf',
        type: 'application/pdf',
        size: 10,
        url: '/uploads/a.pdf',
        uploadedBy: new ObjectId(USER),
        conversationId: new ObjectId(CONV),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    find.mockImplementation(() => {
      const q: any = {};
      q.skip = vi.fn(() => q);
      q.limit = vi.fn(() => q);
      q.lean = lean;
      return q;
    });
    countDocuments.mockResolvedValue(1);
    save.mockResolvedValue(undefined);
  });

  it('findById mappe ou renvoie null', async () => {
    findById.mockResolvedValueOnce({
      _id: new ObjectId(ATT),
      name: 'x.png',
      type: 'image/png',
      size: 1,
      url: '/x.png',
      uploadedBy: new ObjectId(USER),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect((await repo.findById(ATT))?.name).toBe('x.png');
    findById.mockResolvedValueOnce(null);
    expect(await repo.findById(ATT)).toBeNull();
  });

  it('findByUser applique filtres et pagination', async () => {
    const result = await repo.findByUser(
      USER,
      { conversationId: CONV, messageId: MSG, type: 'application/pdf', search: 'a' },
      { page: 1, limit: 10 },
    );
    expect(result.total).toBe(1);
    expect(result.data[0]?.name).toBe('a.pdf');
    expect(result.pagination.hasPrev).toBe(false);
  });

  it('create / delete / deleteByMessage', async () => {
    const created = await repo.create({
      name: 'doc.pdf',
      type: 'application/pdf',
      size: 5,
      url: '/uploads/doc.pdf',
      uploadedBy: USER,
      conversationId: CONV,
      messageId: MSG,
    } as any);
    expect(AttachmentCtor).toHaveBeenCalled();
    expect(created.name).toBe('doc.pdf');

    deleteOne.mockResolvedValue({ deletedCount: 1 });
    expect(await repo.delete(ATT)).toBe(true);

    deleteMany.mockResolvedValue({ deletedCount: 2 });
    expect(await repo.deleteByMessage(MSG)).toBe(2);
  });

  it('propage les erreurs findById', async () => {
    findById.mockRejectedValueOnce(new Error('mongo'));
    await expect(repo.findById(ATT)).rejects.toThrow('mongo');
  });
});
