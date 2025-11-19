/**
 * Payment Service - DiaspoMoney (Version avec Strategy Pattern)
 *
 * Service refactoré utilisant le Strategy Pattern pour gérer différents providers de paiement
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Strategy Pattern
 * - Dependency Injection
 * - Singleton Pattern
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Observer Pattern (EventBus)
 * - Error Handling Pattern (Sentry)
 */

import { Cacheable } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { paymentEvents } from '@/lib/events';
import { childLogger } from '@/lib/logger';
import type {
  IPaymentStrategy,
  PaymentData,
  PaymentProvider,
  PaymentResult,
  RefundData,
  RefundResult,
} from '@/strategies/payment';
import { PaymentStrategyFactory } from '@/strategies/payment';
import * as Sentry from '@sentry/nextjs';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status:
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'succeeded'
    | 'canceled';
  clientSecret: string;
  paymentMethod?: string;
  metadata: Record<string, string>;
}

/**
 * PaymentService utilisant le Strategy Pattern
 */
export class PaymentService {
  private static instance: PaymentService;
  private currentStrategy: IPaymentStrategy | null = null;
  private defaultProvider: PaymentProvider = 'STRIPE';
  private readonly log = childLogger({
    component: 'PaymentService',
  });

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Définir le provider de paiement à utiliser
   */
  setProvider(provider: PaymentProvider): void {
    this.currentStrategy = PaymentStrategyFactory.getStrategy(provider);
    this.defaultProvider = provider;
  }

  /**
   * Obtenir la stratégie actuelle ou la stratégie par défaut
   */
  private getStrategy(): IPaymentStrategy {
    if (!this.currentStrategy) {
      this.currentStrategy = PaymentStrategyFactory.getStrategy(
        this.defaultProvider,
      );
    }
    return this.currentStrategy;
  }

  /**
   * Obtenir automatiquement la meilleure stratégie pour un paiement
   */
  private getBestStrategy(
    currency: string,
    country?: string,
  ): IPaymentStrategy {
    const bestStrategy = PaymentStrategyFactory.getBestStrategy(
      currency,
      country,
    );
    if (!bestStrategy) {
      // Fallback sur la stratégie par défaut
      return this.getStrategy();
    }
    return bestStrategy;
  }

