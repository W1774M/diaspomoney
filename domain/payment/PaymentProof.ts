/**
 * Politique domaine — évaluation d'une preuve de paiement (après retrieve infra).
 * Aucune dépendance Stripe : l'adapter fournit un snapshot.
 */

import { Money } from './Money';

export type PaymentProofSource = 'payment_intent' | 'checkout_session';

export interface PaymentProofSnapshot {
  source: PaymentProofSource;
  /** Identifiant preuve (pi_… ou cs_…) */
  proofId: string;
  paymentIntentId?: string;
  checkoutSessionId?: string;
  /** Statut brut provider (ex: succeeded, paid, processing) */
  providerStatus: string;
  /** Montant réel en unité mineure (centimes) si connu */
  amountMinor?: number;
  currency?: string;
}

export interface EvaluatePaymentProofOptions {
  expected?: Money;
  /** Autoriser processing (virements, etc.) pour création booking */
  acceptProcessing?: boolean;
}

export interface PaymentProofEvaluation {
  valid: boolean;
  paymentStatus: 'confirmed' | 'processing' | 'failed';
  paymentIntentId?: string;
  checkoutSessionId?: string;
  amount?: number;
  currency?: string;
  error?: string;
  providerStatus: string;
}

const SUCCEEDED_PI = new Set(['succeeded']);
const PROCESSING_PI = new Set(['processing']);
const PAID_SESSION = new Set(['paid']);

export class PaymentProof {
  private constructor(private readonly snapshot: PaymentProofSnapshot) {}

  static fromSnapshot(snapshot: PaymentProofSnapshot): PaymentProof {
    if (!snapshot.proofId) {
      throw new Error('PaymentProof requires proofId');
    }
    return new PaymentProof(snapshot);
  }

  evaluate(options: EvaluatePaymentProofOptions = {}): PaymentProofEvaluation {
    const { expected, acceptProcessing = false } = options;
    const { snapshot } = this;

    if (expected && snapshot.amountMinor != null && snapshot.currency) {
      if (
        !expected.matchesMinorUnits(
          snapshot.amountMinor,
          snapshot.currency,
        )
      ) {
        return {
          valid: false,
          paymentStatus: 'failed',
          paymentIntentId: snapshot.paymentIntentId,
          checkoutSessionId: snapshot.checkoutSessionId,
          amount: snapshot.amountMinor / 100,
          currency: snapshot.currency.toUpperCase(),
          providerStatus: snapshot.providerStatus,
          error: 'Le montant payé ne correspond pas au montant attendu',
        };
      }
    }

    if (
      expected &&
      snapshot.currency &&
      expected.currency !== snapshot.currency.toUpperCase()
    ) {
      return {
        valid: false,
        paymentStatus: 'failed',
        paymentIntentId: snapshot.paymentIntentId,
        checkoutSessionId: snapshot.checkoutSessionId,
        currency: snapshot.currency.toUpperCase(),
        providerStatus: snapshot.providerStatus,
        error: 'La devise du paiement ne correspond pas',
      };
    }

    const status = snapshot.providerStatus.toLowerCase();

    if (snapshot.source === 'payment_intent') {
      if (SUCCEEDED_PI.has(status)) {
        return this.ok('confirmed');
      }
      if (acceptProcessing && PROCESSING_PI.has(status)) {
        return this.ok('processing');
      }
      return {
        valid: false,
        paymentStatus: 'failed',
        paymentIntentId: snapshot.paymentIntentId || snapshot.proofId,
        providerStatus: snapshot.providerStatus,
        amount:
          snapshot.amountMinor != null ? snapshot.amountMinor / 100 : undefined,
        currency: snapshot.currency?.toUpperCase(),
        error: `PaymentIntent non confirmé (status: ${snapshot.providerStatus})`,
      };
    }

    // checkout_session — providerStatus = payment_status (paid / unpaid / …)
    if (PAID_SESSION.has(status)) {
      return this.ok('confirmed');
    }
    if (
      acceptProcessing &&
      status === 'unpaid' &&
      snapshot.providerStatus === 'unpaid'
    ) {
      // Session ouverte non payée n'est pas une preuve ; laisser failed
      // (processing session géré via flag dédié si besoin)
    }

    return {
      valid: false,
      paymentStatus: 'failed',
      paymentIntentId: snapshot.paymentIntentId,
      checkoutSessionId: snapshot.checkoutSessionId || snapshot.proofId,
      providerStatus: snapshot.providerStatus,
      amount:
        snapshot.amountMinor != null ? snapshot.amountMinor / 100 : undefined,
      currency: snapshot.currency?.toUpperCase(),
      error: `Checkout session non payée (status: ${snapshot.providerStatus})`,
    };
  }

  private ok(
    paymentStatus: 'confirmed' | 'processing',
  ): PaymentProofEvaluation {
    const { snapshot } = this;
    return {
      valid: true,
      paymentStatus,
      paymentIntentId: snapshot.paymentIntentId,
      checkoutSessionId: snapshot.checkoutSessionId,
      amount:
        snapshot.amountMinor != null ? snapshot.amountMinor / 100 : undefined,
      currency: snapshot.currency?.toUpperCase(),
      providerStatus: snapshot.providerStatus,
    };
  }
}
