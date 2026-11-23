/**
 * GET /api/stripe/payment-intent/[id] — auth admin + retrieve Stripe.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ROLES } from '@/lib/constants';

const { mockAuth, mockRetrieve, mockGetStripe } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockRetrieve: vi.fn(),
  mockGetStripe: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/stripe-config', () => ({
  getStripeInstance: mockGetStripe,
}));
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { GET } from '@/app/api/stripe/payment-intent/[id]/route';

describe('GET /api/stripe/payment-intent/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStripe.mockReturnValue({
      paymentIntents: { retrieve: mockRetrieve },
      charges: { retrieve: vi.fn() },
      paymentMethods: { retrieve: vi.fn() },
    });
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(
      new NextRequest('http://localhost/api/stripe/payment-intent/pi_1'),
      { params: { id: 'pi_1' } },
    );
    expect(res.status).toBe(401);
  });

  it('répond 403 si non admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', roles: [ROLES.CUSTOMER] } });
    const res = await GET(
      new NextRequest('http://localhost/api/stripe/payment-intent/pi_1'),
      { params: { id: 'pi_1' } },
    );
    expect(res.status).toBe(403);
  });

  it('répond 400 si l’id n’est pas un PaymentIntent', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'a1', roles: [ROLES.ADMIN] },
    });
    const res = await GET(
      new NextRequest('http://localhost/api/stripe/payment-intent/cs_1'),
      { params: { id: 'cs_1' } },
    );
    expect(res.status).toBe(400);
  });

  it('retourne les détails d’un PaymentIntent', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'a1', roles: [ROLES.ADMIN] },
    });
    mockRetrieve.mockResolvedValue({
      id: 'pi_abc',
      amount: 11000,
      currency: 'eur',
      status: 'succeeded',
      created: 1_700_000_000,
      payment_method: null,
      latest_charge: null,
    });

    const res = await GET(
      new NextRequest('http://localhost/api/stripe/payment-intent/pi_abc'),
      { params: { id: 'pi_abc' } },
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      paymentIntentId: 'pi_abc',
      amount: 110,
      currency: 'EUR',
      status: 'succeeded',
    });
  });

  it('répond 404 si Stripe ne trouve pas le PaymentIntent', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'a1', roles: [ROLES.ADMIN] },
    });
    const err = new Error('No such payment_intent');
    (err as { type?: string }).type = 'StripeInvalidRequestError';
    mockRetrieve.mockRejectedValue(err);

    const res = await GET(
      new NextRequest('http://localhost/api/stripe/payment-intent/pi_missing'),
      { params: { id: 'pi_missing' } },
    );
    expect(res.status).toBe(404);
  });
});
