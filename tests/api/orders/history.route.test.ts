/**
 * GET /api/orders/history
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectId } from 'mongodb';

const USER = '507f1f77bcf86cd799439011';
const BOOKING = '507f1f77bcf86cd799439022';

const {
  mockAuth,
  findBookingsWithFilters,
  findAllInvoices,
  bookingFind,
  userFind,
  reviewsToArray,
  dbConnect,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  findBookingsWithFilters: vi.fn(),
  findAllInvoices: vi.fn(),
  bookingFind: vi.fn(),
  userFind: vi.fn(),
  reviewsToArray: vi.fn(),
  dbConnect: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/mongodb', () => ({
  default: dbConnect,
  getMongoClient: async () => ({
    db: () => ({
      collection: () => ({
        find: () => ({ toArray: reviewsToArray }),
      }),
    }),
  }),
}));
vi.mock('@/repositories', () => ({
  getBookingRepository: () => ({ findBookingsWithFilters }),
  getInvoiceRepository: () => ({ findAll: findAllInvoices }),
}));
vi.mock('@/models/Booking', () => ({
  default: { find: bookingFind },
}));
vi.mock('@/models/User', () => ({
  default: { find: userFind },
}));

import { GET } from '@/app/api/orders/history/route';
import { BOOKING_STATUSES } from '@/lib/constants';

describe('GET /api/orders/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: USER } });
    dbConnect.mockResolvedValue(undefined);
    findBookingsWithFilters.mockResolvedValue({ data: [] });
    findAllInvoices.mockResolvedValue([]);
    reviewsToArray.mockResolvedValue([]);
    bookingFind.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
    userFind.mockReturnValue({
      select: () => ({ lean: vi.fn().mockResolvedValue([]) }),
    });
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(new NextRequest('http://localhost/api/orders/history'));
    expect(res.status).toBe(401);
  });

  it('retourne une liste vide sans historique terminé/annulé', async () => {
    findBookingsWithFilters.mockResolvedValue({
      data: [{ id: BOOKING, status: 'CONFIRMED', requesterId: USER }],
    });
    const res = await GET(new NextRequest('http://localhost/api/orders/history'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.orders).toEqual([]);
  });

  it('mappe un booking FINISHED en historique', async () => {
    findBookingsWithFilters.mockResolvedValue({
      data: [
        {
          id: BOOKING,
          _id: BOOKING,
          status: BOOKING_STATUSES.FINISHED,
          requesterId: USER,
          providerId: USER,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-02'),
        },
      ],
    });
    bookingFind.mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          _id: new ObjectId(BOOKING),
          status: 'FINISHED',
          reservationNumber: 'RES-1',
          selectedService: { name: 'Consult', price: 50 },
        },
      ]),
    });
    userFind.mockReturnValue({
      select: () => ({
        lean: vi.fn().mockResolvedValue([
          {
            _id: new ObjectId(USER),
            name: 'Dr Bah',
            avatar: 'a.png',
          },
        ]),
      }),
    });

    const res = await GET(new NextRequest('http://localhost/api/orders/history'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.orders).toHaveLength(1);
    expect(body.orders[0]).toMatchObject({
      status: 'finished',
      providerName: 'Dr Bah',
      serviceName: 'Consult',
      amount: 50,
      canReorder: true,
    });
  });
});
