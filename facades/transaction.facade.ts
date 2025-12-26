/**
 * Transaction Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus de transaction complet
 * Orchestre TransactionService, PaymentService et NotificationService
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Retry, RetryHelpers } from '@/lib/decorators/retry.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { Audit } from '@/lib/decorators/audit.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { Transaction } from '@/lib/decorators/transaction.decorator';
import { logger } from '@/lib/logger';
import { LANGUAGES, TRANSACTION_STATUSES } from '@/lib/constants';
import { notificationService } from '@/services/notification/notification.service';
import { transactionService } from '@/services/transaction/transaction.service';
import { transactionMapper } from '@/lib/mappers';
import * as Sentry from '@sentry/nextjs';
import type { TransactionFacadeData, TransactionFacadeResult, IFacade, FacadeOptions } from '@/lib/types';
import { z } from 'zod';

// Réexporter pour compatibilité
export type { TransactionFacadeData, TransactionFacadeResult };

const CreateTransactionFacadeSchema = z.object({
  payerId: z.string().min(1, 'Payer ID is required'),
  beneficiaryId: z.string().min(1, 'Beneficiary ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  type: z.string().min(1, 'Transaction type is required'),
  description: z.string().optional(),
  serviceId: z.string().optional(),
  serviceType: z.enum(['HEALTH', 'BTP', 'EDUCATION']).optional(),
  metadata: z.record(z.any()).optional(),
  status: z.string().optional(),
  sendNotification: z.boolean().optional(),
});

/**
 * TransactionFacade - Facade pour le processus de transaction complet
 */
export class TransactionFacade implements IFacade<TransactionFacadeData, TransactionFacadeResult> {
  private static instance: TransactionFacade;

  private constructor() {}

  static getInstance(): TransactionFacade {
    if (!TransactionFacade.instance) {
      TransactionFacade.instance = new TransactionFacade();
    }
    return TransactionFacade.instance;
  }

  /**
   * Exécuter la facade (implémentation de IFacade)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: CreateTransactionFacadeSchema,
        paramName: 'data',
      },
    ],
  })
  async execute(
    data: TransactionFacadeData,
    _options?: FacadeOptions,
  ): Promise<TransactionFacadeResult> {
    return this.createTransaction(data);
  }

  @Retry({
    maxAttempts: 2,
    delay: 1000,
    backoff: 'exponential',
    shouldRetry: (error: any) => {
      return (
        RetryHelpers.retryOnNetworkOrServerError(error) &&
        !error.message?.includes('non trouvé') &&
        !error.message?.includes('invalide')
      );
    },
  })
  @Audit({ eventType: 'TRANSACTION_CREATED', includeArgs: true })
  @Performance({ warningThreshold: 2000, errorThreshold: 5000 })
  @Transaction()
  async createTransaction(data: TransactionFacadeData): Promise<TransactionFacadeResult> {
    try {
      logger.info(
        {
          payerId: data.payerId,
          beneficiaryId: data.beneficiaryId,
          amount: data.amount,
          currency: data.currency,
          type: data.type,
        },
        'TransactionFacade.createTransaction called',
      );

      // Créer la transaction
      const transactionData: any = {
        payerId: data.payerId,
        beneficiaryId: data.beneficiaryId,
        amount: data.amount,
        currency: data.currency,
        type: data.type,
        status: data.status || TRANSACTION_STATUSES.PENDING,
        description: data.description || '',
        serviceId: data.serviceId || '',
        serviceType: data.serviceType,
      };
      if (data.metadata) {
        transactionData.metadata = data.metadata;
      }

      const transaction = await transactionService.createTransaction(transactionData);
      const mappedTransaction = transactionMapper.map(transaction);

      // Envoyer une notification si demandé
      let notificationSent = false;
      if (data.sendNotification !== false) {
        try {
          await notificationService.sendNotification({
            recipient: data.payerId,
            type: 'TRANSACTION_CREATED',
            template: 'transaction_created',
            data: {
              transactionId: transaction.id || transaction._id?.toString(),
              amount: data.amount,
              currency: data.currency,
              type: data.type,
            },
            channels: [
              {
                type: 'EMAIL',
                enabled: true,
                priority: 'MEDIUM',
              },
            ],
            locale: LANGUAGES.FR.code,
            priority: 'MEDIUM',
          });
          notificationSent = true;
        } catch (notificationError) {
          logger.warn(
            { error: notificationError, transactionId: transaction.id },
            'Failed to send transaction notification',
          );
        }
      }

      logger.info(
        {
          transactionId: transaction.id || transaction._id?.toString(),
          notificationSent,
        },
        'Transaction created successfully',
      );

      return {
        success: true,
        transaction: mappedTransaction,
        notificationSent,
        message: 'Transaction créée avec succès',
      };
    } catch (error: any) {
      logger.error(
        {
          error,
          payerId: data.payerId,
          beneficiaryId: data.beneficiaryId,
          amount: data.amount,
        },
        'Error in TransactionFacade.createTransaction',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'TransactionFacade',
          action: 'createTransaction',
        },
        extra: {
          payerId: data.payerId,
          beneficiaryId: data.beneficiaryId,
          amount: data.amount,
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de la création de la transaction',
        errorCode: 'TRANSACTION_CREATION_FAILED',
      };
    }
  }
}

// Instance singleton exportée
export const transactionFacade = TransactionFacade.getInstance();

