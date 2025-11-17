/**
 * Implémentation Stripe du Strategy Pattern de paiement
 */

import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
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
    const secretKey = process.env['STRIPE_SECRET_KEY'];
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-10-29.clover',
    });
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
      const paymentIntentParams: any = {
        amount: Math.round(data.amount * 100), // Convertir en centimes
        currency: data.currency.toLowerCase(),
        customer: data.customerId,
        payment_method: data.paymentMethodId,
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

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100),
        currency: data.currency.toLowerCase(),
        customer: data.customerId,
        metadata: {
          ...data.metadata,
          source: 'diaspomoney',
          created_at: new Date().toISOString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
        confirmation_method: 'manual',
        capture_method: 'automatic',
      });

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
        clientSecret: paymentIntent.client_secret || '',
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

      const refund = await this.stripe.refunds.create({
        payment_intent: data.transactionId,
        amount: refundAmount,
        reason: data.reason as any,
        metadata: data.metadata || { source: 'diaspomoney' },
      });

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

