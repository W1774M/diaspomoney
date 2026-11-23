/**
 * POST /api/bookings/[id]/generate-payment-link — auth admin + Checkout email.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ROLES } from '@/lib/constants';

const {
  mockAuth,
  mockGetBooking,
  mockCreateCheckout,
  mockSendEmail,
  mockUpdate,
} = vi.hoisted(() => ({
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

import { POST } from '@/app/api/bookings/[id]/generate-payment-link/route';

const BOOKING_ID = '69429b5327a945897d990327';

function makeRequest() {
  return new NextRequest(
    `http://localhost/api/bookings/${BOOKING_ID}/generate-payment-link`,
    { method: 'POST' },
  );
}

const adminSession = {
  user: { id: '691fcb799d08c6e9cf444921', roles: [ROLES.ADMIN] },
};

const bookingOk = {
  id: BOOKING_ID,
  reservationNumber: 'RES-2025-0007',
  metadata: {
    clientEmail: 'client@example.com',
    clientFirstName: 'Ada',
    clientLastName: 'Lovelace',
    serviceLabel: 'consultation medicale',
    totalAmount: '110',
    currency: 'EUR',
  },
};

describe('POST /api/bookings/[id]/generate-payment-link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateCheckout.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/cs_test',
      sessionId: 'cs_test',
    });
    mockSendEmail.mockResolvedValue(true);
    mockUpdate.mockResolvedValue({});
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest(), { params: { id: BOOKING_ID } });
    expect(res.status).toBe(401);
  });

  it('répond 403 si non administrateur', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', roles: [ROLES.CUSTOMER] },
    });
    const res = await POST(makeRequest(), { params: { id: BOOKING_ID } });
    expect(res.status).toBe(403);
  });

  it('répond 400 si l’id n’est pas un ObjectId', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const res = await POST(makeRequest(), { params: { id: 'pas-un-id' } });
    expect(res.status).toBe(400);
  });

  it('répond 404 si la réservation est absente', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockGetBooking.mockResolvedValue(null);
    const res = await POST(makeRequest(), { params: { id: BOOKING_ID } });
    expect(res.status).toBe(404);
  });

  it('génère le lien, met à jour la réservation et envoie l’email', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockGetBooking.mockResolvedValue(bookingOk);

    const res = await POST(makeRequest(), { params: { id: BOOKING_ID } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.paymentUrl).toContain('checkout.stripe.com');
    expect(json.emailSent).toBe(true);

    expect(mockCreateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 110,
        customerEmail: 'client@example.com',
        bookingId: BOOKING_ID,
        reservationNumber: 'RES-2025-0007',
      }),
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      BOOKING_ID,
      expect.objectContaining({
        metadata: expect.objectContaining({
          paymentUrl: 'https://checkout.stripe.com/c/pay/cs_test',
          checkoutSessionId: 'cs_test',
        }),
      }),
    );
    expect(mockSendEmail).toHaveBeenCalled();
  });
});
