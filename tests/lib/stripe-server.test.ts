/**
 * verifyStripeSignature — garde-fous d’entrée webhook.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockConstructEvent, mockGetStripeInstance, mockIsConfigured } = vi.hoisted(
  () => ({
    mockConstructEvent: vi.fn(),
    mockGetStripeInstance: vi.fn(),
    mockIsConfigured: vi.fn(() => true),
  }),
);

vi.mock('@/lib/stripe-config', () => ({
  getStripeInstance: mockGetStripeInstance,
  isStripeConfigured: mockIsConfigured,
}));

import { getStripe, verifyStripeSignature } from '@/lib/stripe-server';

describe('stripe-server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStripeInstance.mockReturnValue({
      webhooks: { constructEvent: mockConstructEvent },
    });
    mockIsConfigured.mockReturnValue(true);
  });

  it('verifyStripeSignature refuse une signature absente', () => {
    expect(() =>
      verifyStripeSignature({
        rawBody: Buffer.from('{}'),
        signature: null,
        webhookSecret: 'whsec_test',
      }),
    ).toThrow(/Missing Stripe-Signature/i);
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });

  it('verifyStripeSignature délègue à constructEvent', () => {
    const event = { id: 'evt_1', type: 'payment_intent.succeeded' };
    mockConstructEvent.mockReturnValue(event);

    const rawBody = Buffer.from('{"id":"evt_1"}');
    const result = verifyStripeSignature({
      rawBody,
      signature: 't=1,v1=abc',
      webhookSecret: 'whsec_test',
    });

    expect(result).toBe(event);
    expect(mockConstructEvent).toHaveBeenCalledWith(
      rawBody,
      't=1,v1=abc',
      'whsec_test',
    );
  });

  it('getStripe réutilise la même instance (singleton)', () => {
    const first = getStripe();
    const second = getStripe();
    expect(first).toBe(second);
  });
});
