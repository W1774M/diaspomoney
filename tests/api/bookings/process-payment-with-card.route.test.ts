/**
 * POST /api/bookings/process-payment-with-card — auth et validation (sans Stripe réel).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/stripe-config', () => ({
  getStripeInstance: vi.fn(() => {
    throw new Error('Stripe ne doit pas être appelé dans ces tests');
  }),
}));
vi.mock('@/facades/service-booking.facade', () => ({
  serviceBookingFacade: {},
}));
vi.mock('@/services/email/email.service', () => ({
  emailService: { sendCustomEmail: vi.fn() },
}));
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { POST } from '@/app/api/bookings/process-payment-with-card/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/bookings/process-payment-with-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/bookings/process-payment-with-card', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(
      makeRequest({
        appointment: { selectedService: { name: 'S', price: 10 } },
        paymentData: {
          amount: 10,
          currency: 'EUR',
          paymentIntentId: 'pi_test',
        },
      }),
    );
    expect(res.status).toBe(401);
  });

  it('répond 400 si paymentIntentId / checkoutSessionId manquent', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', email: 'u@example.com' },
    });
    const res = await POST(
      makeRequest({
        appointment: {
          selectedService: { name: 'Consultation', price: 50 },
          provider: { id: 'p1', name: 'Clinique' },
        },
        paymentData: {
          amount: 50,
          currency: 'EUR',
          cardNumber: '4242424242424242',
          expiryDate: '12/30',
          cvv: '123',
          cardholderName: 'Ada',
        },
      }),
    );
    expect(res.status).toBe(400);
  });
});
