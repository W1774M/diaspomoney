/**
 * Payment Processor Template - Template Method Pattern
 * 
 * Définit le squelette de l'algorithme de traitement de paiement
 * Les sous-classes implémentent les méthodes abstraites pour chaque provider
 */

import { logger } from '@/lib/logger';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import * as Sentry from '@sentry/nextjs';

export interface PaymentData {
  amount: number;
  currency: string;
  customerId: string;
  paymentMethodId: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  paymentIntentId?: string;
  error?: string;
  requiresAction?: boolean;
  nextAction?: {
    type: string;
    url: string;
  };
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
  metadata: Record<string, string>;
}

/**
 * Classe abstraite définissant le template method pour le traitement de paiement
 */
export abstract class PaymentProcessor {
  /**
   * Template Method - Définit le squelette de l'algorithme
   * Cette méthode ne doit pas être surchargée par les sous-classes
   */
  async process(data: PaymentData): Promise<PaymentResult> {
    try {
      // Étape 1: Validation
      this.validate(data);

      // Étape 2: Préparation (hook pour les sous-classes)
      await this.beforePayment(data);

      // Étape 3: Création du paiement (méthode abstraite)
      const paymentIntent = await this.createPayment(data);

      // Étape 4: Confirmation du paiement (méthode abstraite)
      const paymentResult = await this.confirmPayment(paymentIntent, data);

      // Étape 5: Post-traitement (hook pour les sous-classes)
      await this.afterPayment(paymentIntent, paymentResult);

      // Étape 6: Enregistrement des métriques
      this.recordMetrics(data, paymentResult);

      // Étape 7: Notification (méthode commune, peut être surchargée)
      await this.sendNotification(paymentIntent, paymentResult);

      return paymentResult;
    } catch (error: any) {
      logger.error({ error, data }, `Payment processing failed in ${this.getProcessorName()}`);
      Sentry.captureException(error);
      
      return {
        success: false,
        error: error.message || 'Payment processing failed',
      };
    }
  }

  /**
   * Validation commune des données de paiement
   * Peut être surchargée pour ajouter des validations spécifiques
   */
  protected validate(data: PaymentData): void {
    if (data.amount <= 0) {
      throw new Error('Le montant doit être positif');
    }

    if (!data.currency || data.currency.length !== 3) {
      throw new Error('Devise invalide (doit être au format ISO 4217, ex: EUR, USD)');
    }

    if (!data.customerId || data.customerId.trim().length === 0) {
      throw new Error('Customer ID est requis');
    }

    if (!data.paymentMethodId || data.paymentMethodId.trim().length === 0) {
      throw new Error('Payment Method ID est requis');
    }

    logger.debug({ amount: data.amount, currency: data.currency }, 'Payment data validated');
  }

  /**
   * Hook appelé avant la création du paiement
   * Peut être surchargé pour des actions spécifiques (ex: vérification de solde)
   */
  protected async beforePayment(data: PaymentData): Promise<void> {
    logger.debug({ customerId: data.customerId }, 'Preparing payment');
    // Par défaut, aucune action
  }

  /**
   * Méthode abstraite - Créer le paiement
   * Doit être implémentée par chaque sous-classe
   */
  protected abstract createPayment(data: PaymentData): Promise<PaymentIntent>;

  /**
   * Méthode abstraite - Confirmer le paiement
   * Doit être implémentée par chaque sous-classe
   */
  protected abstract confirmPayment(
    paymentIntent: PaymentIntent,
    data: PaymentData
  ): Promise<PaymentResult>;

  /**
   * Hook appelé après la confirmation du paiement
   * Peut être surchargé pour des actions spécifiques (ex: mise à jour de solde)
   */
  protected async afterPayment(
    paymentIntent: PaymentIntent,
    result: PaymentResult,
  ): Promise<void> {
    if (result.success) {
      logger.info({
        paymentIntentId: paymentIntent.id,
        transactionId: result.transactionId,
      }, 'Payment completed successfully');
    } else {
      logger.warn({
        paymentIntentId: paymentIntent.id,
        error: result.error,
      }, 'Payment failed');
    }
  }

  /**
   * Enregistrement des métriques communes
   * Peut être surchargée pour ajouter des métriques spécifiques
   */
  protected recordMetrics(data: PaymentData, result: PaymentResult): void {
    monitoringManager.recordMetric({
      name: 'payment_processed',
      value: 1,
      timestamp: new Date(),
      labels: {
        currency: data.currency.toLowerCase(),
        success: result.success.toString(),
        processor: this.getProcessorName(),
        amount_range: this.getAmountRange(data.amount),
      },
      type: 'counter',
    });

    if (result.success) {
      monitoringManager.recordMetric({
        name: 'payment_amount',
        value: data.amount,
        timestamp: new Date(),
        labels: {
          currency: data.currency.toLowerCase(),
          processor: this.getProcessorName(),
        },
        type: 'gauge',
      });
    }
  }

  /**
   * Envoi de notification (méthode commune)
   * Peut être surchargée pour des notifications spécifiques
   */
  protected async sendNotification(
    paymentIntent: PaymentIntent,
    result: PaymentResult,
  ): Promise<void> {
    if (result.success) {
      logger.debug({
        paymentIntentId: paymentIntent.id,
        transactionId: result.transactionId,
      }, 'Payment notification sent (template method)');
      // Ici, on pourrait intégrer le NotificationService
      // mais on le laisse aux sous-classes pour plus de flexibilité
    }
  }

  /**
   * Obtenir le nom du processeur (pour logging et métriques)
   */
  protected abstract getProcessorName(): string;

  /**
   * Helper pour catégoriser les montants par range
   */
  protected getAmountRange(amount: number): string {
    if (amount < 10) return '0-10';
    if (amount < 50) return '10-50';
    if (amount < 100) return '50-100';
    if (amount < 500) return '100-500';
    if (amount < 1000) return '500-1000';
    return '1000+';
  }

  /**
   * Méthode pour obtenir les informations du provider
   */
  abstract getProviderInfo(): {
    name: string;
    enabled: boolean;
    currencies: string[];
    countries: string[];
  };
}

