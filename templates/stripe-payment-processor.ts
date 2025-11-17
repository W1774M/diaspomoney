/**
 * Stripe Payment Processor - Implémentation concrète du Template Method Pattern
 * 
 * Implémente les méthodes abstraites pour Stripe
 */

import { logger } from '@/lib/logger';
import Stripe from 'stripe';
import {
  PaymentData,
  PaymentIntent,
  PaymentProcessor,
  PaymentResult,
} from './payment-processor.template';

/**
 * StripePaymentProcessor - Implémentation concrète pour Stripe
 */
export class StripePaymentProcessor extends PaymentProcessor {
  private stripe: Stripe;

  constructor(apiKey: string) {
    super();
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-10-29.clover',
    });
  }

  /**
   * Créer un Payment Intent avec Stripe
   */
  protected async createPayment(data: PaymentData): Promise<PaymentIntent> {
    try {
      logger.debug({ amount: data.amount, currency: data.currency }, 'Creating Stripe payment intent');

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convertir en centimes
        currency: data.currency.toLowerCase(),
        customer: data.customerId,
        metadata: {
          ...(data.metadata || {}),
          source: 'diaspomoney',
          processor: 'stripe',
          created_at: new Date().toISOString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
        confirmation_method: 'manual',
        capture_method: 'automatic',
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!,
        metadata: paymentIntent.metadata as Record<string, string>,
      };
    } catch (error: any) {
      logger.error({ error, data }, 'Failed to create Stripe payment intent');
      throw new Error(`Stripe payment intent creation failed: ${error.message}`);
    }
  }

  /**
   * Confirmer un paiement Stripe
   */
  protected async confirmPayment(
    paymentIntent: PaymentIntent,
    data: PaymentData,
  ): Promise<PaymentResult> {
    try {
      logger.debug({ paymentIntentId: paymentIntent.id }, 'Confirming Stripe payment');

      const confirmedIntent = await this.stripe.paymentIntents.confirm(
        paymentIntent.id,
        {
          payment_method: data.paymentMethodId,
        },
      );

      // Vérifier si une action supplémentaire est requise (3D Secure, etc.)
      if (confirmedIntent.status === 'requires_action') {
        const nextAction = confirmedIntent.next_action;
        return {
          success: false,
          requiresAction: true,
          paymentIntentId: paymentIntent.id,
          nextAction: nextAction
            ? {
                type: nextAction.type,
                url: nextAction.type === 'redirect_to_url'
                  ? nextAction.redirect_to_url?.url || ''
                  : '',
              }
            : { type: '', url: '' },
        };
      }

      // Vérifier si le paiement a réussi
      if (confirmedIntent.status === 'succeeded') {
        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          transactionId: confirmedIntent.latest_charge as string | undefined || '',
        };
      }

      // Paiement en attente ou échoué
      return {
        success: false,
        paymentIntentId: paymentIntent.id,
        error: `Payment status: ${confirmedIntent.status}`,
      };
    } catch (error: any) {
      logger.error({ error, paymentIntentId: paymentIntent.id }, 'Failed to confirm Stripe payment');
      
      // Gérer les erreurs spécifiques Stripe
      if (error.type === 'StripeCardError') {
        return {
          success: false,
          paymentIntentId: paymentIntent.id,
          error: error.message || 'Card error',
        };
      }

      throw new Error(`Stripe payment confirmation failed: ${error.message}`);
    }
  }

  /**
   * Hook avant paiement - Vérifications spécifiques Stripe
   */
  protected override async beforePayment(data: PaymentData): Promise<void> {
    await super.beforePayment(data);
    
    // Vérifier que la devise est supportée par Stripe
    const supportedCurrencies = ['eur', 'usd', 'gbp', 'cad', 'aud'];
    if (!supportedCurrencies.includes(data.currency.toLowerCase())) {
      throw new Error(`Currency ${data.currency} is not supported by Stripe`);
    }

    logger.debug({ currency: data.currency }, 'Stripe-specific pre-payment checks passed');
  }

  /**
   * Envoi de notification spécifique Stripe
   */
  protected override async sendNotification(
    paymentIntent: PaymentIntent,
    result: PaymentResult,
  ): Promise<void> {
    await super.sendNotification(paymentIntent, result);

    if (result.success) {
      logger.info({
        paymentIntentId: paymentIntent.id,
        transactionId: result.transactionId,
        processor: 'stripe',
      }, 'Stripe payment notification sent');
    }
  }

  /**
   * Obtenir le nom du processeur
   */
  protected getProcessorName(): string {
    return 'stripe';
  }

  /**
   * Informations sur le provider Stripe
   */
  getProviderInfo() {
    return {
      name: 'Stripe',
      enabled: !!process.env['STRIPE_SECRET_KEY'],
      currencies: ['EUR', 'USD', 'GBP', 'CAD', 'AUD'],
      countries: ['FR', 'US', 'GB', 'CA', 'AU', 'DE', 'ES', 'IT'],
    };
  }
}

