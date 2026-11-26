/**
 * GET /api/bookings/[id]/feedback-info
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { feedbackToken, useFeedbackSecret } from './feedback-token';

const { getBookingById } = vi.hoisted(() => ({ getBookingById: vi.fn() }));

vi.mock('@/services/booking/booking.service', () => ({
  bookingService: { getBookingById },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { GET } from '@/app/api/bookings/[id]/feedback-info/route';

const BOOKING_ID = '507f1f77bcf86cd799439011';

function get(id: string, token?: string) {
  const url = new URL(`http://localhost/api/bookings/${id}/feedback-info`);
  if (token) url.searchParams.set('token', token);
  return GET(new NextRequest(url), { params: Promise.resolve({ id }) });
}

describe('GET /api/bookings/[id]/feedback-info', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFeedbackSecret();
    getBookingById.mockResolvedValue({
      id: BOOKING_ID,
      reservationNumber: 'RES-42',
      metadata: { serviceLabel: 'Consultation', providerName: 'Dr Ndiaye' },
    });
  });

  it('exige un token, un id valide et un jeton reconnu', async () => {
    expect((await get(BOOKING_ID)).status).toBe(400);
    expect((await get('bad', feedbackToken('bad'))).status).toBe(400);
    expect((await get(BOOKING_ID, 'nope')).status).toBe(401);
  });

  it('répond 404 ou 400 selon l’état de la réservation', async () => {
    getBookingById.mockResolvedValueOnce(null);
    expect((await get(BOOKING_ID, feedbackToken(BOOKING_ID))).status).toBe(404);

    getBookingById.mockResolvedValueOnce({ metadata: { feedbackSubmittedAt: '2026-01-01' } });
    expect((await get(BOOKING_ID, feedbackToken(BOOKING_ID))).status).toBe(400);
  });

  it('retourne le numéro, le service et le prestataire, avec repli', async () => {
    const res = await get(BOOKING_ID, feedbackToken(BOOKING_ID));
    expect(await res.json()).toEqual({
      booking: {
        reservationNumber: 'RES-42',
        serviceName: 'Consultation',
        providerName: 'Dr Ndiaye',
      },
    });

    getBookingById.mockResolvedValueOnce({ id: BOOKING_ID, metadata: {} });
    const fallback = await get(BOOKING_ID, feedbackToken(BOOKING_ID));
    const body = await fallback.json();
    expect(body.booking.serviceName).toBe('Service');
    expect(body.booking.reservationNumber).toMatch(/^RES-/);
    expect(body.booking.providerName).toBeUndefined();
  });

  it('répond 500 si la lecture échoue', async () => {
    getBookingById.mockRejectedValue(new Error('db'));
    expect((await get(BOOKING_ID, feedbackToken(BOOKING_ID))).status).toBe(500);
  });
});
