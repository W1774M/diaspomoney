/**
 * POST /api/stripe/webhook — signature, confirmation booking, events bus.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockVerify, mockConfirm, mockEmitSucceeded, mockEmitFailed } = vi.hoisted(() => ({
  mockVerify: vi.fn(),
  mockConfirm: vi.fn(),
  mockEmitSucceeded: vi.fn(),
  mockEmitFailed: vi.fn(),
}));

vi.mock('@/lib/stripe-server', () => ({
  verifyStripeSignature: mockVerify,
}));

vi.mock('@/services/booking/confirm-booking-payment.service', () => ({
  confirmBookingPaymentService: { execute: mockConfirm },
}));

vi.mock('@/lib/events', () => ({
  paymentEvents: {
    emitPaymentSucceeded: mockEmitSucceeded,
    emitPaymentFailed: mockEmitFailed,
  },
}));

vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { POST } from '@/app/api/stripe/webhook/route';

function makeWebhookRequest(body = '{}') {
  return new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: {
      'stripe-signature': 't=1,v1=test',
      'content-type': 'application/json',
    },
    body,
  });
}

describe('POST /api/stripe/webhook', () => {
  const previousSecret = process.env['STRIPE_WEBHOOK_SECRET'];

  beforeEach(() => {
    vi.clearAllMocks();
    process.env['STRIPE_WEBHOOK_SECRET'] = 'whsec_test';
    mockEmitSucceeded.mockResolvedValue(undefined);
    mockEmitFailed.mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (previousSecret === undefined) delete process.env['STRIPE_WEBHOOK_SECRET'];
    else process.env['STRIPE_WEBHOOK_SECRET'] = previousSecret;
  });

  it('répond 500 si STRIPE_WEBHOOK_SECRET manque', async () => {
    delete process.env['STRIPE_WEBHOOK_SECRET'];
    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(500);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('répond 400 si la signature est invalide', async () => {
    mockVerify.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });
    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/signature/i);
  });

  it('confirme la réservation sur payment_intent.succeeded avec bookingId', async () => {
    mockVerify.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_ok',
          amount: 11000,
          currency: 'eur',
          metadata: { bookingId: '69429b5327a945897d990327' },
        },
      },
    });
    mockConfirm.mockResolvedValue({ success: true, emailSent: true });

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);
    expect(mockConfirm).toHaveBeenCalledWith({
      proofId: 'pi_ok',
      bookingId: '69429b5327a945897d990327',
      expectedAmount: 110,
      expectedCurrency: 'EUR',
      acceptProcessing: false,
    });
    expect(mockEmitSucceeded).not.toHaveBeenCalled();
  });

  it('émet un événement générique si payment_intent.succeeded sans bookingId', async () => {
    mockVerify.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_orphan',
          amount: 5000,
          currency: 'eur',
          customer: 'cus_1',
          metadata: {},
        },
      },
    });

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);
    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockEmitSucceeded).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: 'pi_orphan',
        amount: 50,
        currency: 'EUR',
        provider: 'STRIPE',
      }),
    );
  });

  it('émet payment failed sur payment_intent.payment_failed', async () => {
    mockVerify.mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_fail',
          last_payment_error: { message: 'card_declined' },
        },
      },
    });

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);
    expect(mockEmitFailed).toHaveBeenCalledWith('pi_fail', 'card_declined');
  });

  it('confirme via checkout.session.completed si paid', async () => {
    mockVerify.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_paid',
          payment_status: 'paid',
          amount_total: 11000,
          currency: 'eur',
          metadata: { bookingId: '69429b5327a945897d990327' },
        },
      },
    });
    mockConfirm.mockResolvedValue({ success: true, emailSent: false });

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);
    expect(mockConfirm).toHaveBeenCalledWith({
      proofId: 'cs_paid',
      bookingId: '69429b5327a945897d990327',
      expectedAmount: 110,
      expectedCurrency: 'EUR',
      acceptProcessing: false,
    });
  });

  it('ignore checkout.session.completed non payé', async () => {
    mockVerify.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_unpaid',
          payment_status: 'unpaid',
          metadata: { bookingId: '69429b5327a945897d990327' },
        },
      },
    });

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);
    expect(mockConfirm).not.toHaveBeenCalled();
  });
});
