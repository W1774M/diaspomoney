import { afterEach, describe, expect, it, vi } from 'vitest';
import Stripe from 'stripe';

vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import {
  getStripeInstance,
  getStripeInstanceForAccount,
  getStripeMode,
  handleStripeError,
  isRetryableError,
  isStripeConfigured,
  resetStripeInstance,
  StripeErrorType,
} from '@/lib/stripe-config';

const TEST_KEY = 'sk_test_coverage_lot';

describe('stripe-config', () => {
  afterEach(() => {
    resetStripeInstance();
    delete process.env['STRIPE_SECRET_KEY'];
  });

  it('distingue test, live et une clé inhabituelle', () => {
    expect(getStripeMode('sk_test_abc')).toBe('test');
    expect(getStripeMode('sk_live_abc')).toBe('live');
    expect(getStripeMode('rk_abc')).toBe('test');
  });

  it('n’est configuré qu’avec une clé secrète au bon préfixe', () => {
    expect(isStripeConfigured()).toBe(false);
    process.env['STRIPE_SECRET_KEY'] = 'pk_test_public';
    expect(isStripeConfigured()).toBe(false);
    process.env['STRIPE_SECRET_KEY'] = TEST_KEY;
    expect(isStripeConfigured()).toBe(true);
  });

  it('crée une instance, la réutilise, et refuse une clé absente', () => {
    expect(() => getStripeInstance()).toThrow(/STRIPE_SECRET_KEY/);

    process.env['STRIPE_SECRET_KEY'] = TEST_KEY;
    const first = getStripeInstance();
    const second = getStripeInstance();
    expect(second).toBe(first);

    const scoped = getStripeInstance({ apiKey: 'sk_live_coverage_lot', timeout: 1000, maxNetworkRetries: 1 });
    expect(scoped).not.toBe(first);
    expect(getStripeInstanceForAccount('acct_1', 'sk_test_autre_compte')).toBeInstanceOf(Stripe);
  });

  it('classe les erreurs Stripe, réseau, ou inconnues', () => {
    const card = handleStripeError(
      new Stripe.errors.StripeCardError({
        type: 'card_error',
        message: 'refusée',
        code: 'card_declined',
        decline_code: 'insufficient_funds',
      } as Stripe.StripeRawError),
    );
    expect(card.type).toBe(StripeErrorType.CARD_ERROR);
    expect(card.declineCode).toBe('insufficient_funds');

    expect(
      handleStripeError(new Stripe.errors.StripeRateLimitError({ message: 'slow', type: 'rate_limit_error' } as Stripe.StripeRawError)).type,
    ).toBe(StripeErrorType.RATE_LIMIT_ERROR);
    expect(
      handleStripeError(new Stripe.errors.StripeInvalidRequestError({ message: 'bad', type: 'invalid_request_error' } as Stripe.StripeRawError)).type,
    ).toBe(StripeErrorType.INVALID_REQUEST_ERROR);
    expect(
      handleStripeError(new Stripe.errors.StripeAPIError({ message: 'api', type: 'api_error' } as Stripe.StripeRawError)).type,
    ).toBe(StripeErrorType.API_ERROR);
    expect(
      handleStripeError(new Stripe.errors.StripeAuthenticationError({ message: 'auth', type: 'authentication_error' } as Stripe.StripeRawError)).type,
    ).toBe(StripeErrorType.AUTHENTICATION_ERROR);
    expect(
      handleStripeError(new Stripe.errors.StripeIdempotencyError({ message: 'idem', type: 'idempotency_error' } as Stripe.StripeRawError)).type,
    ).toBe(StripeErrorType.IDEMPOTENCY_ERROR);

    expect(handleStripeError(new Error('locale')).message).toBe('locale');
    expect(handleStripeError('autre').message).toContain('inconnue');

    expect(isRetryableError(new Stripe.errors.StripeRateLimitError({ message: 'slow', type: 'rate_limit_error' } as Stripe.StripeRawError))).toBe(true);
    expect(isRetryableError(new Stripe.errors.StripeAPIError({ message: 'api', type: 'api_error' } as Stripe.StripeRawError))).toBe(true);
    expect(isRetryableError(Object.assign(new Error('reset'), { code: 'ECONNRESET' }))).toBe(true);
    expect(isRetryableError(new Error('non'))).toBe(false);
    expect(isRetryableError('non')).toBe(false);
  });
});
