/**
 * POST /api/roadmap/subscribe
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  findOne,
  insertOne,
  createIndex,
  sendEmail,
} = vi.hoisted(() => ({
  findOne: vi.fn(),
  insertOne: vi.fn(),
  createIndex: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/database/mongodb', () => ({
  getMongoClient: async () => ({
    db: () => ({
      collection: () => ({ findOne, insertOne, createIndex }),
    }),
  }),
}));
vi.mock('@/lib/email/resend', () => ({ sendEmail }));

import { POST } from '@/app/api/roadmap/subscribe/route';

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/roadmap/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/roadmap/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createIndex.mockResolvedValue('email_1');
    findOne.mockResolvedValue(null);
    insertOne.mockResolvedValue({ insertedId: '1' });
    sendEmail.mockResolvedValue(undefined);
  });

  it('répond 400 pour un email invalide', async () => {
    const res = await post({ email: 'pas-un-email' });
    expect(res.status).toBe(400);
    expect(insertOne).not.toHaveBeenCalled();
  });

  it('indique alreadySubscribed si déjà inscrit', async () => {
    findOne.mockResolvedValue({ email: 'ada@test.fr' });
    const res = await post({ email: 'Ada@Test.fr' });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.alreadySubscribed).toBe(true);
    expect(insertOne).not.toHaveBeenCalled();
  });

  it('inscrit et envoie un email de confirmation', async () => {
    const res = await post({ email: 'ada@test.fr' });
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(insertOne).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ada@test.fr' }),
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'ada@test.fr' }),
    );
  });
});
