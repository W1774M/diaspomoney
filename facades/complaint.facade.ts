/**
 * Complaint Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus de création de réclamation complet
 * Orchestre ComplaintService, NotificationService et EmailService
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { logger } from '@/lib/logger';
import { LANGUAGES } from '@/lib/constants';
import { complaintService } from '@/services/complaint/complaint.service';
import { notificationService } from '@/services/notification/notification.service';
import { CreateComplaintData } from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

export interface ComplaintFacadeData extends CreateComplaintData {
  sendNotification?: boolean; // Envoyer une notification
  notifyProvider?: boolean; // Notifier le provider concerné
  sendEmail?: boolean; // Envoyer un email de confirmation
  recipientEmail?: string; // Email du destinataire
}

export interface ComplaintFacadeResult {
  success: boolean;
  complaintId?: string;
  complaintNumber?: string;
  notificationSent?: boolean;
  emailSent?: boolean;
  error?: string;
}

/**
 * ComplaintFacade - Facade pour le processus de création de réclamation complet
 */
export class ComplaintFacade {
  private static instance: ComplaintFacade;

  private constructor() {}

  static getInstance(): ComplaintFacade {
    if (!ComplaintFacade.instance) {
      ComplaintFacade.instance = new ComplaintFacade();
    }
    return ComplaintFacade.instance;
  }

