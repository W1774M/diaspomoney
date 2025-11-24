/**
 * Implémentation Stripe du Strategy Pattern de paiement
 */

import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { getStripeInstance } from '@/lib/stripe-config';
import type {
  StripePaymentIntentCreateParams,
  StripeRefundCreateParams,
} from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import Stripe from 'stripe';
import {
  IPaymentStrategy,
  PaymentData,
  PaymentResult,
  RefundData,
  RefundResult,
} from '../interfaces/IPaymentStrategy';

export class StripePaymentStrategy implements IPaymentStrategy {
  readonly name = 'STRIPE';
  readonly supportedCurrencies = ['EUR', 'USD', 'GBP', 'XOF', 'XAF'];
  readonly supportedCountries = ['FR', 'SN', 'CI', 'ML', 'US', 'GB'];

  private stripe: Stripe;

  constructor() {
    // Utilise la configuration centralisée conforme à la documentation Stripe
    // https://docs.stripe.com/api/authentication?lang=node
    this.stripe = getStripeInstance();
  }

  canProcess(data: PaymentData): boolean {
    return (
      this.supportedCurrencies.includes(data.currency.toUpperCase()) &&
      data.amount > 0
    );
  }

  async processPayment(data: PaymentData): Promise<PaymentResult> {
    try {
      if (!this.canProcess(data)) {
        return {
          success: false,
          error: 'Stripe ne peut pas traiter ce paiement (devise ou montant invalide)',
        };
      }

      // Créer un Payment Intent
      const paymentIntentParams: StripePaymentIntentCreateParams = {
        amount: Math.round(data.amount * 100), // Convertir en centimes
        currency: data.currency.toLowerCase(),
        customer: data.customerId,
        confirmation_method: 'automatic',
        capture_method: 'automatic',
        metadata: {
          ...data.metadata,
          source: 'diaspomoney',
          created_at: new Date().toISOString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      };
      if (data.paymentMethodId) {
        paymentIntentParams.payment_method = data.paymentMethodId;
      }

      // Ajouter description seulement si défini
      if (data.description) {
        paymentIntentParams.description = data.description;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'payment_processed',
        value: 1,
        timestamp: new Date(),
        labels: {
          provider: 'stripe',
          currency: data.currency.toLowerCase(),
          amount_range: this.getAmountRange(data.amount),
        },
        type: 'counter',
      });

      return {
        success: paymentIntent.status === 'succeeded' || false,
        transactionId: paymentIntent.id,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || '',
        requiresAction: paymentIntent.status === 'requires_action',
        nextAction: paymentIntent.next_action
          ? {
              type: paymentIntent.next_action.type,
              url: (paymentIntent.next_action as any).redirect_to_url?.url,
            }
          : { type: '', url: '' },
        metadata: {
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
        },
      };
    } catch (error: any) {
      console.error('[StripePaymentStrategy] Error in processPayment:', error);
      Sentry.captureException(error);

      return {
        success: false,
        error: error.message || 'Erreur lors du traitement du paiement Stripe',
      };
    }
  }

  async createPaymentIntent(data: PaymentData): Promise<PaymentResult> {
    try {
      if (!this.canProcess(data)) {
        return {
          success: false,
          error: 'Stripe ne peut pas traiter ce paiement (devise ou montant invalide)',
        };
      }

      // Créer ou récupérer un customer Stripe
      // Si customerId commence par "cus_", c'est déjà un ID Stripe
      // Sinon, on crée un nouveau customer ou on le récupère depuis les métadonnées
      let stripeCustomerId: string | undefined = undefined;
      
      if (data.customerId && data.customerId.startsWith('cus_')) {
        // C'est déjà un ID Stripe valide
        stripeCustomerId = data.customerId;
        // eslint-disable-next-line no-console
        console.log('[StripePaymentStrategy] Using existing Stripe customer:', stripeCustomerId);
      } else if (data.metadata?.['customerEmail']) {
        // Chercher un customer existant par email
        const customers = await this.stripe.customers.list({
          email: data.metadata['customerEmail'],
          limit: 1,
        });
        
        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0]?.id || undefined;
          // eslint-disable-next-line no-console
          console.log('[StripePaymentStrategy] Found existing Stripe customer:', stripeCustomerId);
        } else {
          // Créer un nouveau customer
          const customer = await this.stripe.customers.create({
            email: data.metadata['customerEmail'],
            metadata: {
              userId: data.customerId,
              source: 'diaspomoney',
            },
          });
          stripeCustomerId = customer.id;
          // eslint-disable-next-line no-console
          console.log('[StripePaymentStrategy] Created new Stripe customer:', stripeCustomerId);
        }
      } else {
        // eslint-disable-next-line no-console
        console.log('[StripePaymentStrategy] No customer email provided, creating PaymentIntent without customer');
      }

      const paymentIntentParams: StripePaymentIntentCreateParams = {
        amount: Math.round(data.amount * 100),
        currency: data.currency.toLowerCase(),
        ...(stripeCustomerId && { customer: stripeCustomerId }),
        ...(data.metadata?.['customerEmail'] && !stripeCustomerId && { 
          receipt_email: data.metadata['customerEmail'], 
        }),
        metadata: {
          ...data.metadata,
          userId: data.customerId,
          source: 'diaspomoney',
          created_at: new Date().toISOString(),
        },
        // Note: automatic_payment_methods et confirmation_method sont mutuellement exclusifs
        // Quand automatic_payment_methods est utilisé, confirmation_method est géré automatiquement
        automatic_payment_methods: {
          enabled: true,
        },
        // Ne pas spécifier confirmation_method quand automatic_payment_methods est utilisé
        capture_method: 'automatic',
      };
      
