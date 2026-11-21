/**
 * Notification Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus d'envoi de notification complet
 * Orchestre NotificationService, EmailService et MessagingService
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Retry, RetryHelpers } from '@/lib/decorators/retry.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { Audit } from '@/lib/decorators/audit.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { logger } from '@/lib/logger';
import { LANGUAGES, NOTIFICATION_PRIORITIES } from '@/lib/constants';
import { notificationService } from '@/services/notification/notification.service';
import { notificationMapper } from '@/lib/mappers';
import * as Sentry from '@sentry/nextjs';
import type { NotificationFacadeData, NotificationFacadeResult, IFacade, FacadeOptions } from '@/lib/types';
import { z } from 'zod';

// Réexporter pour compatibilité
export type { NotificationFacadeData, NotificationFacadeResult };

const CreateNotificationFacadeSchema = z.object({
  recipient: z.string().min(1, 'Recipient is required'),
  type: z.string().min(1, 'Notification type is required'),
  template: z.string().min(1, 'Template is required'),
  data: z.record(z.any()),
  channels: z.array(
    z.object({
      type: z.string(),
      enabled: z.boolean(),
      priority: z.string(),
    }),
  ),
  priority: z.string().optional(),
  scheduledAt: z.date().optional(),
  expiresAt: z.date().optional(),
});

/**
 * NotificationFacade - Facade pour le processus d'envoi de notification complet
 */
export class NotificationFacade implements IFacade<NotificationFacadeData, NotificationFacadeResult> {
  private static instance: NotificationFacade;

  private constructor() {}

  static getInstance(): NotificationFacade {
    if (!NotificationFacade.instance) {
      NotificationFacade.instance = new NotificationFacade();
    }
    return NotificationFacade.instance;
  }

  /**
   * Exécuter la facade (implémentation de IFacade)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: CreateNotificationFacadeSchema,
        paramName: 'data',
      },
    ],
  })
  async execute(
    data: NotificationFacadeData,
    _options?: FacadeOptions,
  ): Promise<NotificationFacadeResult> {
    return this.sendNotification(data);
  }

  @Retry({
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    shouldRetry: (error: any) => {
      return RetryHelpers.retryOnNetworkOrServerError(error);
    },
  })
  @Audit({ eventType: 'NOTIFICATION_SENT', includeArgs: true })
  @Performance({ warningThreshold: 2000, errorThreshold: 5000 })
  async sendNotification(data: NotificationFacadeData): Promise<NotificationFacadeResult> {
    try {
      logger.info(
        {
          recipient: data.recipient,
          type: data.type,
          template: data.template,
          channels: data.channels.map((c) => c.type),
        },
        'NotificationFacade.sendNotification called',
      );

      // Envoyer la notification via NotificationService
      const notificationData: any = {
        recipient: data.recipient,
        type: data.type,
        template: data.template,
        data: data.data,
        channels: data.channels.map((c) => ({
          type: c.type as any,
          enabled: c.enabled,
          priority: (c.priority as any) || NOTIFICATION_PRIORITIES.MEDIUM,
        })),
        locale: LANGUAGES.FR.code,
        priority: (data.priority as any) || NOTIFICATION_PRIORITIES.MEDIUM,
      };
      if (data.scheduledAt) {
        notificationData.scheduledAt = data.scheduledAt;
      }
      if (data.expiresAt) {
        notificationData.expiresAt = data.expiresAt;
      }

      const notification = await notificationService.sendNotification(notificationData);

      const mappedNotification = notificationMapper.map(notification);

      // Extraire les canaux utilisés
      const channelsUsed = data.channels
        .filter((c) => c.enabled)
        .map((c) => c.type);

      logger.info(
        {
          notificationId: notification.id,
          channelsUsed,
        },
        'Notification sent successfully',
      );

      return {
        success: true,
        notification: mappedNotification,
        channelsUsed,
        message: 'Notification envoyée avec succès',
      };
    } catch (error: any) {
      logger.error(
        {
          error,
          recipient: data.recipient,
          type: data.type,
        },
        'Error in NotificationFacade.sendNotification',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'NotificationFacade',
          action: 'sendNotification',
        },
        extra: {
          recipient: data.recipient,
          type: data.type,
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi de la notification',
        errorCode: 'NOTIFICATION_SEND_FAILED',
      };
    }
  }
}

// Instance singleton exportée
export const notificationFacade = NotificationFacade.getInstance();

