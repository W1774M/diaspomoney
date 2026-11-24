/**
 * GET /api/bookings/pending-count
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const USER = '507f1f77bcf86cd799439011';

const { mockAuth, findBookingsWithFilters } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  findBookingsWithFilters: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/repositories', () => ({
  getBookingRepository: () => ({ findBookingsWithFilters }),
}));

import { GET } from '@/app/api/bookings/pending-count/route';
import { BOOKING_STATUSES } from '@/lib/constants';

describe('GET /api/bookings/pending-count', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: USER } });
    findBookingsWithFilters.mockResolvedValue({
      data: [
        { id: 'b1', metadata: {} },
        { id: 'b2', metadata: { viewedBy: [USER] } },
        { id: 'b3', metadata: { viewedBy: ['other'] } },
      ],
    });
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(
      new NextRequest('http://localhost/api/bookings/pending-count'),
    );
    expect(res.status).toBe(401);
  });

  it('compte les PENDING non vus pour le rôle par défaut', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/bookings/pending-count'),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.pendingCount).toBe(2);
    expect(findBookingsWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterId: USER,
        status: BOOKING_STATUSES.PENDING,
      }),
      expect.any(Object),
    );
  });

  it('filtre par providerId si role=provider', async () => {
    await GET(
      new NextRequest(
        'http://localhost/api/bookings/pending-count?role=provider',
      ),
    );
    expect(findBookingsWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: USER,
        status: BOOKING_STATUSES.PENDING,
      }),
      expect.any(Object),
    );
  });
});