  /**
   * Créer un Payment Intent
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    metadata: Record<string, string> = {},
    provider?: string,
  ): Promise<PaymentIntent> {
    try {
      // Validation des paramètres
      if (amount <= 0) {
        throw new Error('Le montant doit être positif');
      }

      if (!currency || currency.length !== 3) {
        throw new Error('Devise invalide');
      }

      // Sélectionner la stratégie
      const strategy = provider
        ? PaymentStrategyFactory.getStrategy(provider as PaymentProvider)
        : this.getBestStrategy(currency);

      // Préparer les données de paiement
      const paymentData: PaymentData = {
        amount,
        currency,
        customerId,
        metadata,
      };

      // Créer le Payment Intent
      const result = await strategy.createPaymentIntent(paymentData);

      if (!result.success) {
        throw new Error(
          result.error || 'Erreur lors de la création du Payment Intent',
        );
      }

      // Émettre l'événement de création de Payment Intent
      if (result.success) {
        paymentEvents
          .emitPaymentCreated({
            paymentIntentId:
              result.paymentIntentId || result.transactionId || '',
            amount,
            currency,
            userId: customerId,
            provider: provider || this.defaultProvider,
            timestamp: new Date(),
          })
          .catch(error => {
            this.log.error({ error }, 'Error emitting payment created event');
          });
      }

      // Mapper le résultat vers PaymentIntent
      const paymentIntent = {
        id: result.paymentIntentId || result.transactionId || '',
        amount,
        currency,
        status: this.mapStatus(result),
        clientSecret: result.clientSecret || '',
        metadata: result.metadata || {},
      };
      this.log.info(
        {
          paymentIntentId: paymentIntent.id,
          amount,
          currency,
          provider: provider || this.defaultProvider,
        },
        'Payment intent created successfully',
      );
      return paymentIntent;
    } catch (error) {
      this.log.error(
        { error, amount, currency, customerId },
        'Error in createPaymentIntent',
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'PaymentService', action: 'createPaymentIntent' },
        extra: { amount, currency, provider: provider || this.defaultProvider },
      });
      throw error;
    }
  }

  /**
   * Confirmer un Payment Intent
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
    provider?: PaymentProvider,
  ): Promise<PaymentResult> {
    try {
      const strategy = provider
        ? PaymentStrategyFactory.getStrategy(provider)
        : this.getStrategy();

      const result = await strategy.confirmPaymentIntent(
        paymentIntentId,
        paymentMethodId,
      );

      // Émettre les événements selon le résultat
      if (result.success) {
        paymentEvents
          .emitPaymentSucceeded({
            transactionId: result.transactionId || paymentIntentId,
            amount: result.metadata?.['amount'] || 0,
            currency: result.metadata?.['currency'] || 'EUR',
            userId: result.metadata?.['userId'] || 'unknown',
            provider: provider || this.defaultProvider,
            timestamp: new Date(),
          })
          .catch(error => {
            this.log.error({ error }, 'Error emitting payment succeeded event');
          });
      } else {
        paymentEvents
          .emitPaymentFailed(
            result.transactionId || paymentIntentId,
            result.error || 'Payment confirmation failed',
          )
          .catch(error => {
            this.log.error({ error }, 'Error emitting payment failed event');
          });
      }

      this.log.info(
        {
          paymentIntentId,
          success: result.success,
          provider: provider || this.defaultProvider,
        },
        'Payment intent confirmed',
      );
      return result;
    } catch (error) {
      this.log.error(
        { error, paymentIntentId },
        'Error in confirmPaymentIntent',
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'PaymentService', action: 'confirmPaymentIntent' },
        extra: { paymentIntentId, provider: provider || this.defaultProvider },
      });
      throw error;
    }
  }

  /**
   * Traiter un paiement
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async processPayment(
    amount: number,
    currency: string,
    customerId: string,
    paymentMethodId: string,
    metadata: Record<string, string> = {},
    provider?: PaymentProvider,
  ): Promise<PaymentResult> {
    try {
      // Validation
      if (amount <= 0) {
        return {
          success: false,
          error: 'Le montant doit être positif',
        };
      }

      // Sélectionner la stratégie
      const strategy = provider
        ? PaymentStrategyFactory.getStrategy(provider as PaymentProvider)
        : this.getBestStrategy(currency);

      // Préparer les données
      const paymentData: PaymentData = {
        amount,
        currency,
        customerId,
        paymentMethodId,
        metadata,
      };

      // Traiter le paiement
      const result = await strategy.processPayment(paymentData);

      // Émettre les événements selon le résultat
      if (result.success) {
        paymentEvents
          .emitPaymentSucceeded({
            transactionId: result.transactionId || '',
            amount,
            currency,
            userId: customerId,
            provider: provider || this.defaultProvider,
            timestamp: new Date(),
          })
          .catch(error => {
            this.log.error({ error }, 'Error emitting payment succeeded event');
          });
      } else {
        paymentEvents
          .emitPaymentFailed(
            result.transactionId || 'unknown',
            result.error || 'Payment processing failed',
          )
          .catch(error => {
            this.log.error({ error }, 'Error emitting payment failed event');
          });
      }

      this.log.info(
        {
          transactionId: result.transactionId,
          success: result.success,
          amount,
          currency,
          provider: provider || this.defaultProvider,
        },
        'Payment processed',
      );
      return result;
    } catch (error: any) {
      this.log.error(
        { error, amount, currency, customerId },
        'Error in processPayment',
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'PaymentService', action: 'processPayment' },
        extra: { amount, currency, provider: provider || this.defaultProvider },
      });

      // Émettre l'événement d'erreur
      paymentEvents
        .emitPaymentFailed(
          'unknown',
          error.message || 'Erreur lors du traitement du paiement',
        )
        .catch(err => {
          this.log.error({ error: err }, 'Error emitting payment failed event');
        });

      return {
        success: false,
        error: error.message || 'Erreur lors du traitement du paiement',
      };
    }
  }

  /**
   * Rembourser une transaction
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async refund(
    transactionId: string,
    amount?: number,
    reason?: string,
    provider?: PaymentProvider,
  ): Promise<RefundResult> {
    try {
      const strategy = provider
        ? PaymentStrategyFactory.getStrategy(provider)
        : this.getStrategy();

      const refundData: RefundData = {
        transactionId,
        amount: amount || 0,
        reason: reason || '',
      };

      const result = await strategy.refund(refundData);

      // Émettre l'événement de remboursement
      if (result.success) {
        paymentEvents
          .emitPaymentRefunded(transactionId, result.amount || amount || 0)
          .catch(error => {
            this.log.error({ error }, 'Error emitting payment refunded event');
          });
        this.log.info(
          {
            transactionId,
            amount: result.amount || amount,
            provider: provider || this.defaultProvider,
          },
          'Payment refunded successfully',
        );
      }

      return result;
    } catch (error: any) {
      this.log.error({ error, transactionId, amount }, 'Error in refund');
      Sentry.captureException(error as Error, {
        tags: { component: 'PaymentService', action: 'refund' },
        extra: { transactionId, provider: provider || this.defaultProvider },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors du remboursement',
      };
    }
  }

  /**
   * Vérifier le statut d'une transaction
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(60, { prefix: 'PaymentService:getTransactionStatus' }) // Cache 1 minute
  async getTransactionStatus(
    transactionId: string,
    provider?: PaymentProvider,
  ): Promise<PaymentResult> {
    try {
      const strategy = provider
        ? PaymentStrategyFactory.getStrategy(provider)
        : this.getStrategy();

      const result = await strategy.getTransactionStatus(transactionId);
      this.log.debug(
        {
          transactionId,
          success: result.success,
          provider: provider || this.defaultProvider,
        },
        'Transaction status retrieved',
      );
      return result;
    } catch (error: any) {
      this.log.error({ error, transactionId }, 'Error in getTransactionStatus');
      Sentry.captureException(error as Error, {
        tags: { component: 'PaymentService', action: 'getTransactionStatus' },
        extra: { transactionId, provider: provider || this.defaultProvider },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération du statut',
      };
    }
  }

  /**
   * Obtenir les providers disponibles
   */
  @Log({ level: 'debug', logArgs: false, logExecutionTime: false })
  @Cacheable(3600, { prefix: 'PaymentService:getAvailableProviders' }) // Cache 1 heure (rarement changé)
  getAvailableProviders(): PaymentProvider[] {
    const providers: PaymentProvider[] = ['STRIPE', 'PAYPAL'];
    this.log.debug({ providers }, 'Available providers retrieved');
    return providers;
  }

  /**
   * Mapper le statut du résultat vers le format PaymentIntent
   */
  private mapStatus(result: PaymentResult): PaymentIntent['status'] {
    if (result.success) {
      return 'succeeded';
    }
    if (result.requiresAction) {
      return 'requires_action';
    }
    return 'canceled';
  }
}

// Export singleton
export const paymentService = PaymentService.getInstance();
