/**
 * Payment Processor Factory
 * 
 * Factory pour créer les instances de processeurs de paiement
 * selon le provider sélectionné
 */

import { logger } from '@/lib/logger';
import { PaymentProcessor } from './payment-processor.template';
import { PayPalPaymentProcessor } from './paypal-payment-processor';
import { StripePaymentProcessor } from './stripe-payment-processor';

export type PaymentProvider = 'STRIPE' | 'PAYPAL';

/**
 * Factory pour créer les processeurs de paiement
 */
export class PaymentProcessorFactory {
  /**
   * Créer un processeur de paiement selon le provider
   */
  static createProcessor(provider: PaymentProvider): PaymentProcessor {
    switch (provider) {
      case 'STRIPE': {
        const apiKey = process.env['STRIPE_SECRET_KEY'];
        if (!apiKey) {
          throw new Error('STRIPE_SECRET_KEY is not configured');
        }
        return new StripePaymentProcessor(apiKey);
      }

      case 'PAYPAL': {
        const clientId = process.env['PAYPAL_CLIENT_ID'];
        const clientSecret = process.env['PAYPAL_CLIENT_SECRET'];
        const isSandbox = process.env['PAYPAL_SANDBOX'] === 'true';

        if (!clientId || !clientSecret) {
          throw new Error('PayPal credentials are not configured');
        }
        return new PayPalPaymentProcessor(clientId, clientSecret, isSandbox);
      }

      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  /**
   * Obtenir le meilleur processeur selon la devise et le pays
   */
  static getBestProcessor(currency: string, country?: string): PaymentProcessor {
    const currencyUpper = currency.toUpperCase();

    // Logique de sélection du meilleur provider
    // Stripe est généralement meilleur pour EUR/USD
    if (['EUR', 'USD', 'GBP'].includes(currencyUpper)) {
      try {
        return this.createProcessor('STRIPE');
      } catch (error) {
        logger.warn({ error, currency }, 'Stripe not available, falling back to PayPal');
      }
    }

    // PayPal pour les autres devises ou si Stripe n'est pas disponible
    try {
      return this.createProcessor('PAYPAL');
    } catch (error) {
      logger.error({ error, currency }, 'No payment processor available');
      throw new Error('No payment processor is configured');
    }
  }

  /**
   * Obtenir tous les processeurs disponibles
   */
  static getAvailableProcessors(): PaymentProcessor[] {
    const processors: PaymentProcessor[] = [];

    try {
      processors.push(this.createProcessor('STRIPE'));
    } catch (error) {
      logger.debug('Stripe processor not available');
    }

    try {
      processors.push(this.createProcessor('PAYPAL'));
    } catch (error) {
      logger.debug('PayPal processor not available');
    }

    return processors;
  }
}

