/**
 * createCheckoutSession — validation et paramètres envoyés à Stripe
 * (dont expires_at ≤ 24 h, correctif DIASPOMONEY-3B).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreate, mockGetStripe } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockGetStripe: vi.fn(),
}));

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

import { createCheckoutSession } from '@/lib/stripe-checkout';

const baseParams = {
  amount: 110,
  currency: 'EUR',
  customerEmail: 'client@example.com',
  bookingId: '69429b5327a945897d990327',
  reservationNumber: 'RES-2025-0007',
  serviceName: 'consultation medicale',
};

describe('createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStripe.mockReturnValue({
      checkout: { sessions: { create: mockCreate } },
    });
    mockCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    });
    process.env['NEXT_PUBLIC_APP_URL'] = 'https://dev.diaspomoney.fr';
  });

  afterEach(() => {
    delete process.env['NEXT_PUBLIC_APP_URL'];
  });

  it('refuse un montant ≤ 0', async () => {
    await expect(
      createCheckoutSession({ ...baseParams, amount: 0 }),
    ).rejects.toThrow(/montant doit être positif/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('refuse un email client manquant', async () => {
    await expect(
      createCheckoutSession({ ...baseParams, customerEmail: '' }),
    ).rejects.toThrow(/email du client/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('crée une session avec expires_at à environ 23 h', async () => {
    const before = Math.floor(Date.now() / 1000);
    const result = await createCheckoutSession(baseParams);
    const after = Math.floor(Date.now() / 1000);

    expect(result).toEqual({
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
      sessionId: 'cs_test_123',
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const arg = mockCreate.mock.calls[0]![0] as {
      expires_at: number;
      customer_email: string;
      line_items: Array<{ price_data: { unit_amount: number; currency: string } }>;
      metadata: Record<string, string>;
    };

    expect(arg.customer_email).toBe(baseParams.customerEmail);
    expect(arg.line_items[0]!.price_data.unit_amount).toBe(11000);
    expect(arg.line_items[0]!.price_data.currency).toBe('eur');
    expect(arg.metadata['bookingId']).toBe(baseParams.bookingId);
    expect(arg.metadata['source']).toBe('diaspomoney');

    const min = before + 22 * 60 * 60;
    const max = after + 24 * 60 * 60 - 1;
    expect(arg.expires_at).toBeGreaterThanOrEqual(min);
    expect(arg.expires_at).toBeLessThanOrEqual(max);
  });

  it('échoue si Stripe ne renvoie pas d’URL', async () => {
    mockCreate.mockResolvedValue({ id: 'cs_test_no_url', url: null });
    await expect(createCheckoutSession(baseParams)).rejects.toThrow(/aucune URL/i);
  });

  it('remonte une erreur de configuration Stripe', async () => {
    mockGetStripe.mockImplementation(() => {
      throw new Error('Missing STRIPE_SECRET_KEY');
    });
    await expect(createCheckoutSession(baseParams)).rejects.toThrow(
      /Configuration Stripe invalide/i,
    );
  });
});
