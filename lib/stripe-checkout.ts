/**
 * Utilitaire pour créer des Checkout Sessions Stripe
 * Utilisé pour générer des liens de paiement envoyés par email
 */

import { getStripeInstance } from '@/lib/stripe-config';
import { childLogger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

const log = childLogger({ component: 'StripeCheckout' });

export interface CreateCheckoutSessionParams {
  amount: number; // Montant en euros
  currency: string;
  customerEmail: string;
  bookingId: string;
  reservationNumber: string;
  serviceName: string;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResult {
  url: string;
  sessionId: string;
}

/**
 * Crée un Checkout Session Stripe pour un paiement
 * Retourne l'URL de paiement à envoyer au client
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams,
): Promise<CheckoutSessionResult> {
  try {
    const stripe = getStripeInstance();
    const {
      amount,
      currency,
      customerEmail,
      bookingId,
      reservationNumber,
      serviceName,
      metadata = {},
      successUrl,
      cancelUrl,
    } = params;

    // Validation
    if (amount <= 0) {
      throw new Error('Le montant doit être positif');
    }

    if (!customerEmail) {
      throw new Error('L\'email du client est requis');
    }

    const { cleanUrl } = await import('@/lib/utils');
    const baseUrl = cleanUrl(process.env['NEXT_PUBLIC_APP_URL'] || 'https://diaspomoney.fr');
    
    // Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: serviceName,
              description: `Paiement pour la réservation ${reservationNumber}`,
            },
            unit_amount: Math.round(amount * 100), // Convertir en centimes
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      mode: 'payment',
      success_url: successUrl || `${baseUrl}/dashboard/bookings/${bookingId}?payment=success`,
      cancel_url: cancelUrl || `${baseUrl}/dashboard/bookings/${bookingId}?payment=cancelled`,
      metadata: {
        bookingId,
        reservationNumber,
        serviceName,
        ...metadata,
        source: 'diaspomoney',
        created_at: new Date().toISOString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // Expire dans 7 jours
    });

    if (!session.url) {
      throw new Error('La session Checkout a été créée mais aucune URL n\'est disponible');
    }

    log.info(
      {
        sessionId: session.id,
        bookingId,
        reservationNumber,
        amount,
        currency,
      },
      'Checkout session created successfully',
    );

    return {
      url: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    log.error({ error, params }, 'Error creating checkout session');
    Sentry.captureException(error, {
      tags: { component: 'StripeCheckout', action: 'createCheckoutSession' },
      extra: { params },
    });
    throw error;
  }
}

