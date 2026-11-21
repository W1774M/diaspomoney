/**
 * MessageQueryBuilder - Builder spécialisé pour les requêtes de messages
 * Étend QueryBuilder avec des méthodes spécifiques aux messages
 */

import { MESSAGE_TYPES } from '@/lib/constants';
import { QueryBuilder } from './QueryBuilder';

export class MessageQueryBuilder extends QueryBuilder {
  /**
   * Filtrer par conversation
   */
  byConversation(conversationId: string): this {
    return this.where('conversationId', conversationId);
  }

  /**
   * Filtrer par expéditeur
   */
  bySender(senderId: string): this {
    return this.where('senderId', senderId);
  }

  /**
   * Filtrer par type de message
   */
  byType(type: typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES]): this {
    return this.where('type', type);
  }

  /**
   * Filtrer les messages texte
   */
  text(): this {
    return this.where('type', MESSAGE_TYPES.TEXT);
  }

  /**
   * Filtrer les messages avec pièces jointes
   */
  withAttachments(): this {
    return this.whereExists('attachments');
  }

  /**
   * Filtrer les messages lus
   */
  read(): this {
    return this.where('read', true);
  }

  /**
   * Filtrer les messages non lus
   */
  unread(): this {
    return this.where('read', false);
  }

  /**
   * Filtrer les messages non lus pour un utilisateur spécifique
   */
  unreadByUser(userId: string): this {
    return this.where('read', false).whereNotEqual('senderId', userId);
  }

  /**
   * Filtrer par date de lecture
   */
  readAfter(date: Date): this {
    return this.whereGreaterThan('readAt', date);
  }

  /**
   * Filtrer les messages après une date
   */
  after(date: Date): this {
    return this.whereGreaterThan('createdAt', date);
  }

  /**
   * Filtrer les messages avant une date
   */
  before(date: Date): this {
    return this.whereLessThan('createdAt', date);
  }

  /**
   * Filtrer les messages entre deux dates
   */
  between(startDate: Date, endDate: Date): this {
    return this.whereGreaterThanOrEqual('createdAt', startDate)
      .whereLessThanOrEqual('createdAt', endDate);
  }
}

