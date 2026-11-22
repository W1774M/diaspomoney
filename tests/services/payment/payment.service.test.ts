// @vitest-environment node
import * as Sentry from '@sentry/nextjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Stratégies de paiement, événements et Stripe sont simulés ; @Validate reste réel.
const h = vi.hoisted(() => {
  const makeStrategy = (name: string) => ({
    name,
    createPaymentIntent: vi.fn(),
    confirmPaymentIntent: vi.fn(),
    processPayment: vi.fn(),
    refund: vi.fn(),
    getTransactionStatus: vi.fn(),
  });
  const strategies: Record<string, ReturnType<typeof makeStrategy>> = {
    STRIPE: makeStrategy('STRIPE'),
    PAYPAL: makeStrategy('PAYPAL'),
    MOBILE: makeStrategy('MOBILE'),
  };
  return {
    passThrough: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
    strategies,
    factory: {
      getStrategy: vi.fn((p: string) => strategies[p] ?? strategies['STRIPE']),
      getBestStrategy: vi.fn((): unknown => null),
    },
    events: {
      emitPaymentCreated: vi.fn(async () => undefined),
      emitPaymentSucceeded: vi.fn(async () => undefined),
      emitPaymentFailed: vi.fn(async () => undefined),
      emitPaymentRefunded: vi.fn(async () => undefined),
    },
    stripe: {
      checkout: { sessions: { retrieve: vi.fn() } },
      paymentIntents: { retrieve: vi.fn() },
    },
  };
});

vi.mock('@/lib/decorators/cache.decorator', () => ({ Cacheable: h.passThrough }));
vi.mock('@/lib/decorators/log.decorator', () => ({ Log: h.passThrough }));
vi.mock('@/strategies/payment', () => ({ PaymentStrategyFactory: h.factory }));
vi.mock('@/lib/events', () => ({ paymentEvents: h.events }));
vi.mock('@/lib/stripe-server', () => ({ getStripe: () => h.stripe }));

import { PAYMENT_METHODS } from '@/lib/constants';
import { PaymentService, paymentService } from '@/services/payment/payment.service';

const stripe = h.strategies['STRIPE']!;
const paypal = h.strategies['PAYPAL']!;
const svc = paymentService;

beforeEach(() => {
  vi.clearAllMocks();
  h.factory.getBestStrategy.mockReturnValue(null);
  svc.setProvider(PAYMENT_METHODS.STRIPE as never);
});

describe('PaymentService : choix de la stratégie', () => {
  it('est un singleton', () => {
    expect(PaymentService.getInstance()).toBe(svc);
  });

  it('prend le fournisseur demandé, sinon la meilleure stratégie, sinon le fournisseur par défaut', async () => {
    stripe.createPaymentIntent.mockResolvedValue({ success: true, paymentIntentId: 'pi_1', clientSecret: 'sec' });
    paypal.createPaymentIntent.mockResolvedValue({ success: true, paymentIntentId: 'pp_1', clientSecret: 'sec' });
    const mobile = h.strategies['MOBILE']!;
    mobile.createPaymentIntent.mockResolvedValue({ success: true, transactionId: 'mm_1', clientSecret: 'sec' });

    await svc.createPaymentIntent(10, 'EUR', 'u1', {}, 'PAYPAL');
    expect(paypal.createPaymentIntent).toHaveBeenCalled();

    h.factory.getBestStrategy.mockReturnValueOnce(mobile);
    expect((await svc.createPaymentIntent(10, 'XOF', 'u1')).id).toBe('mm_1');
    expect(h.factory.getBestStrategy).toHaveBeenCalledWith('XOF', undefined);

    await svc.createPaymentIntent(10, 'EUR', 'u1');
    expect(stripe.createPaymentIntent).toHaveBeenCalledTimes(1);
  });

  it('change de fournisseur par défaut', async () => {
    svc.setProvider(PAYMENT_METHODS.PAYPAL as never);
    paypal.refund.mockResolvedValue({ success: true, amount: 5 });
    await svc.refund('tx');
    expect(paypal.refund).toHaveBeenCalled();
    expect(stripe.refund).not.toHaveBeenCalled();
  });

  it('liste les fournisseurs disponibles', () => {
    expect(svc.getAvailableProviders()).toEqual([PAYMENT_METHODS.STRIPE, PAYMENT_METHODS.PAYPAL]);
  });
});

