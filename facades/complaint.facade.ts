/**
 * Complaint Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus de création de réclamation complet
 * Orchestre ComplaintService et Comms (via dispatchFacadeNotification)
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { Audit } from '@/lib/decorators/audit.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { logger } from '@/lib/logger';
import { complaintService } from '@/services/complaint/complaint.service';
import { CreateComplaintData } from '@/lib/types';
import { complaintMapper } from '@/lib/mappers';
import { dispatchFacadeNotification } from '@/facades/_shared/dispatchNotification';
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
            bookingId: z.string().min(1).optional(),
            appointmentId: z.string().min(1).optional(),
            userId: z.string().min(1, 'User ID is required'),
          })
          .passthrough()
          .refine((d) => !!(d.bookingId || d.appointmentId), {
            message: 'bookingId or appointmentId is required',
            path: ['bookingId'],
          }),
        paramName: 'data',
      },
    ],
  })
  @Audit({ eventType: 'COMPLAINT_CREATED_VIA_FACADE', includeArgs: true })
  @Performance({ warningThreshold: 1500, errorThreshold: 4000 })
  async createComplaint(
    data: ComplaintFacadeData,
  ): Promise<ComplaintFacadeResult> {
    try {
      // bookingId canonique ; appointmentId en fallback ACL
      const bookingId = data.bookingId || data.appointmentId;
      if (!bookingId) {
        throw new Error('Complaint requires bookingId (or appointmentId)');
      }

      logger.info(
        {
          userId: data.userId,
          type: data.type,
          priority: data.priority,
          bookingId,
          sendNotification: data.sendNotification,
          notifyProvider: data.notifyProvider,
        },
        'Creating complaint via ComplaintFacade',
      );

      // Invariants CRM (domaine) — bookingId canonique (ACL appointmentId → bookingId)
      const { Complaint } = await import('@/domain/crm');
      Complaint.open({
        clientId: data.userId!,
        bookingId,
        type: data.type,
      });

      // Étape 1: Créer la réclamation (dual-write bookingId + appointmentId côté service)
      const complaint = await complaintService.createComplaint({
        ...data,
        bookingId,
        appointmentId: data.appointmentId || bookingId,
      });

      // Mapper le résultat avec ComplaintMapper
      const mappedComplaint = complaintMapper.map(complaint as any);

      const complaintId: string = mappedComplaint.id;
      const complaintNumber: string = mappedComplaint.id; // Utiliser l'ID comme numéro si number n'existe pas

      let notificationSent = false;
      let emailSent = false;

      const complaintPayload = {
        complaintNumber,
        title: data.title,
        type: data.type,
        priority: data.priority,
      };

      // Étape 2: Envoyer une notification à l'utilisateur si demandé
      if (data.sendNotification !== false) {
        notificationSent = await dispatchFacadeNotification({
          recipient: data.userId || '',
          type: 'COMPLAINT_CREATED',
          template: 'complaint_created',
          payload: complaintPayload,
          channels: ['PUSH', 'EMAIL'],
          priority: 'HIGH',
        });
      }

      // Étape 3: Notifier le provider si demandé
      if (data.notifyProvider !== false) {
        try {
          const { getUserRepository } = await import('@/repositories');
          const userRepository = getUserRepository();
          const provider = await userRepository.findById(data.provider).catch(
            () => null,
          );

          if (provider && (provider.id || (provider as any)._id)) {
            const providerId: string =
              provider.id || (provider as any)._id?.toString() || data.provider;
            await dispatchFacadeNotification({
              recipient: providerId,
              type: 'COMPLAINT_RECEIVED',
              template: 'complaint_received',
              payload: {
                ...complaintPayload,
                userId: data.userId,
              },
              channels: ['PUSH', 'EMAIL'],
              priority: data.priority === 'HIGH' ? 'HIGH' : 'NORMAL',
            });
          }
        } catch (providerNotificationError) {
          logger.error(
            { error: providerNotificationError, complaintId },
            'Failed to notify provider, continuing...',
          );
        }
      }

      // Étape 4: Envoyer un email de confirmation si demandé
      if (data.sendEmail !== false && data.recipientEmail) {
        emailSent = await dispatchFacadeNotification({
          recipient: data.recipientEmail,
          type: 'COMPLAINT_CREATED',
          template: 'complaint_created',
          payload: complaintPayload,
          channels: ['EMAIL'],
          priority: 'HIGH',
        });
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
}

// Export de l'instance singleton
export const complaintFacade = ComplaintFacade.getInstance();
