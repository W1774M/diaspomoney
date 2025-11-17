/**
 * Payment Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus de paiement complet
 * Orchestre PaymentService, TransactionService, InvoiceService et NotificationService
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Retry, RetryHelpers } from '@/lib/decorators/retry.decorator';
import {
  Validate,
  createValidationRule,
} from '@/lib/decorators/validate.decorator';
import { logger } from '@/lib/logger';
import { invoiceService } from '@/services/invoice/invoice.service';
import { notificationService } from '@/services/notification/notification.service';
import { PaymentService } from '@/services/payment/payment.service';
import { transactionService } from '@/services/transaction/transaction.service';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

export interface PaymentFacadeData {
  amount: number;
  currency: string;
  customerId: string;
  paymentMethodId: string;
  payerId: string;
  beneficiaryId: string;
  serviceType: 'HEALTH' | 'BTP' | 'EDUCATION';
  serviceId: string;
  description: string;
  metadata?: Record<string, string>;
  createInvoice?: boolean; // Créer une facture automatiquement
  sendNotification?: boolean; // Envoyer une notification automatiquement
}

export interface PaymentFacadeResult {
  success: boolean;
  paymentIntentId?: string;
  transactionId?: string;
  invoiceId?: string;
  error?: string;
  requiresAction?: boolean;
  nextAction?: {
    type: string;
    url: string;
  };
}

/**
 * PaymentFacade - Facade pour le processus de paiement complet
 */
export class PaymentFacade {
  private static instance: PaymentFacade;
  private paymentService: PaymentService;

  private constructor() {
    this.paymentService = PaymentService.getInstance();
  }

  static getInstance(): PaymentFacade {
    if (!PaymentFacade.instance) {
      PaymentFacade.instance = new PaymentFacade();
    }
    return PaymentFacade.instance;
  }

