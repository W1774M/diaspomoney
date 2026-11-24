/**
 * GET /api/partners
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { dbConnect, getCollection, toArray } = vi.hoisted(() => ({
  dbConnect: vi.fn(),
  getCollection: vi.fn(),
  toArray: vi.fn(),
}));

vi.mock('@/lib/mongodb', () => ({
  default: dbConnect,
  getCollection,
}));

import { GET } from '@/app/api/partners/route';

describe('GET /api/partners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbConnect.mockResolvedValue(undefined);
    getCollection.mockResolvedValue({ find: () => ({ toArray }) });
    toArray.mockResolvedValue([
      {
        _id: 'p1',
        name: 'Partenaire A',
        logo: '/a.png',
        description: 'Desc',
        website: 'https://a.test',
        category: 'HEALTH',
        services: ['s1'],
        location: 'Paris',
        established: '2020',
      },
    ]);
  });

  it('liste les partenaires normalisés', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/partners'),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.partners).toEqual([
      {
        id: 'p1',
        name: 'Partenaire A',
        logo: '/a.png',
        description: 'Desc',
        website: 'https://a.test',
        category: 'HEALTH',
        services: ['s1'],
        location: 'Paris',
        established: '2020',
      },
    ]);
  });

  it('répond 500 si Mongo échoue', async () => {
    dbConnect.mockRejectedValue(new Error('boom'));
    const res = await GET(
      new NextRequest('http://localhost/api/partners'),
    );
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/partners/i);
  });
});
