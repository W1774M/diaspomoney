/**
 * Payment Service - DiaspoMoney (Version avec Strategy Pattern)
 * 
 * Service refactoré utilisant le Strategy Pattern pour gérer différents providers de paiement
 */

import { paymentEvents } from '@/lib/events';
import {
  PaymentProvider,
  PaymentStrategyFactory,
  type IPaymentStrategy,
  type PaymentData,
  type PaymentResult,
  type RefundData,
  type RefundResult,
} from '@/strategies/payment';
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
      this.currentStrategy = PaymentStrategyFactory.getStrategy(this.defaultProvider);
    }
    return this.currentStrategy;
  }

  /**
   * Obtenir automatiquement la meilleure stratégie pour un paiement
   */
  private getBestStrategy(currency: string, country?: string): IPaymentStrategy {
    const bestStrategy = PaymentStrategyFactory.getBestStrategy(currency, country);
    if (!bestStrategy) {
      // Fallback sur la stratégie par défaut
      return this.getStrategy();
    }
    return bestStrategy;
  }

  /**
   * Créer un Payment Intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    metadata: Record<string, string> = {},
    provider?: PaymentProvider
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
        ? PaymentStrategyFactory.getStrategy(provider)
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
        throw new Error(result.error || 'Erreur lors de la création du Payment Intent');
      }

      // Émettre l'événement de création de Payment Intent
      if (result.success) {
        paymentEvents.emitPaymentCreated({
          paymentIntentId: result.paymentIntentId || result.transactionId || '',
          amount,
          currency,
          userId: customerId,
          provider: provider || this.defaultProvider,
          timestamp: new Date(),
        }).catch(error => {
          console.error('[PaymentService] Error emitting payment created event:', error);
        });
      }

      // Mapper le résultat vers PaymentIntent
      return {
        id: result.paymentIntentId || result.transactionId || '',
        amount,
        currency,
        status: this.mapStatus(result),
        clientSecret: result.clientSecret || '',
        metadata: result.metadata || {},
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
    paymentMethodId?: string,
    provider?: PaymentProvider
  ): Promise<PaymentResult> {
    try {
      const strategy = provider
        ? PaymentStrategyFactory.getStrategy(provider)
        : this.getStrategy();

      const result = await strategy.confirmPaymentIntent(paymentIntentId, paymentMethodId);

      // Émettre les événements selon le résultat
      if (result.success) {
        paymentEvents.emitPaymentSucceeded({
          transactionId: result.transactionId || paymentIntentId,
          amount: result.metadata?.['amount'] || 0,
          currency: result.metadata?.['currency'] || 'EUR',
          userId: result.metadata?.['userId'] || 'unknown',
          provider: provider || this.defaultProvider,
          timestamp: new Date(),
        }).catch(error => {
          console.error('[PaymentService] Error emitting payment succeeded event:', error);
        });
      } else {
        paymentEvents.emitPaymentFailed(
          result.transactionId || paymentIntentId,
          result.error || 'Payment confirmation failed'
        ).catch(error => {
          console.error('[PaymentService] Error emitting payment failed event:', error);
        });
      }

      return result;
    } catch (error) {
      console.error('Erreur confirmPaymentIntent:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Traiter un paiement
   */
  async processPayment(
    amount: number,
    currency: string,
    customerId: string,
    paymentMethodId: string,
    metadata: Record<string, string> = {},
    provider?: PaymentProvider
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
        ? PaymentStrategyFactory.getStrategy(provider)
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
        paymentEvents.emitPaymentSucceeded({
          transactionId: result.transactionId || '',
          amount,
          currency,
          userId: customerId,
          provider: provider || this.defaultProvider,
          timestamp: new Date(),
        }).catch(error => {
          console.error('[PaymentService] Error emitting payment succeeded event:', error);
        });
      } else {
        paymentEvents.emitPaymentFailed(
          result.transactionId || 'unknown',
          result.error || 'Payment processing failed'
        ).catch(error => {
          console.error('[PaymentService] Error emitting payment failed event:', error);
        });
      }

      return result;
    } catch (error: any) {
      console.error('Erreur processPayment:', error);
      Sentry.captureException(error);

      // Émettre l'événement d'erreur
      paymentEvents.emitPaymentFailed(
        'unknown',
        error.message || 'Erreur lors du traitement du paiement'
      ).catch(err => {
        console.error('[PaymentService] Error emitting payment failed event:', err);
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
  async refund(
    transactionId: string,
    amount?: number,
    reason?: string,
    provider?: PaymentProvider
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
        paymentEvents.emitPaymentRefunded(
          transactionId,
          result.amount || amount || 0
        ).catch(error => {
          console.error('[PaymentService] Error emitting payment refunded event:', error);
        });
      }

      return result;
    } catch (error: any) {
      console.error('Erreur refund:', error);
      Sentry.captureException(error);

      return {
        success: false,
        error: error.message || 'Erreur lors du remboursement',
      };
    }
  }

  /**
   * Vérifier le statut d'une transaction
   */
  async getTransactionStatus(
    transactionId: string,
    provider?: PaymentProvider
  ): Promise<PaymentResult> {
    try {
      const strategy = provider
        ? PaymentStrategyFactory.getStrategy(provider)
        : this.getStrategy();

      return await strategy.getTransactionStatus(transactionId);
    } catch (error: any) {
      console.error('Erreur getTransactionStatus:', error);
      Sentry.captureException(error);

      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération du statut',
      };
    }
  }

  /**
   * Obtenir les providers disponibles
   */
  getAvailableProviders(): PaymentProvider[] {
    return ['STRIPE', 'PAYPAL'];
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

