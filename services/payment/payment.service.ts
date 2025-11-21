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
import { LOCALE, PAYMENT_METHODS } from '@/lib/constants';
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
  StripePaymentIntent,
  StripeDispute,
  StripeRefundCreateParams,
  StripeCharge,
} from '@/lib/types';
import { TransactionStatus } from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import Stripe from 'stripe';

// Corrigé: API version Stripe correcte et gestion sécurité
// Initialisation lazy de Stripe pour éviter les erreurs pendant le build
let stripe: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!stripe) {
    const stripeSecretKey = process.env['STRIPE_SECRET_KEY'];
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key must be set in environment variables');
    }
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover', // Version stable existante
    });
  }
  return stripe;
}

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
    metadata: Record<string, string> = {},
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
      const paymentIntent = await getStripeInstance().paymentIntents.create({
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
        'Payment intent created successfully',
      );

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status as PaymentIntent['status'],
        clientSecret: paymentIntent.client_secret!,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      this.log.error(
        { error, amount, currency, customerId },
        'Error creating payment intent',
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
    paymentMethodId?: string,
  ): Promise<PaymentResult> {
    try {
      const paymentIntent = await getStripeInstance().paymentIntents.confirm(
        paymentIntentId,
        paymentMethodId ? { payment_method: paymentMethodId } : undefined,
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
          'Payment intent confirmed successfully',
        );
        return {
          success: true,
          transactionId: paymentIntent.id,
        };
      } else if (paymentIntent.status === 'requires_action') {
        this.log.info(
          { paymentIntentId, status: paymentIntent.status },
          'Payment intent requires action',
        );
        const nextAction: PaymentResult['nextAction'] = paymentIntent.next_action && paymentIntent.next_action.redirect_to_url
          ? {
              type: 'redirect_to_url',
              url: paymentIntent.next_action.redirect_to_url?.url || '',
            }
          : undefined;
        return {
          success: false,
          requiresAction: true,
          ...(nextAction !== undefined && { nextAction }),
        };
      } else {
        this.log.warn(
          { paymentIntentId, status: paymentIntent.status },
          'Payment intent failed',
        );
        return {
          success: false,
          error: `Payment failed with status: ${paymentIntent.status}`,
        };
      }
    } catch (error) {
      this.log.error(
        { error, paymentIntentId, paymentMethodId },
        'Error confirming payment intent',
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
      const customer = await getStripeInstance().customers.retrieve(customerId);
      const defaultPaymentMethodId =
        typeof customer === 'object' && !('deleted' in customer && customer.deleted)
          ? (customer.invoice_settings?.default_payment_method as string) ||
            (customer.metadata?.['default_payment_method'] as string)
          : null;

      const paymentMethods = await getStripeInstance().paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      const methods: StripePaymentMethod[] = paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type as StripePaymentMethod['type'],
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
        createdAt: new Date((pm.created ?? Date.now()) * 1000),
      }));

      this.log.debug(
        { customerId, count: methods.length, defaultPaymentMethodId },
        'Payment methods retrieved',
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
    setAsDefault: boolean = false,
  ): Promise<StripePaymentMethod> {
    try {
      // Attacher la méthode de paiement au client
      const paymentMethod = await getStripeInstance().paymentMethods.attach(
        paymentMethodId,
        {
          customer: customerId,
        },
      );

      // Définir comme défaut si demandé
      if (setAsDefault) {
        await getStripeInstance().customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
          metadata: {
            default_payment_method: paymentMethodId,
          },
        });
        this.log.info(
          { customerId, paymentMethodId },
          'Payment method set as default',
        );
      }

      const result: StripePaymentMethod = {
        id: paymentMethod.id,
        type: paymentMethod.type as StripePaymentMethod['type'],
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
      };

      this.log.info(
        { customerId, paymentMethodId, setAsDefault },
        'Payment method added successfully',
      );

      return result;
    } catch (error) {
      this.log.error(
        { error, customerId, paymentMethodId },
        'Error adding payment method',
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
    paymentMethodId: string,
  ): Promise<void> {
    try {
      await getStripeInstance().customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
        metadata: {
          default_payment_method: paymentMethodId,
        },
      });

      this.log.info(
        { customerId, paymentMethodId },
        'Default payment method updated',
      );
    } catch (error) {
      this.log.error(
        { error, customerId, paymentMethodId },
        'Error setting default payment method',
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
      await getStripeInstance().paymentMethods.detach(paymentMethodId);
      this.log.info({ paymentMethodId }, 'Payment method removed successfully');
    } catch (error) {
      this.log.error(
        { error, paymentMethodId },
        'Error removing payment method',
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
    reason?: string,
  ): Promise<PaymentResult> {
    try {
      const refundPayload: StripeRefundCreateParams = {
        payment_intent: paymentIntentId,
        metadata: {
          source: 'diaspomoney',
          refunded_at: new Date().toISOString(),
        },
      };
      if (typeof amount === 'number' && amount > 0) {
        refundPayload.amount = Math.round(amount * 100);
      }
      if (reason) {
        refundPayload.reason = reason as NonNullable<StripeRefundCreateParams['reason']>;
      }

      const refund = await getStripeInstance().refunds.create(refundPayload);

      // Mettre à jour la transaction dans la base de données
      const transaction =
        await this.transactionRepository.findByPaymentIntentId(paymentIntentId);
      if (transaction) {
        await this.transactionRepository.updateWithMetadata(transaction.id, {
          status: TransactionStatus.REFUNDED,
          metadata: {
            ...transaction.metadata,
            refundId: refund.id,
            refundAmount: amount || transaction.amount,
            refundReason: reason,
          },
        });
        this.log.info(
          { transactionId: transaction.id, refundId: refund.id },
          'Transaction updated with refund information',
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
        'Refund created successfully',
      );

      return {
        success: true,
        transactionId: refund.id,
      };
    } catch (error) {
      this.log.error(
        { error, paymentIntentId, amount, reason },
        'Error creating refund',
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
      const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }
      const event = getStripeInstance().webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      this.log.info({ eventType: event.type }, 'Stripe webhook received');

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(
            event.data.object as StripePaymentIntent,
          );
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(
            event.data.object as StripePaymentIntent,
          );
          break;

        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object as StripeDispute);
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
    paymentIntent: StripePaymentIntent,
  ): Promise<void> {
    try {
      // Trouver la transaction par paymentIntentId
      const transaction =
        await this.transactionRepository.findByPaymentIntentId(
          paymentIntent.id,
        );

      if (transaction) {
        // Mettre à jour le statut de la transaction
        await this.transactionRepository.updateWithMetadata(transaction.id, {
          status: TransactionStatus.COMPLETED,
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
          'Transaction status updated to COMPLETED',
        );
      } else {
        this.log.warn(
          { paymentIntentId: paymentIntent.id },
          'Transaction not found for payment intent',
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
        'Error handling payment succeeded',
      );
      Sentry.captureException(error);
    }
  }

  /**
   * Gérer l'échec d'un paiement
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  private async handlePaymentFailed(
    paymentIntent: StripePaymentIntent,
  ): Promise<void> {
    try {
      // Trouver la transaction par paymentIntentId
      const transaction =
        await this.transactionRepository.findByPaymentIntentId(
          paymentIntent.id,
        );

      if (transaction) {
        // Mettre à jour le statut de la transaction
        await this.transactionRepository.updateWithMetadata(transaction.id, {
          status: TransactionStatus.FAILED,
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
          'Transaction status updated to FAILED',
        );
      } else {
        this.log.warn(
          { paymentIntentId: paymentIntent.id },
          'Transaction not found for payment intent',
        );
      }
    } catch (error) {
      this.log.error(
        { error, paymentIntentId: paymentIntent.id },
        'Error handling payment failed',
      );
      Sentry.captureException(error);
    }
  }

  /**
   * Gérer une dispute
   */
  @Log({ level: 'warn', logArgs: true, logExecutionTime: true })
  private async handleDisputeCreated(dispute: StripeDispute): Promise<void> {
    try {
      // Trouver la transaction associée
      const chargeId = dispute.charge as string;
      const charge = (await getStripeInstance().charges.retrieve(chargeId)) as StripeCharge;
      // PaymentIntent peut être null (edge case); gestion de fallback
      const paymentIntentId = typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : undefined;

      if (!paymentIntentId) {
        this.log.warn(
          { chargeId, disputeId: dispute.id },
          'PaymentIntent not found on charge for dispute',
        );
        return;
      }

      const transaction =
        await this.transactionRepository.findByPaymentIntentId(paymentIntentId);

      if (transaction) {
        // Mettre en quarantaine la transaction (statut spécial)
        await this.transactionRepository.updateWithMetadata(transaction.id, {
          status: TransactionStatus.PENDING, // Peut créer un statut DISPUTED si nécessaire
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
          'Transaction quarantined due to dispute',
        );

        // Notifier l'équipe de support
        try {
          const supportEmail = config.email?.replyTo;
          if (supportEmail) {
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
              locale: LOCALE.DEFAULT,
              priority: 'URGENT',
            });
            this.log.info(
              {
                disputeId: dispute.id,
                transactionId: transaction.id,
                supportEmail,
              },
              'Support team notified of dispute',
            );
          } else {
            this.log.warn(
              { disputeId: dispute.id },
              'Support email not configured, cannot notify support',
            );
          }
        } catch (notificationError) {
          this.log.error(
            { error: notificationError, disputeId: dispute.id },
            'Error notifying support team',
          );
          // Ne pas faire échouer le traitement de la dispute si la notification échoue
        }
      } else {
        this.log.warn(
          { paymentIntentId, disputeId: dispute.id },
          'Transaction not found for dispute',
        );
      }
    } catch (error) {
      this.log.error(
        { error, disputeId: dispute.id },
        'Error handling dispute created',
      );
      Sentry.captureException(error);
    }
  }

  /**
   * Obtenir les providers de paiement disponibles
   */
  @Log({ level: 'debug', logArgs: false, logExecutionTime: false })
  getPaymentProviders(): PaymentProvider[] {
    return [PAYMENT_METHODS.STRIPE, PAYMENT_METHODS.PAYPAL, PAYMENT_METHODS.MOBILE_MONEY] as PaymentProvider[];
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
