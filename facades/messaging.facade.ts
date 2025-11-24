/**
 * Messaging Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus de messagerie complet
 * Orchestre MessagingService et NotificationService
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Retry, RetryHelpers } from '@/lib/decorators/retry.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { Audit } from '@/lib/decorators/audit.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { logger } from '@/lib/logger';
import { LANGUAGES } from '@/lib/constants';
import { messagingService } from '@/services/messaging/messaging.service';
import { notificationService } from '@/services/notification/notification.service';
import { messageMapper } from '@/lib/mappers';
import * as Sentry from '@sentry/nextjs';
import type { MessagingFacadeData, MessagingFacadeResult, IFacade, FacadeOptions } from '@/lib/types';
import { z } from 'zod';

// Réexporter pour compatibilité
export type { MessagingFacadeData, MessagingFacadeResult };

const CreateMessagingFacadeSchema = z.object({
  conversationId: z.string().optional(),
  participants: z.array(z.string()).optional(),
  type: z.enum(['user', 'support']).optional(),
  text: z.string().min(1, 'Message text is required'),
  attachments: z.array(z.string()).optional(),
  sendNotification: z.boolean().optional(),
  userId: z.string().optional(),
});

/**
 * MessagingFacade - Facade pour le processus de messagerie complet
 */
export class MessagingFacade implements IFacade<MessagingFacadeData, MessagingFacadeResult> {
  private static instance: MessagingFacade;

  private constructor() {}

  static getInstance(): MessagingFacade {
    if (!MessagingFacade.instance) {
      MessagingFacade.instance = new MessagingFacade();
    }
    return MessagingFacade.instance;
  }

  /**
   * Exécuter la facade (implémentation de IFacade)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: CreateMessagingFacadeSchema,
        paramName: 'data',
      },
    ],
  })
  async execute(
    data: MessagingFacadeData,
    _options?: FacadeOptions,
  ): Promise<MessagingFacadeResult> {
    return this.sendMessage(data);
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
  @Audit({ eventType: 'MESSAGE_SENT', includeArgs: true })
  @Performance({ warningThreshold: 2000, errorThreshold: 5000 })
  async sendMessage(data: MessagingFacadeData): Promise<MessagingFacadeResult> {
    try {
      logger.info(
        {
          conversationId: data.conversationId,
          hasParticipants: !!data.participants,
          textLength: data.text.length,
        },
        'MessagingFacade.sendMessage called',
      );

      let conversation = null;

      // Créer ou récupérer la conversation
      const userId = data.userId || data.metadata?.['userId'] || '';
      
      if (data.conversationId) {
        // Récupérer la conversation existante via getConversations
        const conversations = await messagingService.getConversations(userId);
        conversation = conversations.find((c) => c.id === data.conversationId) || null;
        if (!conversation) {
          throw new Error(`Conversation ${data.conversationId} not found`);
        }
      } else if (data.participants && data.participants.length >= 2) {
        // Créer une nouvelle conversation
        conversation = await messagingService.createConversation({
          participants: data.participants,
          type: data.type || 'user',
        });
      } else {
        throw new Error('Either conversationId or participants must be provided');
      }

      if (!conversation) {
        throw new Error('Failed to get or create conversation');
      }

      // UIConversation n'a pas besoin d'être mappé car c'est déjà le format UI
      const conversationId = conversation.id || '';

      // Envoyer le message
      const message = await messagingService.sendMessage(
        {
          conversationId,
          text: data.text,
          attachments: data.attachments || [],
        },
        userId,
      );

      const mappedMessage = messageMapper.map(message);

      // Envoyer une notification si demandé
      let notificationSent = false;
      if (data.sendNotification !== false && data.participants) {
        try {
          // Notifier les autres participants
          const otherParticipants = data.participants.filter(
            (p) => p !== (data.userId || data.metadata?.['userId']),
          );
          for (const participantId of otherParticipants) {
            await notificationService.sendNotification({
              recipient: participantId,
              type: 'MESSAGE_RECEIVED',
              template: 'message_received',
              data: {
                conversationId: conversation.id,
                senderId: data.userId || data.metadata?.['userId'],
                messagePreview: data.text.substring(0, 100),
              },
              channels: [
                {
                  type: 'IN_APP',
                  enabled: true,
                  priority: 'MEDIUM',
                },
              ],
              locale: LANGUAGES.FR.code,
              priority: 'MEDIUM',
            });
          }
          notificationSent = true;
        } catch (notificationError) {
          logger.warn(
            { error: notificationError, conversationId: conversation.id },
            'Failed to send message notification',
          );
        }
      }

      logger.info(
        {
          conversationId: conversation.id,
          messageId: message.id,
          notificationSent,
        },
        'Message sent successfully',
      );

      return {
        success: true,
        conversation: conversation as any,
        message: mappedMessage,
        notificationSent,
        data: {
          conversation,
          message: mappedMessage,
        },
      };
    } catch (error: any) {
      logger.error(
        {
          error,
          conversationId: data.conversationId,
          hasParticipants: !!data.participants,
        },
        'Error in MessagingFacade.sendMessage',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MessagingFacade',
          action: 'sendMessage',
        },
        extra: {
          conversationId: data.conversationId,
          hasParticipants: !!data.participants,
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi du message',
        errorCode: 'MESSAGE_SEND_FAILED',
      };
    }
  }
}

// Instance singleton exportée
export const messagingFacade = MessagingFacade.getInstance();

