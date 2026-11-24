/**
 * POST /api/bookings/[id]/mark-viewed
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const USER = '507f1f77bcf86cd799439099';
const BOOKING_ID = '507f1f77bcf86cd799439011';

const { mockAuth, getBookingById, updateBooking } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  getBookingById: vi.fn(),
  updateBooking: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/booking/booking.service', () => ({
  bookingService: { getBookingById, updateBooking },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { POST } from '@/app/api/bookings/[id]/mark-viewed/route';

function post(id = BOOKING_ID) {
  return POST(
    new NextRequest(`http://localhost/api/bookings/${id}/mark-viewed`, { method: 'POST' }),
    { params: { id } },
  );
}

describe('POST /api/bookings/[id]/mark-viewed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: USER } });
    getBookingById.mockResolvedValue({ id: BOOKING_ID, metadata: { viewedBy: ['other'] } });
    updateBooking.mockResolvedValue({});
  });

  it('refuse sans session, un id invalide, ou une réservation absente', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await post()).status).toBe(401);

    mockAuth.mockResolvedValue({ user: { id: USER } });
    expect((await post('nope')).status).toBe(400);

    getBookingById.mockResolvedValue(null);
    expect((await post()).status).toBe(404);
  });

  it('ajoute le lecteur, ou le laisse s’il est déjà noté', async () => {
    const res = await post();
    expect(res.status).toBe(200);
    expect(updateBooking).toHaveBeenCalledWith(
      BOOKING_ID,
      expect.objectContaining({
        metadata: expect.objectContaining({ viewedBy: ['other', USER] }),
      }),
    );

    getBookingById.mockResolvedValue({ metadata: { viewedBy: USER } });
    await post();
    expect(updateBooking).toHaveBeenLastCalledWith(
      BOOKING_ID,
      expect.objectContaining({
        metadata: expect.objectContaining({ viewedBy: [USER] }),
      }),
    );

    getBookingById.mockResolvedValue({ metadata: {} });
    await post();
    expect(updateBooking.mock.calls.at(-1)?.[1].metadata.viewedBy).toEqual([USER]);
  });

  it('répond 404 si la réservation disparaît, 500 sinon', async () => {
    updateBooking.mockRejectedValueOnce(new Error('Réservation non trouvée'));
    expect((await post()).status).toBe(404);

    getBookingById.mockRejectedValueOnce(new Error('Réservation non trouvée'));
    expect((await post()).status).toBe(404);

    getBookingById.mockRejectedValueOnce(new Error('db'));
    expect((await post()).status).toBe(500);

    updateBooking.mockRejectedValueOnce(new Error('db'));
    expect((await post()).status).toBe(500);
  });
});
