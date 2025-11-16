/**
 * Payment Gateway Service - DiaspoMoney
 * Service de gestion des paiements Company-Grade
 *
 * Implémente les design patterns :
 * - Singleton Pattern
 * - Repository Pattern
 * - Service Layer Pattern
 * - Logger Pattern (structured logging avec childLogger)
 * - Decorator Pattern (@Log, @Retry)
 * - Error Handling Pattern (Sentry)
 * - Dependency Injection
 */

import { config } from '@/config/app.config';
import { Log } from '@/lib/decorators/log.decorator';
import { Retry, RetryHelpers } from '@/lib/decorators/retry.decorator';
import { childLogger } from '@/lib/logger';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import type { ITransactionRepository } from '@/repositories';
import { getTransactionRepository } from '@/repositories';
import { notificationService } from '@/services/notification/notification.service';
import type {
  PaymentIntent,
  PaymentProvider,
  PaymentResult,
  StripePaymentMethod,
} from '@/types/payments';
import * as Sentry from '@sentry/nextjs';
import Stripe from 'stripe';

// Configuration Stripe
const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: '2025-10-29.clover',
});

export class PaymentService {
  private static instance: PaymentService;
  private transactionRepository: ITransactionRepository;
  private readonly log = childLogger({
    component: 'PaymentService',
  });

