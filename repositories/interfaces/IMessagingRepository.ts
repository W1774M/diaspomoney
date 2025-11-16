/**
 * Interfaces pour les repositories de messagerie
 */

import {
  Attachment,
  Conversation,
  Message,
  SupportTicket,
} from '@/types/messaging';
import { PaginatedResult, PaginationOptions } from './IRepository';

/**
 * Interface pour le repository de conversations
 */
export interface IConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  findByParticipant(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Conversation>>;
  findByParticipants(
    participantIds: string[],
    type?: 'user' | 'support'
  ): Promise<Conversation | null>;
  create(data: Partial<Conversation>): Promise<Conversation>;
  update(id: string, data: Partial<Conversation>): Promise<Conversation | null>;
  updateLastMessage(
    id: string,
    message: string,
    timestamp: Date
  ): Promise<boolean>;
  incrementUnreadCount(
    conversationId: string,
    userId: string
  ): Promise<boolean>;
  resetUnreadCount(conversationId: string, userId: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

/**
 * Interface pour le repository de messages
 */
export interface IMessageRepository {
  findById(id: string): Promise<Message | null>;
  findByConversation(
    conversationId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Message>>;
  create(data: Partial<Message>): Promise<Message>;
  markAsRead(messageId: string, userId: string): Promise<boolean>;
  markConversationAsRead(
    conversationId: string,
    userId: string
  ): Promise<number>;
  delete(id: string): Promise<boolean>;
  countUnread(conversationId: string, userId: string): Promise<number>;
}

/**
 * Interface pour le repository de tickets de support
 */
export interface ISupportTicketRepository {
  findById(id: string): Promise<SupportTicket | null>;
  findByUser(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<SupportTicket>>;
  findByStatus(
    status: 'open' | 'in_progress' | 'closed' | 'resolved',
    options?: PaginationOptions
  ): Promise<PaginatedResult<SupportTicket>>;
  create(data: Partial<SupportTicket>): Promise<SupportTicket>;
  update(
    id: string,
    data: Partial<SupportTicket>
  ): Promise<SupportTicket | null>;
  addMessage(ticketId: string, messageId: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

/**
 * Interface pour le repository d'attachments
 */
export interface IAttachmentRepository {
  findById(id: string): Promise<Attachment | null>;
  findByUser(
    userId: string,
    filters?: {
      conversationId?: string;
      messageId?: string;
      type?: string;
      search?: string;
    },
    options?: PaginationOptions
  ): Promise<PaginatedResult<Attachment>>;
  create(data: Partial<Attachment>): Promise<Attachment>;
  delete(id: string): Promise<boolean>;
  deleteByMessage(messageId: string): Promise<number>;
}
