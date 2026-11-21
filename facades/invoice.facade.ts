/**
 * Invoice Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus de création de facture complet
 * Orchestre InvoiceService et Comms (via dispatchFacadeNotification)
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Retry, RetryHelpers } from '@/lib/decorators/retry.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { Audit } from '@/lib/decorators/audit.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { logger } from '@/lib/logger';
import { invoiceService, InvoiceData } from '@/services/invoice/invoice.service';
import { invoiceMapper } from '@/lib/mappers';
import { dispatchFacadeNotification } from '@/facades/_shared/dispatchNotification';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

export interface InvoiceFacadeData extends InvoiceData {
  sendEmail?: boolean; // Envoyer la facture par email
  sendNotification?: boolean; // Envoyer une notification
  recipientEmail?: string; // Email du destinataire (par défaut, email de l'utilisateur)
}

export interface InvoiceFacadeResult {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  emailSent?: boolean;
  notificationSent?: boolean;
  error?: string;
}

/**
 * InvoiceFacade - Facade pour le processus de création de facture complet
 */
export class InvoiceFacade {
  private static instance: InvoiceFacade;

  private constructor() {}

  static getInstance(): InvoiceFacade {
    if (!InvoiceFacade.instance) {
      InvoiceFacade.instance = new InvoiceFacade();
    }
    return InvoiceFacade.instance;
  }

  /**
   * Créer une facture complète avec orchestration
   *
   * Étapes :
   * 1. Créer la facture
   * 2. Envoyer la facture par email (si demandé)
   * 3. Envoyer une notification (si demandé)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z
          .object({
            userId: z.string().min(1, 'User ID is required'),
            amount: z.number().positive('Amount must be positive'),
            currency: z.string().length(3, 'Currency must be 3 characters'),
            items: z
              .array(
                z.object({
                  description: z.string().min(1),
                  quantity: z.number().positive(),
                  unitPrice: z.number().positive(),
                  total: z.number().positive(),
                }),
              )
              .min(1, 'At least one item is required'),
          })
          .passthrough(),
        paramName: 'data',
      },
    ],
  })
  @Retry({
    maxAttempts: 2,
    delay: 1000,
    backoff: 'exponential',
    shouldRetry: (error: any) => {
      // Ne retry que pour les erreurs réseau/serveur
      return (
        RetryHelpers.retryOnNetworkOrServerError(error) &&
        !error.message?.includes('incomplet') &&
        !error.message?.includes('positif')
      );
    },
  })
  @Audit({ eventType: 'INVOICE_CREATED_VIA_FACADE', includeArgs: true })
  @Performance({ warningThreshold: 2000, errorThreshold: 5000 })
  async createInvoice(data: InvoiceFacadeData): Promise<InvoiceFacadeResult> {
    try {
      logger.info(
        {
          userId: data.userId,
          amount: data.amount,
          currency: data.currency,
          sendEmail: data.sendEmail,
          sendNotification: data.sendNotification,
        },
        'Creating invoice via InvoiceFacade',
      );

      // Étape 1: Créer la facture
      const invoice = await invoiceService.createInvoice(data);

      // Mapper le résultat avec InvoiceMapper
      const mappedInvoice = invoiceMapper.map(invoice as any);

      const invoiceId = mappedInvoice.id;
      const invoiceNumber = mappedInvoice.invoiceNumber;

      let emailSent = false;
      let notificationSent = false;

      const invoicePayload = {
        invoiceNumber,
        amount: data.amount,
        currency: data.currency,
      };

      // Étape 2: Envoyer la facture par email si demandé
      if (data.sendEmail !== false && data.recipientEmail) {
        try {
          const { getUserRepository } = await import('@/repositories');
          const userRepository = getUserRepository();
          const user = await userRepository.findById(data.userId);

          if (user && user.email) {
            emailSent = await dispatchFacadeNotification({
              recipient: data.recipientEmail || user.email,
              type: 'INVOICE_CREATED',
              template: 'invoice_created',
              payload: invoicePayload,
              channels: ['EMAIL'],
              priority: 'NORMAL',
            });
          }
        } catch (emailError) {
          logger.error(
            { error: emailError, invoiceId },
            'Failed to send invoice email, continuing...',
          );
        }
      }

      // Étape 3: Envoyer une notification si demandé
      if (data.sendNotification !== false) {
        notificationSent = await dispatchFacadeNotification({
          recipient: data.userId,
          type: 'INVOICE_CREATED',
          template: 'invoice_created',
          payload: invoicePayload,
          channels: ['PUSH', 'EMAIL'],
          priority: 'NORMAL',
        });
      }

      logger.info(
        {
          invoiceId,
          invoiceNumber,
          emailSent,
          notificationSent,
        },
        'Invoice created successfully via InvoiceFacade',
      );

      return {
        success: true,
        invoiceId,
        invoiceNumber,
        emailSent,
        notificationSent,
      };
    } catch (error: any) {
      logger.error(
        {
          error,
          data: {
            userId: data.userId,
            amount: data.amount,
            currency: data.currency,
          },
        },
        'Error creating invoice via InvoiceFacade',
      );

      Sentry.captureException(error, {
        extra: {
          invoiceData: {
            userId: data.userId,
            amount: data.amount,
            currency: data.currency,
          },
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de la création de la facture',
      };
    }
  }
}

// Export de l'instance singleton
export const invoiceFacade = InvoiceFacade.getInstance();
