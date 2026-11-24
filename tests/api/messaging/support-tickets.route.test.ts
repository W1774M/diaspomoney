/**
 * GET /api/messaging/support/tickets
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const USER = '507f1f77bcf86cd799439011';

const { mockAuth, dbConnect, lean } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  dbConnect: vi.fn(async () => undefined),
  lean: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/mongodb', () => ({ default: dbConnect }));
vi.mock('@/models/SupportTicket', () => ({
  default: {
    find: vi.fn(() => ({
      populate: () => ({
        sort: () => ({ lean }),
      }),
    })),
  },
}));

import { GET } from '@/app/api/messaging/support/tickets/route';

describe('GET /api/messaging/support/tickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: USER } });
    lean.mockResolvedValue([
      {
        _id: { toString: () => 't1' },
        userId: { toString: () => USER },
        status: 'OPEN',
        priority: 'HIGH',
        subject: 'Paiement',
        description: 'Le reçu manque',
        messages: [{ toString: () => 'm1' }],
        assignedTo: { _id: { toString: () => 'agent-1' } },
        createdAt: new Date('2026-06-01'),
        updatedAt: new Date('2026-06-02'),
      },
      {
        _id: { toString: () => 't2' },
        userId: { toString: () => USER },
        status: 'CLOSED',
        priority: 'LOW',
        subject: 'Autre',
        description: '',
        createdAt: new Date('2026-05-01'),
        updatedAt: new Date('2026-05-02'),
      },
    ]);
  });

  it('refuse sans session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(new NextRequest('http://localhost/api/messaging/support/tickets'));
    expect(res.status).toBe(401);
    expect(dbConnect).toHaveBeenCalled();
  });

  it('renvoie les tickets de la personne, avec ou sans agent', async () => {
    const res = await GET(new NextRequest('http://localhost/api/messaging/support/tickets'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.tickets[0]).toMatchObject({
      _id: 't1',
      messages: ['m1'],
      assignedTo: 'agent-1',
    });
    expect(body.tickets[1].messages).toEqual([]);
    expect(body.tickets[1].assignedTo).toBeUndefined();
  });

  it('répond 500 si la lecture échoue', async () => {
    lean.mockRejectedValue(new Error('db'));
    const res = await GET(new NextRequest('http://localhost/api/messaging/support/tickets'));
    expect(res.status).toBe(500);
  });
});