  /**
   * Créer une réclamation complète avec orchestration
   *
   * Étapes :
   * 1. Créer la réclamation
   * 2. Envoyer une notification à l'utilisateur (si demandé)
   * 3. Notifier le provider (si demandé)
   * 4. Envoyer un email de confirmation (si demandé)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z
          .object({
            title: z.string().min(1, 'Title is required'),
            type: z.enum(['QUALITY', 'DELAY', 'BILLING', 'COMMUNICATION']),
            priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
            description: z.string().min(1, 'Description is required'),
            provider: z.string().min(1, 'Provider is required'),
            appointmentId: z.string().min(1, 'Appointment ID is required'),
            userId: z.string().min(1, 'User ID is required'),
          })
          .passthrough(),
        paramName: 'data',
      },
    ],
  })
  async createComplaint(
    data: ComplaintFacadeData,
  ): Promise<ComplaintFacadeResult> {
    try {
      logger.info(
        {
          userId: data.userId,
          type: data.type,
          priority: data.priority,
          sendNotification: data.sendNotification,
          notifyProvider: data.notifyProvider,
        },
        'Creating complaint via ComplaintFacade',
      );

      // Étape 1: Créer la réclamation
      const complaint = await complaintService.createComplaint(data);

      const complaintId: string = complaint.id || (complaint as any)._id?.toString() || '';
      const complaintNumber: string = complaint.number || '';

      let notificationSent = false;
      let emailSent = false;

      // Étape 2: Envoyer une notification à l'utilisateur si demandé
      if (data.sendNotification !== false) {
        try {
          await notificationService.sendNotification({
            recipient: data.userId || '',
            type: 'COMPLAINT_CREATED',
            template: 'complaint_created',
            data: {
              complaintNumber,
              title: data.title,
              type: data.type,
              priority: data.priority,
            },
            channels: [
              { type: 'IN_APP', enabled: true, priority: 'HIGH' },
              { type: 'EMAIL', enabled: true, priority: 'MEDIUM' },
            ],
            locale: 'fr',
            priority: 'HIGH',
          });

          notificationSent = true;
        } catch (notificationError) {
          // Ne pas faire échouer la création de réclamation si la notification échoue
          logger.error(
            { error: notificationError, complaintId },
            'Failed to send notification, continuing...',
          );
        }
      }

      // Étape 3: Notifier le provider si demandé
      if (data.notifyProvider !== false) {
        try {
          // Récupérer l'ID du provider depuis les données
          const { getUserRepository } = await import('@/repositories');
          const userRepository = getUserRepository();
          // Le provider est stocké comme string dans data.provider
          // On peut essayer de trouver l'utilisateur par email ou ID
          const provider = await userRepository.findById(data.provider).catch(
            () => null,
          );

          if (provider && (provider.id || (provider as any)._id)) {
            const providerId: string = provider.id || (provider as any)._id?.toString() || data.provider;
            await notificationService.sendNotification({
              recipient: providerId,
              type: 'COMPLAINT_RECEIVED',
              template: 'complaint_received',
              data: {
                complaintNumber,
                title: data.title,
                type: data.type,
                priority: data.priority,
                userId: data.userId,
              },
              channels: [
                { type: 'IN_APP', enabled: true, priority: 'HIGH' },
                { type: 'EMAIL', enabled: true, priority: 'MEDIUM' },
              ],
              locale: LANGUAGES.FR.code,
              priority: data.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
            });
          }
        } catch (providerNotificationError) {
          // Ne pas faire échouer la création de réclamation
          logger.error(
            { error: providerNotificationError, complaintId },
            'Failed to notify provider, continuing...',
          );
        }
      }

      // Étape 4: Envoyer un email de confirmation si demandé
      if (data.sendEmail !== false && data.recipientEmail) {
        try {
          const { emailService } = await import('@/services/email/email.service');
          const emailResult = await emailService.sendCustomEmail(
            data.recipientEmail,
            `Réclamation ${complaintNumber} créée`,
            this.generateComplaintEmailHTML(complaint, complaintNumber),
            this.generateComplaintEmailText(complaint, complaintNumber),
          );

          emailSent = emailResult;
        } catch (emailError) {
          // Ne pas faire échouer la création de réclamation si l'email échoue
          logger.error(
            { error: emailError, complaintId },
            'Failed to send complaint email, continuing...',
          );
        }
      }

      logger.info(
        {
          complaintId,
          complaintNumber,
          notificationSent,
          emailSent,
        },
        'Complaint created successfully via ComplaintFacade',
      );

      return {
        success: true,
        complaintId,
        complaintNumber,
        notificationSent,
        emailSent,
      };
    } catch (error: any) {
      logger.error(
        {
          error,
          data: {
            userId: data.userId,
            type: data.type,
            priority: data.priority,
          },
        },
        'Error creating complaint via ComplaintFacade',
      );

      Sentry.captureException(error, {
        extra: {
          complaintData: {
            userId: data.userId,
            type: data.type,
            priority: data.priority,
          },
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de la création de la réclamation',
      };
    }
  }

  /**
   * Générer le HTML de l'email de réclamation
   */
  private generateComplaintEmailHTML(
    complaint: any,
    complaintNumber: string,
  ): string {
    const priorityLabels: Record<string, string> = {
      HIGH: 'Haute',
      MEDIUM: 'Moyenne',
      LOW: 'Basse',
    };

    return `
      <html>
        <body>
          <h2>Réclamation ${complaintNumber}</h2>
          <p>Bonjour,</p>
          <p>Votre réclamation a été créée avec succès.</p>
          <p><strong>Numéro :</strong> ${complaintNumber}</p>
          <p><strong>Titre :</strong> ${complaint.title || 'N/A'}</p>
          <p><strong>Type :</strong> ${complaint.type || 'N/A'}</p>
          <p><strong>Priorité :</strong> ${priorityLabels[complaint.priority] || complaint.priority || 'N/A'}</p>
          <p>Nous traiterons votre réclamation dans les plus brefs délais.</p>
          <p>Cordialement,<br>L'équipe DiaspoMoney</p>
        </body>
      </html>
    `;
  }

  /**
   * Générer le texte de l'email de réclamation
   */
  private generateComplaintEmailText(
    complaint: any,
    complaintNumber: string,
  ): string {
    const priorityLabels: Record<string, string> = {
      HIGH: 'Haute',
      MEDIUM: 'Moyenne',
      LOW: 'Basse',
    };

    return `
      Réclamation ${complaintNumber}
      
      Bonjour,
      
      Votre réclamation a été créée avec succès.
      
      Numéro : ${complaintNumber}
      Titre : ${complaint.title || 'N/A'}
      Type : ${complaint.type || 'N/A'}
      Priorité : ${priorityLabels[complaint.priority] || complaint.priority || 'N/A'}
      
      Nous traiterons votre réclamation dans les plus brefs délais.
      
      Cordialement,
      L'équipe DiaspoMoney
    `;
  }
}

// Export de l'instance singleton
export const complaintFacade = ComplaintFacade.getInstance();

