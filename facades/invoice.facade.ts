/**
 * Invoice Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus de création de facture complet
 * Orchestre InvoiceService, EmailService et NotificationService
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Retry, RetryHelpers } from '@/lib/decorators/retry.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { logger } from '@/lib/logger';
import { LANGUAGES, CURRENCIES } from '@/lib/constants';
import { emailService } from '@/services/email/email.service';
import { invoiceService, InvoiceData } from '@/services/invoice/invoice.service';
import { notificationService } from '@/services/notification/notification.service';
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

      const invoiceId = invoice.id || (invoice as any)._id?.toString() || '';
      const invoiceNumber = invoice.invoiceNumber || '';

      let emailSent = false;
      let notificationSent = false;

      // Étape 2: Envoyer la facture par email si demandé
      if (data.sendEmail !== false && data.recipientEmail) {
        try {
          // Récupérer les informations utilisateur pour l'email
          const { getUserRepository } = await import('@/repositories');
          const userRepository = getUserRepository();
          const user = await userRepository.findById(data.userId);

          if (user && user.email) {
            const emailResult = await emailService.sendCustomEmail(
              data.recipientEmail || user.email,
              `Facture ${invoiceNumber}`,
              this.generateInvoiceEmailHTML(invoice, invoiceNumber),
              this.generateInvoiceEmailText(invoice, invoiceNumber),
            );

            emailSent = emailResult;
          }
        } catch (emailError) {
          // Ne pas faire échouer la création de facture si l'email échoue
          logger.error(
            { error: emailError, invoiceId },
            'Failed to send invoice email, continuing...',
          );
        }
      }

      // Étape 3: Envoyer une notification si demandé
      if (data.sendNotification !== false) {
        try {
          await notificationService.sendNotification({
            recipient: data.userId,
            type: 'INVOICE_CREATED',
            template: 'invoice_created',
            data: {
              invoiceNumber,
              amount: data.amount,
              currency: data.currency,
            },
            channels: [
              { type: 'IN_APP', enabled: true, priority: 'MEDIUM' },
              { type: 'EMAIL', enabled: true, priority: 'LOW' },
            ],
            locale: LANGUAGES.FR.code,
            priority: 'MEDIUM',
          });

          notificationSent = true;
        } catch (notificationError) {
          // Ne pas faire échouer la création de facture si la notification échoue
          logger.error(
            { error: notificationError, invoiceId },
            'Failed to send notification, continuing...',
          );
        }
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

  /**
   * Générer le HTML de l'email de facture
   */
  private generateInvoiceEmailHTML(
    invoice: any,
    invoiceNumber: string,
  ): string {
    const total = invoice.totalAmount || invoice.amount || 0;
    const currency = invoice.currency || CURRENCIES.EUR.code;

    return `
      <html>
        <body>
          <h2>Facture ${invoiceNumber}</h2>
          <p>Bonjour,</p>
          <p>Votre facture a été générée avec succès.</p>
          <p><strong>Montant total :</strong> ${total} ${currency}</p>
          <p>Vous pouvez télécharger votre facture depuis votre espace client.</p>
          <p>Cordialement,<br>L'équipe DiaspoMoney</p>
        </body>
      </html>
    `;
  }

  /**
   * Générer le texte de l'email de facture
   */
  private generateInvoiceEmailText(
    invoice: any,
    invoiceNumber: string,
  ): string {
    const total = invoice.totalAmount || invoice.amount || 0;
    const currency = invoice.currency || CURRENCIES.EUR.code;

    return `
      Facture ${invoiceNumber}
      
      Bonjour,
      
      Votre facture a été générée avec succès.
      
      Montant total : ${total} ${currency}
      
      Vous pouvez télécharger votre facture depuis votre espace client.
      
      Cordialement,
      L'équipe DiaspoMoney
    `;
  }
}

// Export de l'instance singleton
export const invoiceFacade = InvoiceFacade.getInstance();

