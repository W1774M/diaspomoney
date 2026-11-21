import { describe, expect, it } from 'vitest';
import { Money, PaymentProof } from '@/domain/payment';

describe('PaymentProof', () => {
  it('accepte un PaymentIntent succeeded', () => {
    const result = PaymentProof.fromSnapshot({
      source: 'payment_intent',
      proofId: 'pi_1',
      paymentIntentId: 'pi_1',
      providerStatus: 'succeeded',
      amountMinor: 5000,
      currency: 'eur',
    }).evaluate({ expected: Money.of(50, 'EUR') });

    expect(result.valid).toBe(true);
    expect(result.paymentStatus).toBe('confirmed');
  });

  it('rejette un montant incorrect', () => {
    const result = PaymentProof.fromSnapshot({
      source: 'payment_intent',
      proofId: 'pi_1',
      paymentIntentId: 'pi_1',
      providerStatus: 'succeeded',
      amountMinor: 4000,
      currency: 'eur',
    }).evaluate({ expected: Money.of(50, 'EUR') });

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/montant/i);
  });

  it('accepte processing si acceptProcessing=true', () => {
    const result = PaymentProof.fromSnapshot({
      source: 'payment_intent',
      proofId: 'pi_1',
      paymentIntentId: 'pi_1',
      providerStatus: 'processing',
      amountMinor: 5000,
      currency: 'eur',
    }).evaluate({
      expected: Money.of(50, 'EUR'),
      acceptProcessing: true,
    });

    expect(result.valid).toBe(true);
    expect(result.paymentStatus).toBe('processing');
  });

  it('accepte une checkout session paid', () => {
    const result = PaymentProof.fromSnapshot({
      source: 'checkout_session',
      proofId: 'cs_1',
      checkoutSessionId: 'cs_1',
      paymentIntentId: 'pi_1',
      providerStatus: 'paid',
      amountMinor: 5000,
      currency: 'eur',
    }).evaluate({ expected: Money.of(50, 'EUR') });

    expect(result.valid).toBe(true);
    expect(result.paymentStatus).toBe('confirmed');
  });
});
