/**
 * POST /api/bookings/[id]/resend-payment-link — auth admin.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ROLES } from '@/lib/constants';

const { mockAuth, mockGetBooking, mockCreateCheckout, mockSendEmail, mockUpdate } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockGetBooking: vi.fn(),
    mockCreateCheckout: vi.fn(),
    mockSendEmail: vi.fn(),
    mockUpdate: vi.fn(),
  }));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/booking/booking.service', () => ({
  bookingService: { getBookingById: mockGetBooking },
}));
vi.mock('@/lib/stripe-checkout', () => ({
  createCheckoutSession: mockCreateCheckout,
}));
vi.mock('@/lib/email/resend', () => ({
  sendPaymentLinkEmail: mockSendEmail,
}));
vi.mock('@/repositories', () => ({
  getBookingRepository: () => ({ update: mockUpdate }),
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { POST } from '@/app/api/bookings/[id]/resend-payment-link/route';

const BOOKING_ID = '69429b5327a945897d990327';

describe('POST /api/bookings/[id]/resend-payment-link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateCheckout.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/cs_resend',
      sessionId: 'cs_resend',
    });
    mockSendEmail.mockResolvedValue(true);
    mockUpdate.mockResolvedValue({});
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(
      new NextRequest(`http://localhost/api/bookings/${BOOKING_ID}/resend-payment-link`, {
        method: 'POST',
      }),
      { params: { id: BOOKING_ID } },
    );
    expect(res.status).toBe(401);
  });

  it('répond 403 si non admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', roles: [ROLES.PROVIDER] } });
    const res = await POST(
      new NextRequest(`http://localhost/api/bookings/${BOOKING_ID}/resend-payment-link`, {
        method: 'POST',
      }),
      { params: { id: BOOKING_ID } },
    );
    expect(res.status).toBe(403);
  });

  it('renvoie un nouveau lien pour un admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '691fcb799d08c6e9cf444921', roles: [ROLES.SUPERADMIN] },
    });
    mockGetBooking.mockResolvedValue({
      id: BOOKING_ID,
      reservationNumber: 'RES-1',
      metadata: {
        clientEmail: 'a@b.fr',
        totalAmount: 50,
        serviceLabel: 'Service',
      },
    });

    const res = await POST(
      new NextRequest(`http://localhost/api/bookings/${BOOKING_ID}/resend-payment-link`, {
        method: 'POST',
      }),
      { params: { id: BOOKING_ID } },
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.paymentUrl).toContain('cs_resend');
    expect(mockUpdate).toHaveBeenCalledWith(
      BOOKING_ID,
      expect.objectContaining({
        metadata: expect.objectContaining({
          paymentLinkResentBy: '691fcb799d08c6e9cf444921',
        }),
      }),
    );
  });
});
