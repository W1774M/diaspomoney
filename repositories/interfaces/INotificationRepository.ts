/**
 * Interface pour le repository de notifications
 */

import type {
  PaginatedResult,
  PaginationOptions,
} from './IRepository';
import type {
  Notification,
  NotificationWithId,
  NotificationStatus,
} from '@/lib/types';

export interface NotificationFilters {
  recipient?: string;
  type?: string;
  status?: NotificationStatus;
  channelType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  [key: string]: any;
}

// Interface personnalisée car Notification a _id optionnel mais les résultats de lecture ont _id requis
export interface INotificationRepository {
  /**
   * Trouver une notification par son ID
   */
  findById(id: string): Promise<NotificationWithId | null>;

  /**
   * Trouver toutes les notifications
   */
  findAll(filters?: Record<string, any>): Promise<NotificationWithId[]>;

  /**
   * Trouver une notification avec filtres
   */
  findOne(filters: Record<string, any>): Promise<NotificationWithId | null>;

  /**
   * Créer une notification
   */
  create(data: Partial<Notification>): Promise<NotificationWithId>;

  /**
   * Mettre à jour une notification
   */
  update(id: string, data: Partial<Notification>): Promise<NotificationWithId | null>;

  /**
   * Supprimer une notification
   */
  delete(id: string): Promise<boolean>;

  /**
   * Compter les notifications
   */
  count(filters?: Record<string, any>): Promise<number>;

  /**
   * Trouver des notifications avec pagination
   */
  findWithPagination(
    filters?: NotificationFilters,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<NotificationWithId>>;

  /**
   * Trouver des notifications par destinataire
   */
  findByRecipient(
    recipient: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<NotificationWithId>>;

  /**
   * Trouver des notifications par statut
   */
  findByStatus(
    status: NotificationStatus,
    options?: PaginationOptions
  ): Promise<PaginatedResult<NotificationWithId>>;

  /**
   * Trouver des notifications par type
   */
  findByType(
    type: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<NotificationWithId>>;

  /**
   * Trouver des notifications en attente
   */
  findPending(
    options?: PaginationOptions
  ): Promise<PaginatedResult<NotificationWithId>>;

  /**
   * Trouver des notifications avec filtres avancés
   */
  findNotificationsWithFilters(
    filters: NotificationFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<NotificationWithId>>;

  /**
   * Mettre à jour le statut d'une notification
   */
  updateStatus(
    id: string,
    status: NotificationStatus,
    metadata?: { sentAt?: Date; deliveredAt?: Date; failedAt?: Date; failureReason?: string }
  ): Promise<NotificationWithId | null>;

  /**
   * Calculer les statistiques des notifications
   */
  getStats(period?: 'day' | 'week' | 'month'): Promise<{
    totalSent: number;
    deliveryRate: number;
    failureRate: number;
    averageDeliveryTime: number;
    channelBreakdown: Record<
      string,
      { sent: number; delivered: number; failed: number }
    >;
  }>;
}

