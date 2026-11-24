/**
 * POST /api/bookings/[id]/mark-viewed
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ID = '507f1f77bcf86cd799439011';
const USER = '507f1f77bcf86cd799439022';

const { mockAuth, getBookingById, updateBooking } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  getBookingById: vi.fn(),
  updateBooking: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/booking/booking.service', () => ({
  bookingService: { getBookingById, updateBooking },
}));

import { POST } from '@/app/api/bookings/[id]/mark-viewed/route';

const params = { params: { id: ID } };

function post() {
  return POST(
    new NextRequest(`http://localhost/api/bookings/${ID}/mark-viewed`, {
      method: 'POST',
    }),
    params,
  );
}

describe('POST /api/bookings/[id]/mark-viewed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: USER } });
    getBookingById.mockResolvedValue({
      id: ID,
      metadata: { viewedBy: [] },
    });
    updateBooking.mockResolvedValue({ id: ID });
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await post()).status).toBe(401);
  });

  it('répond 400 pour un id invalide', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/bookings/bad/mark-viewed', {
        method: 'POST',
      }),
      { params: { id: 'bad' } },
    );
    expect(res.status).toBe(400);
  });

  it('répond 404 si réservation introuvable', async () => {
    getBookingById.mockResolvedValue(null);
    expect((await post()).status).toBe(404);
  });

  it('ajoute userId à metadata.viewedBy', async () => {
    const res = await post();
    expect(res.status).toBe(200);
    expect(updateBooking).toHaveBeenCalledWith(
      ID,
      expect.objectContaining({
        metadata: expect.objectContaining({
          viewedBy: [USER],
        }),
      }),
    );
  });
});
