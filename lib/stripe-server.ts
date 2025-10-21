import Stripe from 'stripe';

const stripeSecretKey = process.env['STRIPE_SECRET_KEY'];
if (!stripeSecretKey) {
  // In dev, we want a clear error if env is missing
  console.warn('[Stripe] STRIPE_SECRET_KEY is not set. Stripe will not work.');
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    })
  : (undefined as unknown as Stripe);

export function getStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe is not configured. Missing STRIPE_SECRET_KEY env.');
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
