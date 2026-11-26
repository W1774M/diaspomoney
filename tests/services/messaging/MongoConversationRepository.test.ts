/**
 * MongoConversationRepository — chemins unitaires
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectId } from 'mongodb';

const {
  findById,
  find,
  findOne,
  countDocuments,
  findByIdAndUpdate,
  updateOne,
  deleteOne,
  save,
  ConversationCtor,
} = vi.hoisted(() => {
  const save = vi.fn();
  const ConversationCtor = vi.fn(function (this: Record<string, unknown>, data: Record<string, unknown>) {
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
    findOne: vi.fn(),
    countDocuments: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    save,
    ConversationCtor,
  };
});

vi.mock('@/models/Conversation', () => ({
  default: Object.assign(ConversationCtor, {
    findById,
    find,
    findOne,
    countDocuments,
    findByIdAndUpdate,
    updateOne,
    deleteOne,
  }),
}));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn(async () => undefined) }));
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

import { MongoConversationRepository } from '@/repositories/implementations/MongoConversationRepository';

const CONV = '507f1f77bcf86cd799439011';
const USER = '507f1f77bcf86cd799439012';
const OTHER = '507f1f77bcf86cd799439013';

describe('MongoConversationRepository', () => {
  let repo: MongoConversationRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new MongoConversationRepository();
    const lean = vi.fn().mockResolvedValue([
      {
        _id: new ObjectId(CONV),
        participants: [new ObjectId(USER), new ObjectId(OTHER)],
        type: 'user',
        lastMessage: 'salut',
        lastMessageAt: new Date(),
        unreadCount: { [USER]: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const limit = vi.fn(() => ({ lean }));
    const skip = vi.fn(() => ({ limit }));
    const sort = vi.fn(() => ({ skip }));
    find.mockReturnValue({ sort, skip });
    // chain: query.sort().skip().limit().lean() — find returns query with sort that returns skip...
    find.mockImplementation(() => {
      const q: any = {};
      q.sort = vi.fn(() => q);
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
      _id: new ObjectId(CONV),
      participants: [new ObjectId(USER)],
      type: 'support',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const found = await repo.findById(CONV);
    expect(found?.type).toBe('support');
    expect(found?.id).toBe(CONV);

    findById.mockResolvedValueOnce(null);
    expect(await repo.findById(CONV)).toBeNull();
  });

  it('findByParticipant pagine', async () => {
    const result = await repo.findByParticipant(USER, { page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.data[0]?.participants).toContain(USER);
    expect(result.pagination.hasNext).toBe(false);
  });

  it('findByParticipants filtre par type', async () => {
    findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: new ObjectId(CONV),
        participants: [new ObjectId(USER), new ObjectId(OTHER)],
        type: 'support',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });
    const found = await repo.findByParticipants([USER, OTHER], 'support');
    expect(found?.type).toBe('support');
  });

  it('create / update / updateLastMessage / unread / delete', async () => {
    const created = await repo.create({
      participants: [USER, OTHER],
      type: 'user',
    } as any);
    expect(ConversationCtor).toHaveBeenCalled();
    expect(created.participants).toHaveLength(2);

    findByIdAndUpdate.mockResolvedValue({
      _id: new ObjectId(CONV),
      participants: [new ObjectId(USER)],
      type: 'user',
      lastMessage: 'maj',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect((await repo.update(CONV, { lastMessage: 'maj' } as any))?.lastMessage).toBe('maj');

    updateOne.mockResolvedValue({ modifiedCount: 1 });
    expect(await repo.updateLastMessage(CONV, 'hi', new Date())).toBe(true);
    expect(await repo.incrementUnreadCount(CONV, USER)).toBe(true);
    expect(await repo.resetUnreadCount(CONV, USER)).toBe(true);

    deleteOne.mockResolvedValue({ deletedCount: 1 });
    expect(await repo.delete(CONV)).toBe(true);
  });

  it('propage les erreurs findById', async () => {
    findById.mockRejectedValueOnce(new Error('mongo'));
    await expect(repo.findById(CONV)).rejects.toThrow('mongo');
  });
});
