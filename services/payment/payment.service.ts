/**
 * Payment Gateway Service - DiaspoMoney
 * Service de gestion des paiements Company-Grade
 * Basé sur la charte de développement
 */

import Stripe from 'stripe';
// import { securityManager } from '@/lib/security/advanced-security';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import * as Sentry from '@sentry/nextjs';

// Configuration Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  clientSecret: string;
  paymentMethod?: string;
  metadata: Record<string, string>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'sepa_debit' | 'ideal' | 'bancontact' | 'sofort';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  sepa_debit?: {
    last4: string;
    bank_code: string;
  };
  isDefault: boolean;
  createdAt: Date;
}

export interface PaymentProvider {
  name: string;
  enabled: boolean;
  currencies: string[];
  countries: string[];
  fees: {
    percentage: number;
    fixed: number;
  };
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  requiresAction?: boolean;
  nextAction?: {
    type: string;
    url?: string;
  };
}

export class PaymentService {
  private static instance: PaymentService;
  
  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Créer un Payment Intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    metadata: Record<string, string> = {}
  ): Promise<PaymentIntent> {
    try {
      // Validation des paramètres
      if (amount <= 0) {
        throw new Error('Le montant doit être positif');
      }

      if (!currency || currency.length !== 3) {
        throw new Error('Devise invalide');
      }

      // Créer le Payment Intent avec Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convertir en centimes
        currency: currency.toLowerCase(),
        customer: customerId,
        metadata: {
          ...metadata,
          source: 'diaspomoney',
          created_at: new Date().toISOString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
        confirmation_method: 'manual',
        capture_method: 'automatic'
      });

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'payment_intents_created',
        value: 1,
        timestamp: new Date(),
        labels: {
          currency: currency.toLowerCase(),
          amount_range: this.getAmountRange(amount)
        },
        type: 'counter'
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status as any,
        clientSecret: paymentIntent.client_secret!,
        metadata: paymentIntent.metadata
      };

    } catch (error) {
      console.error('Erreur createPaymentIntent:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Confirmer un Payment Intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<PaymentResult> {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId
      });

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'payment_intents_confirmed',
        value: 1,
        timestamp: new Date(),
        labels: {
          status: paymentIntent.status,
          currency: paymentIntent.currency
        },
        type: 'counter'
      });

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          transactionId: paymentIntent.id
        };
      } else if (paymentIntent.status === 'requires_action') {
        return {
          success: false,
          requiresAction: true,
          nextAction: {
            type: 'redirect_to_url',
            url: paymentIntent.next_action?.redirect_to_url?.url
          }
        };
      } else {
        return {
          success: false,
          error: `Payment failed with status: ${paymentIntent.status}`
        };
      }

    } catch (error) {
      console.error('Erreur confirmPaymentIntent:', error);
      Sentry.captureException(error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Récupérer les méthodes de paiement d'un client
   */
  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type as any,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year
        } : undefined,
        sepa_debit: pm.sepa_debit ? {
          last4: pm.sepa_debit.last4,
          bank_code: pm.sepa_debit.bank_code || ''
        } : undefined,
        isDefault: false, // TODO: Gérer les méthodes par défaut
        createdAt: new Date(pm.created * 1000)
      }));

    } catch (error) {
      console.error('Erreur getPaymentMethods:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Ajouter une méthode de paiement
   */
  async addPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<PaymentMethod> {
    try {
      // Attacher la méthode de paiement au client
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      return {
        id: paymentMethod.id,
        type: paymentMethod.type as any,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year
        } : undefined,
        isDefault: false,
        createdAt: new Date(paymentMethod.created * 1000)
      };

    } catch (error) {
      console.error('Erreur addPaymentMethod:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Supprimer une méthode de paiement
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await stripe.paymentMethods.detach(paymentMethodId);

    } catch (error) {
      console.error('Erreur removePaymentMethod:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Rembourser un paiement
   */
  async refundPayment(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<PaymentResult> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason as any,
        metadata: {
          source: 'diaspomoney',
          refunded_at: new Date().toISOString()
        }
      });

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'refunds_created',
        value: 1,
        timestamp: new Date(),
        labels: {
          reason: reason || 'requested_by_customer'
        },
        type: 'counter'
      });

      return {
        success: true,
        transactionId: refund.id
      };

    } catch (error) {
      console.error('Erreur refundPayment:', error);
      Sentry.captureException(error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de remboursement'
      };
    }
  }

  /**
   * Gérer les webhooks Stripe
   */
  async handleWebhook(payload: string, signature: string): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
          
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
          
        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
          break;
          
        default:
          console.log(`Webhook non géré: ${event.type}`);
      }

    } catch (error) {
      console.error('Erreur handleWebhook:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Gérer le succès d'un paiement
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // TODO: Mettre à jour le statut de la transaction
      // await transactionService.updateTransactionStatus(
      //   paymentIntent.metadata.transactionId,
      //   'COMPLETED',
      //   { stripePaymentIntentId: paymentIntent.id }
      // );

      // Enregistrer les métriques de revenus
      monitoringManager.recordMetric({
        name: 'revenue_total',
        value: paymentIntent.amount / 100,
        timestamp: new Date(),
        labels: {
          currency: paymentIntent.currency,
          payment_method: 'stripe'
        },
        type: 'counter'
      });

    } catch (error) {
      console.error('Erreur handlePaymentSucceeded:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Gérer l'échec d'un paiement
   */
  private async handlePaymentFailed(_paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // TODO: Mettre à jour le statut de la transaction
      // await transactionService.updateTransactionStatus(
      //   paymentIntent.metadata.transactionId,
      //   'FAILED',
      //   { 
      //     stripePaymentIntentId: paymentIntent.id,
      //     failureReason: paymentIntent.last_payment_error?.message
      //   }
      // );

    } catch (error) {
      console.error('Erreur handlePaymentFailed:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Gérer une dispute
   */
  private async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    try {
      // TODO: Notifier l'équipe de support
      // TODO: Mettre en quarantaine la transaction
      
      console.log(`Dispute créée: ${dispute.id} pour ${dispute.amount}`);

    } catch (error) {
      console.error('Erreur handleDisputeCreated:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Obtenir les providers de paiement disponibles
   */
  getPaymentProviders(): PaymentProvider[] {
    return [
      {
        name: 'Stripe',
        enabled: true,
        currencies: ['EUR', 'USD', 'GBP'],
        countries: ['FR', 'DE', 'ES', 'IT', 'BE', 'NL'],
        fees: { percentage: 0.014, fixed: 0.25 }
      },
      {
        name: 'PayPal',
        enabled: false, // À implémenter
        currencies: ['EUR', 'USD'],
        countries: ['FR', 'DE', 'ES', 'IT'],
        fees: { percentage: 0.034, fixed: 0.35 }
      },
      {
        name: 'Orange Money',
        enabled: false, // À implémenter
        currencies: ['XOF', 'XAF'],
        countries: ['SN', 'CI', 'CM', 'BF'],
        fees: { percentage: 0.02, fixed: 0.10 }
      }
    ];
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

// Export de l'instance singleton
export const paymentService = PaymentService.getInstance();
