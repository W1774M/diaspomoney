/**
 * Accès serveur Stripe — thin wrapper sur `lib/stripe-config`.
 *
 * Chemin produit (ne pas contourner) :
 * - Paiement : `PaymentService` → `StripePaymentStrategy` → `getStripeInstance`
 * - Confirmation booking : `ConfirmBookingPayment` + webhook `app/api/stripe/webhook`
 * - Checkout email : `lib/stripe-checkout` → `getStripeInstance`
 *
 * Voir `docs/stripe-integration.md` § Chemin canonique.
 */

import Stripe from 'stripe';
import { getStripeInstance, isStripeConfigured } from './stripe-config';

let stripe: Stripe | undefined;

/**
 * Instance Stripe serveur (singleton). Préférer pour retrieve / webhooks.
 * Pour créer un PaymentIntent métier → `paymentService.createPaymentIntent`.
 */
export function getStripe(): Stripe {
  if (!stripe) {
    if (!isStripeConfigured()) {
      throw new Error('Stripe is not configured. Missing STRIPE_SECRET_KEY env.');
    }
    stripe = getStripeInstance();
  }
  return stripe;
}

export function verifyStripeSignature({
  rawBody,
  signature,
  webhookSecret,
}: {
  rawBody: Buffer;
  signature: string | null;
  webhookSecret: string;
}) {
  const client = getStripe();
  if (!signature) throw new Error('Missing Stripe-Signature header');
  return client.webhooks.constructEvent(rawBody, signature, webhookSecret);
}
