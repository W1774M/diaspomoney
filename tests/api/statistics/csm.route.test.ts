/**
 * GET /api/statistics/csm
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { ROLES } from '@/lib/constants';

const CSM_ID = '507f1f77bcf86cd799439011';
const PROV_ID = '507f1f77bcf86cd799439022';

const { mockAuth, usersFindOne, bookingsFind, toArray, findComplaintsWithFilters } =
  vi.hoisted(() => {
    const toArray = vi.fn();
    const bookingsFind = vi.fn(() => ({ toArray }));
    return {
      mockAuth: vi.fn(),
      usersFindOne: vi.fn(),
      bookingsFind,
      toArray,
      findComplaintsWithFilters: vi.fn(),
    };
  });

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/database/mongodb', () => ({
  getMongoClient: vi.fn(async () => ({
    db: () => ({
      collection: (name: string) => {
        if (name === 'users') {
          return { findOne: usersFindOne };
        }
        return { find: bookingsFind };
      },
    }),
  })),
}));
vi.mock('@/repositories', () => ({
  getComplaintRepository: () => ({ findComplaintsWithFilters }),
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { GET } from '@/app/api/statistics/csm/route';

function get() {
  return GET(new NextRequest('http://localhost/api/statistics/csm'));
}

describe('GET /api/statistics/csm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: CSM_ID, roles: [ROLES.CSM] },
    });
    usersFindOne.mockResolvedValue({
      _id: new ObjectId(CSM_ID),
      csmPortfolioProviderIds: [PROV_ID],
    });
    toArray.mockResolvedValue([
      { id: 'b1', requesterId: 'c1', providerId: PROV_ID, status: 'FINISHED' },
      { id: 'b2', requesterId: 'c2', providerId: PROV_ID, status: 'PENDING' },
    ]);
    findComplaintsWithFilters.mockResolvedValue({
      data: [
        { status: 'RESOLVED', appointmentId: 'b1' },
        { status: 'OPEN', appointmentId: 'b2' },
      ],
    });
  });

  it('refuse sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
  });

  it('refuse non-CSM', async () => {
    mockAuth.mockResolvedValue({
      user: { id: CSM_ID, roles: [ROLES.ADMIN] },
    });
    expect((await get()).status).toBe(403);
  });

  it('retourne des stats vides sans portefeuille', async () => {
    usersFindOne.mockResolvedValue({ csmPortfolioProviderIds: [] });
    const res = await get();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.statistics).toEqual({
      managedOrders: 0,
      assignedClients: 0,
      coordinatedProviders: 0,
      satisfactionRate: 0,
      resolvedTickets: 0,
    });
  });

  it('agrège bookings et tickets résolus', async () => {
    const res = await get();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.statistics.managedOrders).toBe(2);
    expect(body.statistics.assignedClients).toBe(2);
    expect(body.statistics.coordinatedProviders).toBe(1);
    expect(body.statistics.satisfactionRate).toBe(50);
    expect(body.statistics.resolvedTickets).toBe(1);
  });

  it('garde resolvedTickets à 0 si complaints échoue', async () => {
    findComplaintsWithFilters.mockRejectedValue(new Error('mongo'));
    const res = await get();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.statistics.resolvedTickets).toBe(0);
  });
});
