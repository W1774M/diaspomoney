/**
 * NotificationQueryBuilder - Builder spécialisé pour les requêtes de notifications
 * Étend QueryBuilder avec des méthodes spécifiques aux notifications
 */

import { NOTIFICATION_STATUSES, NOTIFICATION_PRIORITIES, NOTIFICATION_CHANNELS } from '@/lib/constants';
import { QueryBuilder } from './QueryBuilder';

export class NotificationQueryBuilder extends QueryBuilder {
  /**
   * Filtrer par destinataire
   */
  byRecipient(recipient: string): this {
    return this.where('recipient', recipient);
  }

  /**
   * Filtrer par type de notification
   */
  byType(type: string): this {
    return this.where('type', type);
  }

  /**
   * Filtrer par statut
   */
  byStatus(status: typeof NOTIFICATION_STATUSES[keyof typeof NOTIFICATION_STATUSES]): this {
    return this.where('status', status);
  }

  /**
   * Filtrer les notifications en attente
   */
  pending(): this {
    return this.where('status', NOTIFICATION_STATUSES.PENDING);
  }

  /**
   * Filtrer les notifications envoyées
   */
  sent(): this {
    return this.where('status', NOTIFICATION_STATUSES.SENT);
  }

  /**
   * Filtrer les notifications livrées
   */
  delivered(): this {
    return this.where('status', NOTIFICATION_STATUSES.DELIVERED);
  }

  /**
   * Filtrer les notifications échouées
   */
  failed(): this {
    return this.where('status', NOTIFICATION_STATUSES.FAILED);
  }

  /**
   * Filtrer les notifications expirées
   */
  expired(): this {
    return this.where('status', NOTIFICATION_STATUSES.EXPIRED);
  }

  /**
   * Filtrer par canal de notification
   */
  byChannel(channel: typeof NOTIFICATION_CHANNELS[keyof typeof NOTIFICATION_CHANNELS]): this {
    return this.where('channels.type', channel);
  }

  /**
   * Filtrer par priorité
   */
  byPriority(priority: typeof NOTIFICATION_PRIORITIES[keyof typeof NOTIFICATION_PRIORITIES]): this {
    return this.where('priority', priority);
  }

  /**
   * Filtrer par utilisateur
   */
  byUser(userId: string): this {
    return this.where('userId', userId);
  }

  /**
   * Filtrer les notifications non lues
   */
  unread(): this {
    return this.where('read', false);
  }

  /**
   * Filtrer les notifications lues
   */
  read(): this {
    return this.where('read', true);
  }

  /**
   * Filtrer par date d'envoi
   */
  sentAfter(date: Date): this {
    return this.whereGreaterThan('sentAt', date);
  }

  /**
   * Filtrer par date de livraison
   */
  deliveredAfter(date: Date): this {
    return this.whereGreaterThan('deliveredAt', date);
  }

  /**
   * Filtrer les notifications programmées
   */
  scheduled(): this {
    return this.whereExists('scheduledAt');
  }

  /**
   * Filtrer les notifications avec expiration
   */
  withExpiration(): this {
    return this.whereExists('expiresAt');
  }
}

