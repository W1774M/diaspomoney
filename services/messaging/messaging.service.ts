/**
 * Messaging Service - DiaspoMoney
 *
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Repository Pattern (via IConversationRepository, IMessageRepository, ISupportTicketRepository, IAttachmentRepository)
 * - Dependency Injection (injection des repositories via constructor)
 * - Singleton Pattern (getInstance)
 * - Decorator Pattern (@Log, @Cacheable, @Validate, @InvalidateCache)
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import {
  getAttachmentRepository,
  getConversationRepository,
  getMessageRepository,
  getSupportTicketRepository,
} from '@/repositories';
import {
  IAttachmentRepository,
  IConversationRepository,
  IMessageRepository,
  ISupportTicketRepository,
} from '@/repositories/interfaces/IMessagingRepository';
import { UIAttachment, UIConversation, UIMessage } from '@/lib/types';

export interface CreateConversationData {
  participants: string[];
  type?: 'user' | 'support';
}

export interface SendMessageData {
  conversationId: string;
  text: string;
  attachments?: string[];
}

export interface CreateSupportTicketData {
  userId: string;
  subject?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface UploadAttachmentData {
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  conversationId?: string;
  messageId?: string;
}

/**
 * Service de messagerie
 * Implémente le Service Layer Pattern avec Dependency Injection
 */
export class MessagingService {
  constructor(
    private conversationRepository: IConversationRepository,
    private messageRepository: IMessageRepository,
    private supportTicketRepository: ISupportTicketRepository,
    private attachmentRepository: IAttachmentRepository,
  ) {}