  /**
   * Traiter un paiement complet avec orchestration
   *
   * Étapes :
   * 1. Créer le PaymentIntent
   * 2. Confirmer le paiement
   * 3. Créer la transaction
   * 4. Créer la facture (si demandé)
   * 5. Envoyer les notifications (si demandé)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      createValidationRule(
        0,
        z
          .object({
            amount: z.number().positive('Amount must be positive'),
            currency: z.string().length(3, 'Currency must be 3 characters'),
            customerId: z.string().min(1, 'Customer ID is required'),
            paymentMethodId: z.string().min(1, 'Payment method ID is required'),
            payerId: z.string().min(1, 'Payer ID is required'),
            beneficiaryId: z.string().min(1, 'Beneficiary ID is required'),
            serviceType: z.enum(['HEALTH', 'BTP', 'EDUCATION']),
            serviceId: z.string().min(1, 'Service ID is required'),
            description: z.string().min(1, 'Description is required'),
          })
          .passthrough(),
        'data',
      ),
    ],
  })
  @Retry({
    maxAttempts: 2,
    delay: 1000,
    backoff: 'exponential',
    shouldRetry: (error: any) => {
      // Ne retry que pour les erreurs réseau/serveur, pas pour les erreurs de validation
      return (
        RetryHelpers.retryOnNetworkOrServerError(error) &&
        !error.message?.includes('non trouvé') &&
        !error.message?.includes('invalide')
      );
    },
  })
  async processPayment(data: PaymentFacadeData): Promise<PaymentFacadeResult> {
    try {
      logger.info(
        {
          amount: data.amount,
          currency: data.currency,
          customerId: data.customerId,
          serviceType: data.serviceType,
        },
        'Processing payment via PaymentFacade',
      );

      // Étape 1: Créer le PaymentIntent
      const paymentIntent = await this.paymentService.createPaymentIntent(
        data.amount,
        data.currency,
        data.customerId,
        {
          ...data.metadata,
          payerId: data.payerId,
          beneficiaryId: data.beneficiaryId,
          serviceType: data.serviceType,
          serviceId: data.serviceId,
        },
      );

      // Étape 2: Confirmer le paiement
      const paymentResult = await this.paymentService.confirmPaymentIntent(
        paymentIntent.id,
        data.paymentMethodId,
      );

      if (!paymentResult.success) {
        // Si le paiement nécessite une action (3D Secure, etc.)
        if (paymentResult.requiresAction) {
          const result: PaymentFacadeResult = {
            success: false,
            requiresAction: true,
          };

          if (paymentResult.error) {
            result.error = paymentResult.error;
          }

          if (paymentResult.nextAction && paymentResult.nextAction.url) {
            result.nextAction = {
              type: paymentResult.nextAction.type,
              url: paymentResult.nextAction.url,
            };
          }

          return result;
        }

        // Paiement échoué
        return {
          success: false,
          error: paymentResult.error || 'Payment confirmation failed',
        };
      }

      // Étape 3: Créer la transaction
      const transaction = await transactionService.createTransaction({
        payerId: data.payerId,
        beneficiaryId: data.beneficiaryId,
        amount: data.amount,
        currency: data.currency,
        serviceType: data.serviceType,
        serviceId: data.serviceId,
        description: data.description,
        metadata: {
          ...(data.metadata || {}),
          paymentIntentId: paymentIntent.id,
        },
      });

      const transactionId =
        transaction.id || (transaction as any)._id?.toString() || '';

      let invoiceId: string | undefined;

      // Étape 4: Créer la facture si demandé
      if (data.createInvoice !== false) {
        try {
          const invoice = await invoiceService.createInvoice({
            userId: data.payerId,
            transactionId: transactionId,
            amount: data.amount,
            currency: data.currency,
            items: [
              {
                description: data.description,
                quantity: 1,
                unitPrice: data.amount,
                total: data.amount,
              },
            ],
            dueDate: new Date(),
            metadata: {
              ...(data.metadata || {}),
              paymentIntentId: paymentIntent.id,
              transactionId: transactionId,
            },
          });
          invoiceId = invoice.id || (invoice as any)._id?.toString();
        } catch (invoiceError) {
          // Ne pas faire échouer le paiement si la facture échoue
          logger.error(
            { error: invoiceError },
            'Failed to create invoice, continuing...',
          );
        }
      }

      // Étape 5: Envoyer les notifications si demandé
      if (data.sendNotification !== false) {
        try {
          // Récupérer l'email de l'utilisateur pour la notification
          const userEmail = data.customerId; // À adapter selon votre logique
          await notificationService.sendPaymentSuccessNotification(
            userEmail,
            data.amount,
            data.currency,
            data.description,
            'fr',
          );
        } catch (notificationError) {
          // Ne pas faire échouer le paiement si la notification échoue
          logger.error(
            { error: notificationError },
            'Failed to send notification, continuing...',
          );
        }
      }

      logger.info(
        {
          paymentIntentId: paymentIntent.id,
          transactionId,
          invoiceId,
        },
        'Payment processed successfully via PaymentFacade',
      );

      const result: PaymentFacadeResult = {
        success: true,
        paymentIntentId: paymentIntent.id,
        transactionId,
      };

      if (invoiceId) {
        result.invoiceId = invoiceId;
      }

      return result;
    } catch (error: any) {
      logger.error(
        {
          error,
          data: {
            amount: data.amount,
            currency: data.currency,
            customerId: data.customerId,
          },
        },
        'Error processing payment via PaymentFacade',
      );

      Sentry.captureException(error, {
        extra: {
          paymentData: {
            amount: data.amount,
            currency: data.currency,
            customerId: data.customerId,
            serviceType: data.serviceType,
          },
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors du traitement du paiement',
      };
    }
  }

  /**
   * Traiter un paiement simple (sans facture ni notification)
   */
  async processSimplePayment(
    amount: number,
    currency: string,
    customerId: string,
    paymentMethodId: string,
    metadata?: Record<string, string>,
  ): Promise<PaymentFacadeResult> {
    return this.processPayment({
      amount,
      currency,
      customerId,
      paymentMethodId,
      payerId: customerId, // Par défaut, le customer est le payer
      beneficiaryId: customerId, // À adapter selon votre logique métier
      serviceType: 'HEALTH', // Par défaut
      serviceId: 'default',
      description: `Payment of ${amount} ${currency}`,
      metadata: metadata || {},
      createInvoice: false,
      sendNotification: false,
    });
  }
}

// Export de l'instance singleton
export const paymentFacade = PaymentFacade.getInstance();
