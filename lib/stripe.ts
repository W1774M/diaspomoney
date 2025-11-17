/**
 * Service Stripe pour la validation et le traitement des paiements
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 */

import { childLogger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export interface StripeCardData {
  number: string;
  exp_month: number;
  exp_year: number;
  cvc: string;
  name: string;
}

export interface StripeValidationResult {
  valid: boolean;
  error?: string;
  token?: string;
}

/**
 * Valide les données de carte avec l'API Stripe
 */
export async function validateCardWithStripe(
  cardData: StripeCardData
): Promise<StripeValidationResult> {
  const log = childLogger({
    component: 'StripeService',
    action: 'validateCard',
  });

  try {
    log.debug({ cardLast4: cardData.number.slice(-4) }, 'Validating card data');

    // Simulation de l'appel à l'API Stripe
    // En production, vous utiliseriez le SDK Stripe côté serveur

    // Validation basique des données
    if (!cardData.number || cardData.number.length < 13) {
      log.warn(
        { cardLength: cardData.number?.length },
        'Invalid card number length'
      );
      return { valid: false, error: 'Numéro de carte invalide' };
    }

    if (!cardData.cvc || cardData.cvc.length < 3) {
      log.warn({ cvvLength: cardData.cvc?.length }, 'Invalid CVV length');
      return { valid: false, error: 'CVV invalide' };
    }

    if (!cardData.name || cardData.name.length < 2) {
      log.warn(
        { nameLength: cardData.name?.length },
        'Invalid cardholder name'
      );
      return { valid: false, error: 'Nom du titulaire invalide' };
    }

    // Vérification de la date d'expiration
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (
      cardData.exp_year < currentYear ||
      (cardData.exp_year === currentYear && cardData.exp_month < currentMonth)
    ) {
      log.warn(
        { expYear: cardData.exp_year, expMonth: cardData.exp_month },
        'Card expired'
      );
      return { valid: false, error: 'La carte a expiré' };
    }

    // Simulation d'un token Stripe
    const mockToken = `tok_${Math.random().toString(36).substr(2, 9)}`;

    log.info({ token: mockToken }, 'Card validated successfully');
    return { valid: true, token: mockToken };
  } catch (error) {
    log.error({ error }, 'Error validating card with Stripe');
    Sentry.captureException(error, {
      tags: { component: 'StripeService', action: 'validateCard' },
      extra: { cardLast4: cardData.number?.slice(-4) },
    });
    return {
      valid: false,
      error: 'Erreur lors de la validation de la carte. Veuillez réessayer.',
    };
  }
}

/**
 * Traite le paiement avec Stripe
 */
export async function processPaymentWithStripe(
  token: string,
  amount: number,
  currency: string = 'EUR'
): Promise<{ success: boolean; error?: string; paymentId?: string }> {
  const log = childLogger({
    component: 'StripeService',
    action: 'processPayment',
  });

  try {
    log.debug(
      { amount, currency, token: token.slice(0, 10) + '...' },
      'Processing payment'
    );

    // Simulation du traitement de paiement
    // En production, vous feriez un appel à votre API backend qui utilise Stripe

    // Simulation d'un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulation d'un succès (90% de chance)
    const success = Math.random() > 0.1;

    if (success) {
      const paymentId = `pi_${Math.random().toString(36).substr(2, 14)}`;
      log.info(
        { paymentId, amount, currency },
        'Payment processed successfully'
      );
      return { success: true, paymentId };
    } else {
      log.warn({ amount, currency }, 'Payment declined by bank');
      return {
        success: false,
        error: 'Le paiement a été refusé par votre banque',
      };
    }
  } catch (error) {
    log.error({ error, amount, currency }, 'Error processing payment');
    Sentry.captureException(error, {
      tags: { component: 'StripeService', action: 'processPayment' },
      extra: { amount, currency },
    });
    return { success: false, error: 'Erreur lors du traitement du paiement' };
  }
}

/**
 * Formate le numéro de carte pour l'affichage
 */
export function formatCardNumber(number: string): string {
  const cleaned = number.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').substring(0, 19);
}

/**
 * Formate la date d'expiration
 */
export function formatExpiryDate(date: string): string {
  const cleaned = date.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
  }
  return cleaned;
}