  // ==================== CONVERSATIONS ====================

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'MessagingService:getConversations' }) // Cache 5 minutes
  @Validate({
    rules: [
      { paramIndex: 0, schema: z.string().min(1), paramName: 'userId' },
    ],
  })
  async getConversations(
    userId: string,
    options?: { page?: number; limit?: number },
  ): Promise<UIConversation[]> {
    try {
      const conversations = await this.conversationRepository.findByParticipant(
        userId,
        {
          page: options?.page || 1,
          limit: options?.limit || 20,
          sort: { lastMessageAt: -1 },
        },
      );

      // Fix: Only take conversations that include the user and non-empty other participant
      const uiConversations: UIConversation[] = await Promise.all(
        conversations.data.map(async conv => {
          // Identify all participants except the user
          const otherParticipants = (conv.participants || [])
            .filter((p: any) => p.toString() !== userId);

          // Support 1:1 and group conversations, but keep "participant" as first other participant for UI
          const otherParticipantId = otherParticipants[0];

          if (!otherParticipantId) {
            return null as any;
          }

          // Récupérer les infos de l'autre participant
          const { getUserRepository } = await import('@/repositories');
          const userRepo = getUserRepository();
          const otherUser = await userRepo.findById(
            otherParticipantId.toString(),
          );

          // Récupérer le dernier message
          const messages = await this.messageRepository.findByConversation(
            conv._id!.toString(),
            { page: 1, limit: 1, sort: { createdAt: -1 } }, // Fix: Make sure getting latest message
          );
          const lastMessage = messages.data[0];

          // Compter les messages non lus
          const unreadCountMap = conv.unreadCount || {};
          let unreadCount = unreadCountMap[userId];

          if (typeof unreadCount !== 'number') {
            unreadCount = await this.messageRepository.countUnread(
              conv._id!.toString(),
              userId,
            );
          }

          return {
            id: conv._id!.toString(),
            participant: {
              id: otherUser?.id || otherParticipantId.toString(),
              name: otherUser?.name || 'Utilisateur',
              avatar: (otherUser as any)?.['avatar'] || undefined,
              role: otherUser?.roles?.[0] || 'USER',
            },
            lastMessage: lastMessage?.text || '',
            lastMessageTime:
              lastMessage?.createdAt || conv.lastMessageAt || new Date(),
            unreadCount: unreadCount || 0,
          };
        }),
      );

      // Fix: filter nulls, sort by lastMessageTime descending for consistency
      return uiConversations
        .filter(c => c !== null)
        .sort((a, b) =>
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime(),
        );
    } catch (error) {
      logger.error(
        { error, userId },
        'Erreur lors de la récupération des conversations',
      );
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('MessagingService:getConversations:*') // Invalider le cache après création
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.object({
          participants: z.array(z.string().min(1)).min(2),
          type: z.enum(['user', 'support']).optional(),
        }),
        paramName: 'data',
      },
    ],
  })
  async createConversation(
    data: CreateConversationData,
  ): Promise<UIConversation> {
    try {
      // Vérifier si une conversation existe déjà
      const existing = await this.conversationRepository.findByParticipants(
        data.participants,
        data.type || 'user',
      );

      if (existing) {
        // Transformer en UIConversation
        const userId = data.participants[0];
        const conversations = await this.getConversations(userId || '');
        const found = conversations.find(c => c.id === existing._id!.toString());
        if (found) return found;
        // Fallback for missing
        return {
          id: existing._id!.toString(),
          participant: { id: '', name: '', avatar: '', role: '' },
          lastMessage: '',
          lastMessageTime: new Date(),
          unreadCount: 0,
        };
      }

      // Créer une nouvelle conversation
      const conversation = await this.conversationRepository.create({
        participants: data.participants,
        type: data.type || 'user',
        unreadCount: {},
      });

      // Transformer en UIConversation
      const conversations = await this.getConversations(
        data.participants[0] || '',
      );
      const found = conversations.find(c => c.id === conversation._id!.toString());
      if (found) return found;
      // Fallback
      return {
        id: conversation._id!.toString(),
        participant: { id: '', name: '', avatar: '', role: '' },
        lastMessage: '',
        lastMessageTime: new Date(),
        unreadCount: 0,
      };
    } catch (error) {
      logger.error(
        { error, data },
        'Erreur lors de la création de la conversation',
      );
      throw error;
    }
  }

  // ==================== MESSAGES ====================

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Cacheable(180, { prefix: 'MessagingService:getMessages' }) // Cache 3 minutes
  @Validate({
    rules: [
      { paramIndex: 0, schema: z.string().min(1), paramName: 'conversationId' },
      { paramIndex: 1, schema: z.string().min(1), paramName: 'userId' },
    ],
  })
  async getMessages(
    conversationId: string,
    userId: string,
    options?: { page?: number; limit?: number },
  ): Promise<{ messages: UIMessage[]; total: number }> {
    try {
      // Vérifier que l'utilisateur est participant
      const conversation = await this.conversationRepository.findById(
        conversationId,
      );
      if (!conversation) {
        throw new Error('Conversation non trouvée');
      }

      // Fix: Robust participant comparison
      const isParticipant = (conversation.participants || []).some(
        (p: any) => p?.toString() === userId,
      );
      if (!isParticipant) {
        throw new Error('Accès non autorisé');
      }

      // Récupérer les messages
      const result = await this.messageRepository.findByConversation(
        conversationId,
        {
          page: options?.page || 1,
          limit: options?.limit || 50,
          sort: { createdAt: -1 },
        },
      );

      // Marquer comme lus
      if (result.data.length > 0) {
        await this.messageRepository.markConversationAsRead(
          conversationId,
          userId,
        );
        await this.conversationRepository.resetUnreadCount(
          conversationId,
          userId,
        );
      }

      // Transformer pour l'UI
      const uiMessages: UIMessage[] = result.data.map(msg => ({
        id: msg._id!.toString(),
        text: msg.text,
        senderId: msg.senderId.toString(),
        timestamp: msg.createdAt || new Date(),
        attachments: Array.isArray(msg.attachments)
          ? msg.attachments.map((a: any) => a.toString())
          : [],
        read: Boolean(msg.read),
      }));

      return {
        messages: uiMessages,
        total: result.total,
      };
    } catch (error) {
      logger.error(
        { error, conversationId, userId },
        'Erreur lors de la récupération des messages',
      );
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('MessagingService:*') // Invalider le cache après envoi
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.object({
          conversationId: z.string().min(1),
          text: z.string().min(1),
          attachments: z.array(z.string()).optional(),
        }),
        paramName: 'data',
      },
      { paramIndex: 1, schema: z.string().min(1), paramName: 'userId' },
    ],
  })
  async sendMessage(data: SendMessageData, userId: string): Promise<UIMessage> {
    try {
      // Vérifier que l'utilisateur est participant
      const conversation = await this.conversationRepository.findById(
        data.conversationId,
      );
      if (!conversation) {
        throw new Error('Conversation non trouvée');
      }

      const isParticipant = (conversation.participants || []).some(
        (p: any) => p?.toString() === userId,
      );
      if (!isParticipant) {
        throw new Error('Accès non autorisé');
      }

      // Créer le message
      const message = await this.messageRepository.create({
        conversationId: data.conversationId,
        senderId: userId,
        text: data.text,
        attachments: data.attachments || [],
        read: false,
      });

      // Mettre à jour la conversation (push real lastMessageAt)
      await this.conversationRepository.updateLastMessage(
        data.conversationId,
        data.text,
        message.createdAt || new Date(),
      );

      // Incrémenter le compteur de messages non lus pour les autres participants sauf sender
      for (const participant of conversation.participants || []) {
        const pid = participant?.toString();
        if (pid && pid !== userId) {
          await this.conversationRepository.incrementUnreadCount(
            data.conversationId,
            pid,
          );
        }
      }

      // Transformer pour l'UI
      return {
        id: message._id!.toString(),
        text: message.text,
        senderId: message.senderId.toString(),
        timestamp: message.createdAt || new Date(),
        attachments: Array.isArray(message.attachments)
          ? message.attachments.map((a: any) => a.toString())
          : [],
        read: Boolean(message.read),
      };
    } catch (error) {
      logger.error(
        { error, data, userId },
        "Erreur lors de l'envoi du message",
      );
      throw error;
    }
  }

  // ==================== SUPPORT TICKETS ====================

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Cacheable(180, { prefix: 'MessagingService:getSupportTicket' }) // Cache 3 minutes
  @Validate({
    rules: [
      { paramIndex: 0, schema: z.string().min(1), paramName: 'userId' },
    ],
  })
  async getSupportTicket(userId: string): Promise<{
    ticket: { id: string; status: string; priority: string };
    messages: UIMessage[];
  }> {
    try {
      // Récupérer ou créer un ticket
      const tickets = await this.supportTicketRepository.findByUser(userId, {
        page: 1,
        limit: 2, // Fix: Make sure fetch possible multiple
      });

      let ticket = (tickets.data || []).find(
        t => t.status === 'open' || t.status === 'in_progress',
      );

      if (!ticket) {
        ticket = await this.supportTicketRepository.create({
          userId,
          status: 'open',
          priority: 'medium',
          messages: [],
        });
      }

      // Récupérer les messages
      const messages = await this.messageRepository.findByConversation(
        ticket._id!.toString(),
        { page: 1, limit: 100, sort: { createdAt: 1 } }, // Fix: oldest to newest
      );

      // Transformer pour l'UI - fix senderId identification
      const uiMessages: UIMessage[] = (messages.data || []).map(msg => ({
        id: msg._id!.toString(),
        text: msg.text,
        senderId: msg.senderId?.toString() === userId ? 'user' : 'support',
        timestamp: msg.createdAt || new Date(),
        attachments: Array.isArray(msg.attachments)
          ? msg.attachments.map((a: any) => a.toString())
          : [],
        read: Boolean(msg.read),
      }));

      return {
        ticket: {
          id: ticket._id!.toString(),
          status: ticket.status,
          priority: ticket.priority,
        },
        messages: uiMessages,
      };
    } catch (error) {
      logger.error(
        { error, userId },
        'Erreur lors de la récupération du ticket de support',
      );
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('MessagingService:getSupportTicket:*') // Invalider le cache après envoi
  @Validate({
    rules: [
      { paramIndex: 0, schema: z.string().min(1), paramName: 'userId' },
      { paramIndex: 1, schema: z.string().optional(), paramName: 'text' },
      { paramIndex: 2, schema: z.array(z.string()).optional(), paramName: 'attachments' },
    ],
  })
  async sendSupportMessage(
    userId: string,
    text: string,
    attachments?: string[],
  ): Promise<UIMessage> {
    try {
      // Récupérer ou créer un ticket
      const { ticket } = await this.getSupportTicket(userId);

      // Utiliser un texte par défaut si seulement des attachments sont envoyés
      const messageText = text && text.trim() ? text : (attachments?.length ? 'Pièce(s) jointe(s)' : '');

      if (!messageText && (!attachments || !attachments.length)) {
        throw new Error('Le message ne peut pas être vide.');
      }

      // Créer le message
      const message = await this.messageRepository.create({
        conversationId: ticket.id,
        senderId: userId,
        text: messageText,
        attachments: attachments || [],
        read: false,
      });

      // Ajouter le message au ticket
      await this.supportTicketRepository.addMessage(
        ticket.id,
        message._id!.toString(),
      );

      // Mettre à jour le statut du ticket si nécessaire
      if (ticket.status === 'closed' || ticket.status === 'resolved') {
        await this.supportTicketRepository.update(ticket.id, {
          status: 'open',
        });
      }

      // Transformer pour l'UI
      return {
        id: message._id!.toString(),
        text: message.text,
        senderId: 'user',
        timestamp: message.createdAt || new Date(),
        attachments: Array.isArray(message.attachments)
          ? message.attachments.map((a: any) => a.toString())
          : [],
        read: Boolean(message.read),
      };
    } catch (error) {
      logger.error(
        { error, userId },
        "Erreur lors de l'envoi du message de support",
      );
      throw error;
    }
  }

  // ==================== ATTACHMENTS ====================

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'MessagingService:getAttachments' }) // Cache 5 minutes
  @Validate({
    rules: [
      { paramIndex: 0, schema: z.string().min(1), paramName: 'userId' },
    ],
  })
  async getAttachments(
    userId: string,
    filters?: {
      conversationId?: string;
      messageId?: string;
      type?: string;
      search?: string;
    },
    options?: { page?: number; limit?: number },
  ): Promise<{ attachments: UIAttachment[]; total: number }> {
    try {
      const result = await this.attachmentRepository.findByUser(
        userId,
        filters,
        {
          page: options?.page || 1,
          limit: options?.limit || 20,
          sort: { createdAt: -1 },
        },
      );

      // Transformer pour l'UI
      const { getUserRepository } = await import('@/repositories');
      const userRepo = getUserRepository();

      const uiAttachments: UIAttachment[] = await Promise.all(
        (result.data || []).map(async att => {
          const uploader = await userRepo.findById(att.uploadedBy?.toString?.() ?? att.uploadedBy);
          return {
            id: att._id!.toString(),
            name: att.name,
            type: att.type,
            size: Number(att.size) || 0,
            url: att.url,
            uploadedBy: uploader?.name || 'Utilisateur',
            uploadedAt: (att as any).uploadedAt || att.createdAt || new Date(),
            ...(att.conversationId && {
              conversationId: att.conversationId.toString(),
            }),
            ...(att.messageId && { messageId: att.messageId.toString() }),
          };
        }),
      );

      return {
        attachments: uiAttachments,
        total: Number(result.total) || 0,
      };
    } catch (error) {
      logger.error(
        { error, userId, filters },
        'Erreur lors de la récupération des attachments',
      );
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('MessagingService:getAttachments:*') // Invalider le cache après upload
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.object({
          name: z.string().min(1),
          type: z.string().min(1),
          size: z.number().positive(),
          url: z.string().url(),
          uploadedBy: z.string().min(1),
          conversationId: z.string().optional(),
          messageId: z.string().optional(),
        }),
        paramName: 'data',
      },
    ],
  })
  async uploadAttachment(data: UploadAttachmentData): Promise<UIAttachment> {
    try {
      const attachment = await this.attachmentRepository.create(data);

      // Transformer pour l'UI
      const { getUserRepository } = await import('@/repositories');
      const userRepo = getUserRepository();
      const uploader = await userRepo.findById(data.uploadedBy);

      return {
        id: attachment._id!.toString(),
        name: attachment.name,
        type: attachment.type,
        size: Number(attachment.size) || 0,
        url: attachment.url,
        uploadedBy: uploader?.name || 'Utilisateur',
        uploadedAt:
          (attachment as any).uploadedAt || attachment.createdAt || new Date(),
        ...(attachment.conversationId && {
          conversationId: attachment.conversationId.toString(),
        }),
        ...(attachment.messageId && {
          messageId: attachment.messageId.toString(),
        }),
      };
    } catch (error) {
      logger.error({ error, data }, "Erreur lors de l'upload de l'attachment");
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('MessagingService:getAttachments:*') // Invalider le cache après suppression
  @Validate({
    rules: [
      { paramIndex: 0, schema: z.string().min(1), paramName: 'attachmentId' },
      { paramIndex: 1, schema: z.string().min(1), paramName: 'userId' },
    ],
  })
  async deleteAttachment(
    attachmentId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const attachment = await this.attachmentRepository.findById(attachmentId);
      if (!attachment) {
        throw new Error('Attachment non trouvé');
      }

      if (attachment.uploadedBy?.toString?.() !== userId) {
        throw new Error('Accès non autorisé');
      }

      return await this.attachmentRepository.delete(attachmentId);
    } catch (error) {
      logger.error(
        { error, attachmentId, userId },
        "Erreur lors de la suppression de l'attachment",
      );
      throw error;
    }
  }
}

// Singleton instance avec Dependency Injection
export const messagingService = new MessagingService(
  getConversationRepository(),
  getMessageRepository(),
  getSupportTicketRepository(),
  getAttachmentRepository(),
);
