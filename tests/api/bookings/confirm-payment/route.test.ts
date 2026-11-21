/**
 * Tests — POST /api/bookings/confirm-payment
 * Vérifie la délégation au use case ConfirmBookingPayment.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockExecute } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => ({
    user: { email: 'user@example.com' },
  })),
}));

vi.mock('@/services/booking/confirm-booking-payment.service', () => ({
  confirmBookingPaymentService: {
    execute: mockExecute,
  },
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

import { POST } from '@/app/api/bookings/confirm-payment/route';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/bookings/confirm-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

const validBody = {
  appointment: {
    id: 'appt_1',
    selectedService: { name: 'Consultation', price: 50 },
    provider: { id: 'prov_1', name: 'Clinique Test' },
    requester: {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@example.com',
    },
  },
  paymentData: {
    amount: 50,
    currency: 'EUR',
    paymentIntentId: 'pi_test_succeeded',
  },
};

describe('POST /api/bookings/confirm-payment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejette sans preuve Stripe réussie', async () => {
    mockExecute.mockResolvedValue({
      success: false,
      error: 'PaymentIntent non confirmé (status: requires_payment_method)',
    });

    const response = await POST(makeRequest(validBody));
    const json = await response.json();

    expect(response.status).toBe(402);
    expect(json.error || json.message || json.code).toBeTruthy();
    expect(mockExecute).toHaveBeenCalled();
  });

  it('retourne succès après ConfirmBookingPayment', async () => {
    mockExecute.mockResolvedValue({
      success: true,
      reservationNumber: 'RES-001',
      paymentIntentId: 'pi_test_succeeded',
      emailSent: true,
    });

    const response = await POST(makeRequest(validBody));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.reservationNumber).toBe('RES-001');
    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        proofId: 'pi_test_succeeded',
        expectedAmount: 50,
        expectedCurrency: 'EUR',
        acceptProcessing: false,
        bookingId: 'appt_1',
      }),
    );
  });

  it('rejette si paymentIntentId / checkoutSessionId manquant', async () => {
    const response = await POST(
      makeRequest({
        ...validBody,
        paymentData: { amount: 50, currency: 'EUR' },
      }),
    );

    expect(response.status).toBe(400);
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