      let paymentIntent;
      try {
        paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);
      } catch (stripeError: any) {
        console.error('[StripePaymentStrategy] Error creating PaymentIntent:', {
          error: stripeError.message,
          type: stripeError.type,
          code: stripeError.code,
          param: stripeError.param,
          paymentIntentParams: {
            ...paymentIntentParams,
            customer: paymentIntentParams.customer ? `${paymentIntentParams.customer.substring(0, 10)}...` : undefined,
          },
        });
        Sentry.captureException(stripeError, {
          tags: { component: 'StripePaymentStrategy', method: 'createPaymentIntent' },
          extra: { paymentIntentParams, stripeError },
        });
        throw new Error(
          `Erreur Stripe lors de la création du PaymentIntent: ${stripeError.message || 'Erreur inconnue'}`,
        );
      }

      // Vérifier que client_secret est présent (obligatoire pour Stripe Elements)
      if (!paymentIntent.client_secret) {
        const error = new Error(
          `Stripe n'a pas retourné de client_secret pour le PaymentIntent ${paymentIntent.id}. ` +
          `Status: ${paymentIntent.status}, Confirmation method: ${paymentIntentParams.confirmation_method}`,
        );
        console.error('[StripePaymentStrategy] Missing client_secret:', {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          confirmation_method: paymentIntentParams.confirmation_method,
          capture_method: paymentIntentParams.capture_method,
        });
        Sentry.captureException(error, {
          tags: { component: 'StripePaymentStrategy', method: 'createPaymentIntent' },
          extra: { paymentIntentId: paymentIntent.id, paymentIntent },
        });
        throw error;
      }

      monitoringManager.recordMetric({
        name: 'payment_intents_created',
        value: 1,
        timestamp: new Date(),
        labels: {
          provider: 'stripe',
          currency: data.currency.toLowerCase(),
        },
        type: 'counter',
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        metadata: {
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
      };
    } catch (error: any) {
      console.error('[StripePaymentStrategy] Error in createPaymentIntent:', error);
      Sentry.captureException(error);

      return {
        success: false,
        error: error.message || 'Erreur lors de la création du Payment Intent Stripe',
      };
    }
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
  ): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        paymentMethodId ? { payment_method: paymentMethodId } : {},
      );

      return {
        success: paymentIntent.status === 'succeeded',
        transactionId: paymentIntent.id,
        paymentIntentId: paymentIntent.id,
        requiresAction: paymentIntent.status === 'requires_action',
        nextAction: paymentIntent.next_action
          ? {
              type: paymentIntent.next_action.type,
              url: (paymentIntent.next_action as any).redirect_to_url?.url,
            }
          : { type: '', url: '' },
        metadata: {
          status: paymentIntent.status as any,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency as any,
        },
      };
    } catch (error: any) {
      console.error('[StripePaymentStrategy] Error in confirmPaymentIntent:', error);
      Sentry.captureException(error);

      return {
        success: false,
        error: error.message || 'Erreur lors de la confirmation du Payment Intent Stripe',
      };
    }
  }

  async refund(data: RefundData): Promise<RefundResult> {
    try {
      const refundAmount = data.amount
        ? Math.round(data.amount * 100)
        : 0;

      const refundParams: StripeRefundCreateParams = {
        payment_intent: data.transactionId,
        amount: refundAmount,
        metadata: data.metadata || { source: 'diaspomoney' },
      };
      if (data.reason) {
        refundParams.reason = data.reason as NonNullable<StripeRefundCreateParams['reason']>;
      }
      const refund = await this.stripe.refunds.create(refundParams);

      monitoringManager.recordMetric({
        name: 'payment_refunded',
        value: 1,
        timestamp: new Date(),
        labels: {
          provider: 'stripe',
        },
        type: 'counter',
      });

      return {
        success: refund.status === 'succeeded' || refund.status === 'pending',
        refundId: refund.id,
        amount: refund.amount / 100,
      };
    } catch (error: any) {
      console.error('[StripePaymentStrategy] Error in refund:', error);
      Sentry.captureException(error);

      return {
        success: false,
        error: error.message || 'Erreur lors du remboursement Stripe',
      };
    }
  }

  async getTransactionStatus(transactionId: string): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(transactionId);

      return {
        success: paymentIntent.status === 'succeeded',
        transactionId: paymentIntent.id,
        paymentIntentId: paymentIntent.id,
        metadata: {
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
        },
      };
    } catch (error: any) {
      console.error('[StripePaymentStrategy] Error in getTransactionStatus:', error);
      Sentry.captureException(error);

      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération du statut Stripe',
      };
    }
  }

  /**
   * Obtenir la plage de montant pour les métriques
   */
  private getAmountRange(amount: number): string {
    if (amount < 10) return '0-10';
    if (amount < 50) return '10-50';
    if (amount < 100) return '50-100';
    if (amount < 500) return '100-500';
    if (amount < 1000) return '500-1000';
    return '1000+';
  }
}