describe('PaymentService.createPaymentIntent', () => {
  it('crée l’intention, émet l’événement et renvoie le clientSecret', async () => {
    stripe.createPaymentIntent.mockResolvedValue({ success: true, paymentIntentId: 'pi_1', clientSecret: 'pi_1_secret', metadata: { a: 'b' } });
    const intent = await svc.createPaymentIntent(24, 'EUR', 'u1', { bookingId: 'b1' });

    expect(stripe.createPaymentIntent).toHaveBeenCalledWith({ amount: 24, currency: 'EUR', customerId: 'u1', metadata: { bookingId: 'b1' } });
    // NB : le statut renvoyé vaut « succeeded » dès la création (le client ne l'utilise pas).
    expect(intent).toEqual({ id: 'pi_1', amount: 24, currency: 'EUR', status: 'succeeded', clientSecret: 'pi_1_secret', metadata: { a: 'b' } });
    expect(h.events.emitPaymentCreated).toHaveBeenCalledWith(expect.objectContaining({ paymentIntentId: 'pi_1', amount: 24, userId: 'u1', provider: 'STRIPE' }));
  });

  it('échoue si le fournisseur refuse ou ne renvoie pas de clientSecret', async () => {
    stripe.createPaymentIntent.mockResolvedValueOnce({ success: false, error: 'Carte refusée' });
    await expect(svc.createPaymentIntent(24, 'EUR', 'u1')).rejects.toThrow('Carte refusée');
    stripe.createPaymentIntent.mockResolvedValueOnce({ success: false });
    await expect(svc.createPaymentIntent(24, 'EUR', 'u1')).rejects.toThrow('Erreur lors de la création du Payment Intent');

    stripe.createPaymentIntent.mockResolvedValueOnce({ success: true, transactionId: 'tx_9' });
    await expect(svc.createPaymentIntent(24, 'EUR', 'u1')).rejects.toThrow(/aucun clientSecret.*tx_9/);
    expect(Sentry.captureException).toHaveBeenCalledTimes(3);
  });

  it('refuse un montant, une devise ou un client invalides sans appeler le fournisseur', async () => {
    await expect(svc.createPaymentIntent(0, 'EUR', 'u1')).rejects.toThrow();
    await expect(svc.createPaymentIntent(10, 'EURO', 'u1')).rejects.toThrow();
    await expect(svc.createPaymentIntent(10, 'EUR', '')).rejects.toThrow();
    expect(stripe.createPaymentIntent).not.toHaveBeenCalled();
  });

  it('ignore l’échec de l’émission d’événement', async () => {
    h.events.emitPaymentCreated.mockRejectedValueOnce(new Error('bus HS'));
    stripe.createPaymentIntent.mockResolvedValue({ success: true, paymentIntentId: 'pi_1', clientSecret: 's' });
    await expect(svc.createPaymentIntent(24, 'EUR', 'u1')).resolves.toMatchObject({ id: 'pi_1' });
  });
});

describe('PaymentService.confirmPaymentIntent', () => {
  it('émet « réussi » avec les métadonnées, ou des valeurs par défaut', async () => {
    stripe.confirmPaymentIntent.mockResolvedValueOnce({ success: true, transactionId: 'tx', metadata: { amount: 24, currency: 'XOF', userId: 'u1' } });
    await svc.confirmPaymentIntent('pi_1', 'pm_1');
    expect(stripe.confirmPaymentIntent).toHaveBeenCalledWith('pi_1', 'pm_1');
    expect(h.events.emitPaymentSucceeded).toHaveBeenLastCalledWith(expect.objectContaining({ transactionId: 'tx', amount: 24, currency: 'XOF', userId: 'u1' }));

    stripe.confirmPaymentIntent.mockResolvedValueOnce({ success: true });
    await svc.confirmPaymentIntent('pi_2');
    expect(h.events.emitPaymentSucceeded).toHaveBeenLastCalledWith(expect.objectContaining({ transactionId: 'pi_2', amount: 0, currency: 'EUR', userId: 'unknown' }));
  });

  it('émet « échoué » en cas de refus, et propage une exception', async () => {
    paypal.confirmPaymentIntent.mockResolvedValueOnce({ success: false, error: '3DS refusé' });
    expect(await svc.confirmPaymentIntent('pi_1', undefined, 'PAYPAL' as never)).toMatchObject({ success: false });
    expect(h.events.emitPaymentFailed).toHaveBeenCalledWith('pi_1', '3DS refusé');
    stripe.confirmPaymentIntent.mockResolvedValueOnce({ success: false });
    await svc.confirmPaymentIntent('pi_3');
    expect(h.events.emitPaymentFailed).toHaveBeenLastCalledWith('pi_3', 'Payment confirmation failed');

    stripe.confirmPaymentIntent.mockRejectedValueOnce(new Error('Stripe 500'));
    await expect(svc.confirmPaymentIntent('pi_1')).rejects.toThrow('Stripe 500');
  });
});

