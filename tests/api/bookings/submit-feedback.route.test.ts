/**
 * POST /api/bookings/[id]/submit-feedback
 */
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { feedbackToken, useFeedbackSecret } from './feedback-token';

const { getBookingById, updateBooking } = vi.hoisted(() => ({
  getBookingById: vi.fn(),
  updateBooking: vi.fn(),
}));

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

import { POST } from '@/app/api/bookings/[id]/submit-feedback/route';

const BOOKING_ID = '507f1f77bcf86cd799439011';

function post(id: string, body: unknown, params: { id: string } | Promise<{ id: string }> = { id }) {
  return POST(
    new NextRequest(`http://localhost/api/bookings/${id}/submit-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params },
  );
}

describe('POST /api/bookings/[id]/submit-feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFeedbackSecret();
    getBookingById.mockResolvedValue({ id: BOOKING_ID, metadata: {} });
    updateBooking.mockResolvedValue({});
  });

  it('refuse un identifiant invalide, un corps vide et un token faux', async () => {
    expect((await post('nope', { token: 'x', diaspomoneyRating: 5 })).status).toBe(400);

    const invalid = await post(BOOKING_ID, { token: 'x' });
    expect(invalid.status).toBe(400);

    const badToken = await post(BOOKING_ID, { token: 'abc', serviceRating: 4 });
    expect(badToken.status).toBe(401);
  });

  it('refuse un token expiré, d’une autre réservation, ou mal formé', async () => {
    const expired = feedbackToken(BOOKING_ID, 31 * 24 * 60 * 60 * 1000);
    expect((await post(BOOKING_ID, { token: expired, rating: 3 })).status).toBe(401);

    const other = feedbackToken('507f1f77bcf86cd799439012');
    expect((await post(BOOKING_ID, { token: other, rating: 3 })).status).toBe(401);

    const broken = Buffer.from('only-one-part').toString('base64url');
    expect((await post(BOOKING_ID, { token: broken, rating: 3 })).status).toBe(401);

    const badHash = Buffer.from(`${BOOKING_ID}:${Date.now()}:deadbeef`).toString('base64url');
    expect((await post(BOOKING_ID, { token: badHash, rating: 3 })).status).toBe(401);
  });

  it('répond 404 si la réservation est absente et 400 si le feedback existe déjà', async () => {
    getBookingById.mockResolvedValue(null);
    expect((await post(BOOKING_ID, { token: feedbackToken(BOOKING_ID), rating: 5 })).status).toBe(404);

    getBookingById.mockResolvedValue({ metadata: { feedbackSubmittedAt: '2026-01-01' } });
    expect((await post(BOOKING_ID, { token: feedbackToken(BOOKING_ID), rating: 5 })).status).toBe(400);
  });

  it('enregistre les notes DiaspoMoney, service et l’ancien format', async () => {
    const res = await post(BOOKING_ID, {
      token: feedbackToken(BOOKING_ID),
      diaspomoneyRating: 5,
      diaspomoneyComment: '  clair  ',
      serviceRating: 4,
      serviceComment: '   ',
      rating: 3,
      comment: ' ancien ',
    });
    expect(res.status).toBe(200);
    expect(updateBooking).toHaveBeenCalledWith(
      BOOKING_ID,
      expect.objectContaining({
        metadata: expect.objectContaining({
          feedback: expect.objectContaining({
            diaspomoney: { rating: 5, comment: 'clair' },
            service: { rating: 4, comment: '' },
            rating: 3,
            comment: 'ancien',
          }),
        }),
      }),
    );
  });

  it('répond 500 si la mise à jour ou le jeton lève une erreur', async () => {
    updateBooking.mockRejectedValue(new Error('db'));
    expect((await post(BOOKING_ID, { token: feedbackToken(BOOKING_ID), rating: 2 })).status).toBe(500);

    const spy = vi.spyOn(crypto, 'createHmac').mockImplementation(() => {
      throw new Error('hmac');
    });
    const token = Buffer.from(`${BOOKING_ID}:${Date.now()}:hash`).toString('base64url');
    expect((await post(BOOKING_ID, { token, rating: 2 })).status).toBe(401);
    spy.mockRestore();
  });
});
