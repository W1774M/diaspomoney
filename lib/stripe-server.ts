/**
 * Configuration Stripe pour les routes API
 * Utilise la configuration centralisée conforme à la documentation officielle
 * https://docs.stripe.com/api/authentication?lang=node
 */

import Stripe from 'stripe';
import { getStripeInstance, isStripeConfigured } from './stripe-config';

// Instance Stripe pour compatibilité avec le code existant
let stripe: Stripe | undefined;

/**
 * Obtient l'instance Stripe (compatibilité avec le code existant)
 * Utilise la configuration centralisée
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

export type CreatePaymentIntentParams = {
  amountInMinorUnit: number; // e.g., cents
  currency?: string; // default EUR
  customerEmail?: string;
  metadata?: Record<string, string>;
};

export async function createPaymentIntent(params: CreatePaymentIntentParams) {
  const client = getStripe();
  const {
    amountInMinorUnit,
    currency = 'eur',
    customerEmail,
    metadata,
  } = params;

  const paymentIntent = await client.paymentIntents.create({
    amount: amountInMinorUnit,
    currency,
    ...(customerEmail ? { receipt_email: customerEmail } : {}),
    automatic_payment_methods: { enabled: true },
    ...(metadata ? { metadata } : {}),
  });

  return paymentIntent;
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