describe('PaymentService.processPayment', () => {
  it('traite le paiement et émet l’événement de réussite ou d’échec', async () => {
    stripe.processPayment.mockResolvedValueOnce({ success: true, transactionId: 'tx_1' });
    expect(await svc.processPayment(24, 'EUR', 'u1', 'pm_1', { b: '1' })).toEqual({ success: true, transactionId: 'tx_1' });
    expect(stripe.processPayment).toHaveBeenCalledWith({ amount: 24, currency: 'EUR', customerId: 'u1', paymentMethodId: 'pm_1', metadata: { b: '1' } });
    expect(h.events.emitPaymentSucceeded).toHaveBeenCalledWith(expect.objectContaining({ transactionId: 'tx_1', amount: 24 }));

    paypal.processPayment.mockResolvedValueOnce({ success: false });
    await svc.processPayment(24, 'EUR', 'u1', 'pm_1', {}, 'PAYPAL' as never);
    expect(h.events.emitPaymentFailed).toHaveBeenCalledWith('unknown', 'Payment processing failed');
  });

  it('transforme une exception en échec', async () => {
    stripe.processPayment.mockRejectedValueOnce(new Error('timeout'));
    expect(await svc.processPayment(24, 'EUR', 'u1', 'pm_1')).toEqual({ success: false, error: 'timeout' });
    expect(h.events.emitPaymentFailed).toHaveBeenCalledWith('unknown', 'timeout');
    stripe.processPayment.mockRejectedValueOnce({});
    expect(await svc.processPayment(24, 'EUR', 'u1', 'pm_1')).toEqual({ success: false, error: 'Erreur lors du traitement du paiement' });
  });

  it('refuse un montant nul ou un moyen de paiement absent', async () => {
    await expect(svc.processPayment(0, 'EUR', 'u1', 'pm_1')).rejects.toThrow();
    await expect(svc.processPayment(5, 'EUR', 'u1', '')).rejects.toThrow();
    expect(stripe.processPayment).not.toHaveBeenCalled();
  });
});

describe('PaymentService : remboursement et statut', () => {
  it('rembourse et émet le montant remboursé', async () => {
    stripe.refund.mockResolvedValueOnce({ success: true, amount: 12 });
    expect(await svc.refund('tx_1', 12, 'annulation')).toEqual({ success: true, amount: 12 });
    expect(stripe.refund).toHaveBeenCalledWith({ transactionId: 'tx_1', amount: 12, reason: 'annulation' });
    expect(h.events.emitPaymentRefunded).toHaveBeenCalledWith('tx_1', 12);

    stripe.refund.mockResolvedValueOnce({ success: true });
    await svc.refund('tx_2');
    expect(stripe.refund).toHaveBeenLastCalledWith({ transactionId: 'tx_2', amount: 0, reason: '' });
    expect(h.events.emitPaymentRefunded).toHaveBeenLastCalledWith('tx_2', 0);

    stripe.refund.mockResolvedValueOnce({ success: false, error: 'déjà remboursé' });
    await svc.refund('tx_3', 5);
    expect(h.events.emitPaymentRefunded).toHaveBeenCalledTimes(2);
  });

  it('transforme les exceptions en échec (remboursement, statut)', async () => {
    stripe.refund.mockRejectedValueOnce(new Error('Stripe 500'));
    expect(await svc.refund('tx', 1, undefined, 'STRIPE' as never)).toEqual({ success: false, error: 'Stripe 500' });
    stripe.refund.mockRejectedValueOnce({});
    expect(await svc.refund('tx')).toEqual({ success: false, error: 'Erreur lors du remboursement' });

    stripe.getTransactionStatus.mockResolvedValueOnce({ success: true, transactionId: 'tx' });
    expect(await svc.getTransactionStatus('tx')).toEqual({ success: true, transactionId: 'tx' });
    paypal.getTransactionStatus.mockRejectedValueOnce({});
    expect(await svc.getTransactionStatus('tx', 'PAYPAL' as never)).toEqual({ success: false, error: 'Erreur lors de la récupération du statut' });
    stripe.getTransactionStatus.mockRejectedValueOnce(new Error('réseau'));
    expect(await svc.getTransactionStatus('tx')).toEqual({ success: false, error: 'réseau' });
  });
});

