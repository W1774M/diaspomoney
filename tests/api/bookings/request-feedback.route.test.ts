/**
 * POST /api/bookings/[id]/request-feedback
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';
import { useFeedbackSecret } from './feedback-token';

const { mockAuth, getBookingById, updateBooking, sendFeedbackRequestEmail } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  getBookingById: vi.fn(),
  updateBooking: vi.fn(),
  sendFeedbackRequestEmail: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/booking/booking.service', () => ({
  bookingService: { getBookingById, updateBooking },
}));
vi.mock('@/lib/email/resend', () => ({ sendFeedbackRequestEmail }));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { POST } from '@/app/api/bookings/[id]/request-feedback/route';

const BOOKING_ID = '507f1f77bcf86cd799439011';

function booking(metadata: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return {
    id: BOOKING_ID,
    status: 'FINISHED',
    metadata: { clientEmail: 'awa@example.com', ...metadata },
    ...extra,
  };
}

function post(id: string = BOOKING_ID, params: { id: string } | Promise<{ id: string }> = { id }) {
  return POST(new NextRequest(`http://localhost/api/bookings/${id}/request-feedback`, { method: 'POST' }), {
    params,
  });
}

describe('POST /api/bookings/[id]/request-feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFeedbackSecret();
    process.env['NEXT_PUBLIC_APP_URL'] = 'https://diaspomoney.fr';
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', roles: [ROLES.ADMIN] } });
    getBookingById.mockResolvedValue(booking({ clientFirstName: 'Awa', clientLastName: 'Diop', serviceLabel: 'Santé' }, { reservationNumber: 'RES-7' }));
    updateBooking.mockResolvedValue({});
    sendFeedbackRequestEmail.mockResolvedValue(true);
  });

  it('refuse sans session, sans rôle admin, ou avec un id invalide', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await post()).status).toBe(401);

    mockAuth.mockResolvedValue({ user: { id: 'u', roles: [ROLES.CUSTOMER] } });
    expect((await post()).status).toBe(403);

    mockAuth.mockResolvedValue({ user: { id: 'admin-1', roles: [ROLES.ADMIN] } });
    expect((await post('bad')).status).toBe(400);
  });

  it('refuse une réservation absente, non terminée, déjà sollicitée, ou sans email', async () => {
    getBookingById.mockResolvedValueOnce(null);
    expect((await post()).status).toBe(404);

    getBookingById.mockResolvedValueOnce(booking({}, { status: 'PENDING' }));
    expect((await post()).status).toBe(400);

    getBookingById.mockResolvedValueOnce(booking({ feedbackRequestedAt: '2026-01-01' }));
    expect((await post()).status).toBe(400);

    getBookingById.mockResolvedValueOnce({ id: BOOKING_ID, status: 'FINISHED', metadata: {} });
    expect((await post()).status).toBe(400);
  });

  it('envoie le lien et retient qui l’a demandé', async () => {
    const res = await post();
    expect(res.status).toBe(200);
    expect(sendFeedbackRequestEmail).toHaveBeenCalledWith(
      'awa@example.com',
      'Awa Diop',
      'RES-7',
      'Santé',
      expect.stringContaining(`https://diaspomoney.fr/feedback/${BOOKING_ID}?token=`),
    );
    expect(updateBooking).toHaveBeenCalledWith(
      BOOKING_ID,
      expect.objectContaining({
        metadata: expect.objectContaining({ feedbackRequestedBy: 'admin-1' }),
      }),
    );
  });

  it('compose le nom du client selon les champs présents', async () => {
    getBookingById.mockResolvedValueOnce(booking({ clientFirstName: 'Awa' }));
    await post();
    expect(sendFeedbackRequestEmail).toHaveBeenLastCalledWith(
      'awa@example.com',
      'Awa',
      expect.stringMatching(/^RES-/),
      'Service',
      expect.any(String),
    );

    getBookingById.mockResolvedValueOnce(booking({ clientLastName: 'Diop' }));
    await post();
    expect(sendFeedbackRequestEmail.mock.calls.at(-1)?.[1]).toBe('Diop');

    getBookingById.mockResolvedValueOnce(booking({}));
    await post();
    expect(sendFeedbackRequestEmail.mock.calls.at(-1)?.[1]).toBe('Client');
  });

  it('répond 500 si l’email échoue ou si le service lève', async () => {
    sendFeedbackRequestEmail.mockResolvedValueOnce(false);
    expect((await post()).status).toBe(500);

    sendFeedbackRequestEmail.mockResolvedValueOnce(true);
    updateBooking.mockRejectedValueOnce(new Error('db'));
    expect((await post()).status).toBe(500);

    mockAuth.mockResolvedValue({ user: { id: 'sa', roles: [ROLES.SUPERADMIN] } });
    updateBooking.mockResolvedValueOnce({});
    expect((await post()).status).toBe(200);
  });
});
