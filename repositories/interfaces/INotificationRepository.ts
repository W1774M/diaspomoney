/**
 * Interface pour le repository de notifications
 */

import type {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';
import type {
  Notification,
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

export interface INotificationRepository
  extends IPaginatedRepository<Notification, string> {
  /**
   * Trouver des notifications par destinataire
   */
  findByRecipient(
    recipient: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Notification>>;

  /**
   * Trouver des notifications par statut
   */
  findByStatus(
    status: NotificationStatus,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Notification>>;

  /**
   * Trouver des notifications par type
   */
  findByType(
    type: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Notification>>;

  /**
   * Trouver des notifications en attente
   */
  findPending(
    options?: PaginationOptions
  ): Promise<PaginatedResult<Notification>>;

  /**
   * Trouver des notifications avec filtres avancés
   */
  findNotificationsWithFilters(
    filters: NotificationFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Notification>>;

  /**
   * Mettre à jour le statut d'une notification
   */
  updateStatus(
    id: string,
    status: NotificationStatus,
    metadata?: { sentAt?: Date; deliveredAt?: Date; failedAt?: Date; failureReason?: string }
  ): Promise<Notification | null>;

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

