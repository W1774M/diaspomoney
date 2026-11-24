/**
 * POST /api/roadmap/become-provider
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { insertOne } = vi.hoisted(() => ({
  insertOne: vi.fn(),
}));

vi.mock('@/lib/database/mongodb', () => ({
  getMongoClient: async () => ({
    db: () => ({
      collection: () => ({ insertOne }),
    }),
  }),
}));

import { POST } from '@/app/api/roadmap/become-provider/route';

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/roadmap/become-provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/roadmap/become-provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertOne.mockResolvedValue({ insertedId: '1' });
  });

  it('répond 400 si champs manquants', async () => {
    const res = await post({ name: 'Ada' });
    expect(res.status).toBe(400);
    expect(insertOne).not.toHaveBeenCalled();
  });

  it('enregistre la demande prestataire', async () => {
    const res = await post({
      name: 'Ada Lovelace',
      email: 'Ada@Test.fr',
      phone: '0601020304',
    });
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ada Lovelace',
        email: 'ada@test.fr',
        phone: '0601020304',
      }),
    );
  });
});