  private constructor() {
    this.transactionRepository = getTransactionRepository();
  }

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Créer un Payment Intent
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Retry({
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    shouldRetry: RetryHelpers.retryOnNetworkOrServerError,
  })
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    metadata: Record<string, string> = {}
  ): Promise<PaymentIntent> {
    try {
      // Validation des paramètres
      if (amount <= 0) {
        const error = new Error('Le montant doit être positif');
        this.log.error({ amount }, 'Invalid amount');
        throw error;
      }

      if (!currency || currency.length !== 3) {
        const error = new Error('Devise invalide');
        this.log.error({ currency }, 'Invalid currency');
        throw error;
      }

      // Créer le Payment Intent avec Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convertir en centimes
        currency: currency.toLowerCase(),
        customer: customerId,
        metadata: {
          ...metadata,
          source: 'diaspomoney',
          created_at: new Date().toISOString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
        confirmation_method: 'manual',
        capture_method: 'automatic',
      });

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'payment_intents_created',
        value: 1,
        timestamp: new Date(),
        labels: {
          currency: currency.toLowerCase(),
          amount_range: this.getAmountRange(amount),
        },
        type: 'counter',
      });

      this.log.info(
        {
          paymentIntentId: paymentIntent.id,
          amount,
          currency,
          customerId,
        },
        'Payment intent created successfully'
      );

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status as any,
        clientSecret: paymentIntent.client_secret!,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      this.log.error(
        { error, amount, currency, customerId },
        'Error creating payment intent'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Confirmer un Payment Intent
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Retry({
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    shouldRetry: RetryHelpers.retryOnNetworkOrServerError,
  })
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<PaymentResult> {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        paymentMethodId ? { payment_method: paymentMethodId } : undefined
      );

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'payment_intents_confirmed',
        value: 1,
        timestamp: new Date(),
        labels: {
          status: paymentIntent.status,
          currency: paymentIntent.currency,
        },
        type: 'counter',
      });

      if (paymentIntent.status === 'succeeded') {
        this.log.info(
          { paymentIntentId, status: paymentIntent.status },
          'Payment intent confirmed successfully'
        );
        return {
          success: true,
          transactionId: paymentIntent.id,
        };
      } else if (paymentIntent.status === 'requires_action') {
        this.log.info(
          { paymentIntentId, status: paymentIntent.status },
          'Payment intent requires action'
        );
        return {
          success: false,
          requiresAction: true,
          nextAction: {
            type: 'redirect_to_url',
            url: paymentIntent.next_action?.redirect_to_url?.url || '',
          },
        };
      } else {
        this.log.warn(
          { paymentIntentId, status: paymentIntent.status },
          'Payment intent failed'
        );
        return {
          success: false,
          error: `Payment failed with status: ${paymentIntent.status}`,
        };
      }
    } catch (error) {
      this.log.error(
        { error, paymentIntentId, paymentMethodId },
        'Error confirming payment intent'
      );
      Sentry.captureException(error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Récupérer les méthodes de paiement d'un client
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  async getPaymentMethods(customerId: string): Promise<StripePaymentMethod[]> {
    try {
      // Récupérer le client Stripe pour obtenir la méthode par défaut
      const customer = await stripe.customers.retrieve(customerId);
      const defaultPaymentMethodId =
        typeof customer === 'object' && !customer.deleted
          ? customer.invoice_settings?.['default_payment_method'] ||
            customer.metadata?.['default_payment_method']
          : null;

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      const methods = paymentMethods.data.map((pm: any) => ({
        id: pm.id,
        type: pm.type as any,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year,
            }
          : {
              brand: '',
              last4: '',
              expMonth: 0,
              expYear: 0,
            },
        sepa_debit: pm.sepa_debit
          ? {
              last4: pm.sepa_debit.last4,
              bank_code: pm.sepa_debit.bank_code || '',
            }
          : {
              last4: '',
              bank_code: '',
            },
        isDefault: defaultPaymentMethodId === pm.id,
        createdAt: new Date(pm.created * 1000),
      }));

      this.log.debug(
        { customerId, count: methods.length, defaultPaymentMethodId },
        'Payment methods retrieved'
      );

      return methods;
    } catch (error) {
      this.log.error({ error, customerId }, 'Error getting payment methods');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Ajouter une méthode de paiement
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async addPaymentMethod(
    customerId: string,
    paymentMethodId: string,
    setAsDefault: boolean = false
  ): Promise<StripePaymentMethod> {
    try {
      // Attacher la méthode de paiement au client
      const paymentMethod = await stripe.paymentMethods.attach(
        paymentMethodId,
        {
          customer: customerId,
        }
      );

      // Si c'est la première méthode ou si on demande explicitement, la définir comme défaut
      if (setAsDefault) {
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
          metadata: {
            default_payment_method: paymentMethodId,
          },
        });
        this.log.info(
          { customerId, paymentMethodId },
          'Payment method set as default'
        );
      }

      const result: StripePaymentMethod = {
        id: paymentMethod.id,
        type: paymentMethod.type as any,
        card: paymentMethod.card
          ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              expMonth: paymentMethod.card.exp_month,
              expYear: paymentMethod.card.exp_year,
            }
          : {
              brand: '',
              last4: '',
              expMonth: 0,
              expYear: 0,
            },
        isDefault: setAsDefault,
        createdAt: new Date(paymentMethod.created * 1000),
      };

      this.log.info(
        { customerId, paymentMethodId, setAsDefault },
        'Payment method added successfully'
      );

      return result;
    } catch (error) {
      this.log.error(
        { error, customerId, paymentMethodId },
        'Error adding payment method'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Définir une méthode de paiement comme défaut
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
        metadata: {
          default_payment_method: paymentMethodId,
        },
      });

      this.log.info(
        { customerId, paymentMethodId },
        'Default payment method updated'
      );
    } catch (error) {
      this.log.error(
        { error, customerId, paymentMethodId },
        'Error setting default payment method'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Supprimer une méthode de paiement
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
      this.log.info({ paymentMethodId }, 'Payment method removed successfully');
    } catch (error) {
      this.log.error(
        { error, paymentMethodId },
        'Error removing payment method'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Rembourser un paiement
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Retry({
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    shouldRetry: RetryHelpers.retryOnNetworkOrServerError,
  })
  async refundPayment(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<PaymentResult> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : 0,
        reason: reason as any,
        metadata: {
          source: 'diaspomoney',
          refunded_at: new Date().toISOString(),
        },
      });

      // Mettre à jour la transaction dans la base de données
      const transaction =
        await this.transactionRepository.findByPaymentIntentId(paymentIntentId);
      if (transaction) {
        await this.transactionRepository.updateWithMetadata(transaction.id, {
          status: 'REFUNDED',
          metadata: {
            ...transaction.metadata,
            refundId: refund.id,
            refundAmount: amount || transaction.amount,
            refundReason: reason,
          },
        });
        this.log.info(
          { transactionId: transaction.id, refundId: refund.id },
          'Transaction updated with refund information'
        );
      }

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'refunds_created',
        value: 1,
        timestamp: new Date(),
        labels: {
          reason: reason || 'requested_by_customer',
        },
        type: 'counter',
      });

      this.log.info(
        { paymentIntentId, refundId: refund.id, amount, reason },
        'Refund created successfully'
      );

      return {
        success: true,
        transactionId: refund.id,
      };
    } catch (error) {
      this.log.error(
        { error, paymentIntentId, amount, reason },
        'Error creating refund'
      );
      Sentry.captureException(error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erreur de remboursement',
      };
    }
  }

  /**
   * Gérer les webhooks Stripe
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async handleWebhook(payload: string, signature: string): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env['STRIPE_WEBHOOK_SECRET']!
      );

      this.log.info({ eventType: event.type }, 'Stripe webhook received');

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
          break;

        default:
          this.log.debug({ eventType: event.type }, 'Unhandled webhook event');
      }
    } catch (error) {
      this.log.error({ error }, 'Error handling webhook');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Gérer le succès d'un paiement
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  private async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    try {
      // Trouver la transaction par paymentIntentId
      const transaction =
        await this.transactionRepository.findByPaymentIntentId(
          paymentIntent.id
        );

      if (transaction) {
        // Mettre à jour le statut de la transaction
        await this.transactionRepository.updateWithMetadata(transaction.id, {
          status: 'COMPLETED',
          completedAt: new Date(),
          metadata: {
            ...transaction.metadata,
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: paymentIntent.latest_charge as string,
            processedAt: new Date().toISOString(),
          },
        });

        this.log.info(
          {
            transactionId: transaction.id,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
          },
          'Transaction status updated to COMPLETED'
        );
      } else {
        this.log.warn(
          { paymentIntentId: paymentIntent.id },
          'Transaction not found for payment intent'
        );
      }

      // Enregistrer les métriques de revenus
      monitoringManager.recordMetric({
        name: 'revenue_total',
        value: paymentIntent.amount / 100,
        timestamp: new Date(),
        labels: {
          currency: paymentIntent.currency,
          payment_method: 'stripe',
        },
        type: 'counter',
      });
    } catch (error) {
      this.log.error(
        { error, paymentIntentId: paymentIntent.id },
        'Error handling payment succeeded'
      );
      Sentry.captureException(error);
    }
  }

  /**
   * Gérer l'échec d'un paiement
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    try {
      // Trouver la transaction par paymentIntentId
      const transaction =
        await this.transactionRepository.findByPaymentIntentId(
          paymentIntent.id
        );

      if (transaction) {
        // Mettre à jour le statut de la transaction
        await this.transactionRepository.updateWithMetadata(transaction.id, {
          status: 'FAILED',
          failedAt: new Date(),
          failureReason:
            paymentIntent.last_payment_error?.message || 'Payment failed',
          metadata: {
            ...transaction.metadata,
            stripePaymentIntentId: paymentIntent.id,
            stripeError: paymentIntent.last_payment_error
              ? JSON.stringify(paymentIntent.last_payment_error)
              : undefined,
          },
        });

        this.log.info(
          {
            transactionId: transaction.id,
            paymentIntentId: paymentIntent.id,
            failureReason: paymentIntent.last_payment_error?.message,
          },
          'Transaction status updated to FAILED'
        );
      } else {
        this.log.warn(
          { paymentIntentId: paymentIntent.id },
          'Transaction not found for payment intent'
        );
      }
    } catch (error) {
      this.log.error(
        { error, paymentIntentId: paymentIntent.id },
        'Error handling payment failed'
      );
      Sentry.captureException(error);
    }
  }

  /**
   * Gérer une dispute
   */
  @Log({ level: 'warn', logArgs: true, logExecutionTime: true })
  private async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    try {
      // Trouver la transaction associée
      const chargeId = dispute.charge as string;
      const charge = await stripe.charges.retrieve(chargeId);
      const paymentIntentId = charge.payment_intent as string;

      const transaction =
        await this.transactionRepository.findByPaymentIntentId(paymentIntentId);

      if (transaction) {
        // Mettre en quarantaine la transaction (statut spécial)
        await this.transactionRepository.updateWithMetadata(transaction.id, {
          status: 'PENDING', // On peut créer un statut DISPUTED si nécessaire
          metadata: {
            ...transaction.metadata,
            disputeId: dispute.id,
            disputeAmount: dispute.amount / 100,
            disputeCurrency: dispute.currency,
            disputeReason: dispute.reason,
            disputeStatus: dispute.status,
            quarantined: true,
            quarantinedAt: new Date().toISOString(),
          },
        });

        this.log.warn(
          {
            transactionId: transaction.id,
            disputeId: dispute.id,
            amount: dispute.amount / 100,
            currency: dispute.currency,
            reason: dispute.reason,
          },
          'Transaction quarantined due to dispute'
        );

        // Notifier l'équipe de support
        try {
          const supportEmail = config.email.replyTo;
          await notificationService.sendNotification({
            recipient: supportEmail,
            type: 'DISPUTE_CREATED',
            template: 'dispute_created',
            data: {
              disputeId: dispute.id,
              transactionId: transaction.id,
              amount: dispute.amount / 100,
              currency: dispute.currency,
              reason: dispute.reason,
              customerId: transaction.payerId,
            },
            channels: [
              { type: 'EMAIL', enabled: true, priority: 'URGENT' },
              { type: 'IN_APP', enabled: true, priority: 'URGENT' },
            ],
            locale: 'fr',
            priority: 'URGENT',
          });
          this.log.info(
            {
              disputeId: dispute.id,
              transactionId: transaction.id,
              supportEmail,
            },
            'Support team notified of dispute'
          );
        } catch (notificationError) {
          this.log.error(
            { error: notificationError, disputeId: dispute.id },
            'Error notifying support team'
          );
          // Ne pas faire échouer le traitement de la dispute si la notification échoue
        }
      } else {
        this.log.warn(
          { paymentIntentId, disputeId: dispute.id },
          'Transaction not found for dispute'
        );
      }
    } catch (error) {
      this.log.error(
        { error, disputeId: dispute.id },
        'Error handling dispute created'
      );
      Sentry.captureException(error);
    }
  }

  /**
   * Obtenir les providers de paiement disponibles
   */
  @Log({ level: 'debug', logArgs: false, logExecutionTime: false })
  getPaymentProviders(): PaymentProvider[] {
    return [
      {
        name: 'Stripe',
        enabled: true,
        currencies: ['EUR', 'USD', 'GBP'],
        countries: ['FR', 'DE', 'ES', 'IT', 'BE', 'NL'],
        fees: { percentage: 0.014, fixed: 0.25 },
      },
      {
        name: 'PayPal',
        enabled: false, // À implémenter
        currencies: ['EUR', 'USD'],
        countries: ['FR', 'DE', 'ES', 'IT'],
        fees: { percentage: 0.034, fixed: 0.35 },
      },
      {
        name: 'Orange Money',
        enabled: false, // À implémenter
        currencies: ['XOF', 'XAF'],
        countries: ['SN', 'CI', 'CM', 'BF'],
        fees: { percentage: 0.02, fixed: 0.1 },
      },
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
