/**
 * MongoMessageRepository — chemins unitaires avec Message mocké
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectId } from 'mongodb';

const {
  findById,
  find,
  countDocuments,
  updateOne,
  updateMany,
  deleteOne,
  save,
  MessageCtor,
} = vi.hoisted(() => {
  const save = vi.fn();
  const MessageCtor = vi.fn(function (this: Record<string, unknown>, data: Record<string, unknown>) {
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
    updateOne: vi.fn(),
    updateMany: vi.fn(),
    deleteOne: vi.fn(),
    save,
    MessageCtor,
  };
});

vi.mock('@/models/Message', () => ({
  default: Object.assign(MessageCtor, {
    findById,
    find,
    countDocuments,
    updateOne,
    updateMany,
    deleteOne,
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

import { MongoMessageRepository } from '@/repositories/implementations/MongoMessageRepository';

const CONV = '507f1f77bcf86cd799439011';
const USER = '507f1f77bcf86cd799439012';
const MSG = '507f1f77bcf86cd799439013';

describe('MongoMessageRepository', () => {
  let repo: MongoMessageRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new MongoMessageRepository();
    const lean = vi.fn().mockResolvedValue([
      {
        _id: new ObjectId(MSG),
        conversationId: new ObjectId(CONV),
        senderId: new ObjectId(USER),
        text: 'bonjour',
        read: false,
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const limit = vi.fn(() => ({ lean }));
    const skip = vi.fn(() => ({ limit }));
    const sort = vi.fn(() => ({ skip }));
    find.mockReturnValue({ sort });
    countDocuments.mockResolvedValue(1);
    save.mockResolvedValue(undefined);
  });

  it('findById mappe un document ou renvoie null', async () => {
    findById.mockResolvedValueOnce({
      _id: new ObjectId(MSG),
      conversationId: new ObjectId(CONV),
      senderId: new ObjectId(USER),
      text: 'hi',
      read: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const found = await repo.findById(MSG);
    expect(found?.text).toBe('hi');
    expect(found?.id).toBe(MSG);

    findById.mockResolvedValueOnce(null);
    expect(await repo.findById(MSG)).toBeNull();
  });

  it('findByConversation pagine et inverse l’ordre', async () => {
    const result = await repo.findByConversation(CONV, { limit: 10, page: 1 });
    expect(result.total).toBe(1);
    expect(result.data[0]?.text).toBe('bonjour');
    expect(result.pagination.hasNext).toBe(false);
    expect(find).toHaveBeenCalled();
  });

  it('create persiste un message', async () => {
    const created = await repo.create({
      conversationId: CONV,
      senderId: USER,
      text: 'nouveau',
      attachments: [],
    } as any);
    expect(MessageCtor).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
    expect(created.text).toBe('nouveau');
  });

  it('markAsRead / markConversationAsRead / delete / countUnread', async () => {
    updateOne.mockResolvedValue({ modifiedCount: 1 });
    updateMany.mockResolvedValue({ modifiedCount: 3 });
    deleteOne.mockResolvedValue({ deletedCount: 1 });
    countDocuments.mockResolvedValue(2);

    expect(await repo.markAsRead(MSG, USER)).toBe(true);
    expect(await repo.markConversationAsRead(CONV, USER)).toBe(3);
    expect(await repo.delete(MSG)).toBe(true);
    expect(await repo.countUnread(CONV, USER)).toBe(2);
  });

  it('propage les erreurs findById', async () => {
    findById.mockRejectedValueOnce(new Error('mongo'));
    await expect(repo.findById(MSG)).rejects.toThrow('mongo');
  });
});