describe('PaymentService.verifyPaymentProof', () => {
  it('rejette un identifiant absent ou d’un format inconnu', async () => {
    expect(await svc.verifyPaymentProof('')).toEqual({ success: false, error: 'Identifiant de paiement manquant' });
    expect(await svc.verifyPaymentProof('tok_123')).toEqual({ success: false, error: 'Identifiant de paiement invalide (attendu pi_… ou cs_…)' });
  });

  it('valide une session Checkout payée au bon montant', async () => {
    h.stripe.checkout.sessions.retrieve.mockResolvedValue({
      id: 'cs_1', payment_intent: 'pi_9', payment_status: 'paid', status: 'complete', amount_total: 2400, currency: 'eur',
    });
    const ok = await svc.verifyPaymentProof('cs_1', { expectedAmount: 24 });
    expect(ok).toMatchObject({ success: true, transactionId: 'pi_9', paymentIntentId: 'pi_9', metadata: { checkoutSessionId: 'cs_1', sessionStatus: 'complete', paymentStatus: 'confirmed' } });
    expect(ok).not.toHaveProperty('error');

    const wrong = await svc.verifyPaymentProof('cs_1', { expectedAmount: 23, expectedCurrency: 'EUR' });
    expect(wrong).toMatchObject({ success: false, error: 'Le montant payé ne correspond pas au montant attendu' });
  });

  it('refuse une session non payée (identifiant d’intention en objet)', async () => {
    h.stripe.checkout.sessions.retrieve.mockResolvedValue({ id: 'cs_2', payment_intent: { id: 'pi_8' }, payment_status: null, amount_total: null, currency: null });
    expect(await svc.verifyPaymentProof('cs_2')).toMatchObject({ success: false, transactionId: 'pi_8', error: 'Checkout session non payée (status: unpaid)' });
    h.stripe.checkout.sessions.retrieve.mockResolvedValue({ id: 'cs_3', payment_intent: null, payment_status: 'unpaid' });
    expect(await svc.verifyPaymentProof('cs_3')).toMatchObject({ success: false, transactionId: 'cs_3' });
  });

  it('valide une intention réussie, accepte « processing » seulement sur demande', async () => {
    h.stripe.paymentIntents.retrieve.mockResolvedValueOnce({ id: 'pi_1', status: 'succeeded', amount: 2400, currency: 'eur' });
    expect(await svc.verifyPaymentProof('pi_1', { expectedAmount: 24, expectedCurrency: 'EUR' })).toMatchObject({ success: true, paymentIntentId: 'pi_1', metadata: { paymentStatus: 'confirmed' } });

    h.stripe.paymentIntents.retrieve.mockResolvedValue({ id: 'pi_2', status: 'processing', amount: 2400, currency: 'eur' });
    expect(await svc.verifyPaymentProof('pi_2')).toMatchObject({ success: false, error: 'PaymentIntent non confirmé (status: processing)' });
    expect(await svc.verifyPaymentProof('pi_2', { acceptProcessing: true })).toMatchObject({ success: true, metadata: { paymentStatus: 'processing' } });
  });

  it('refuse une devise différente et absorbe une erreur Stripe', async () => {
    h.stripe.paymentIntents.retrieve.mockResolvedValueOnce({ id: 'pi_3', status: 'succeeded', amount: 2400, currency: 'usd' });
    expect(await svc.verifyPaymentProof('pi_3', { expectedAmount: 24 })).toMatchObject({ success: false });

    h.stripe.paymentIntents.retrieve.mockRejectedValueOnce(new Error('No such payment_intent'));
    expect(await svc.verifyPaymentProof('pi_x')).toEqual({ success: false, error: 'No such payment_intent' });
    h.stripe.paymentIntents.retrieve.mockRejectedValueOnce({});
    expect(await svc.verifyPaymentProof('pi_x')).toEqual({ success: false, error: 'Erreur lors de la vérification du paiement Stripe' });
  });
});
