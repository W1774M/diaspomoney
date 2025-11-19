/**
 * Schémas de validation pour les notifications
 */

import { z } from 'zod';

/**
 * Schéma pour marquer une notification comme lue
 */
export const MarkNotificationReadSchema = z.object({
  notificationId: z.string().min(1, 'Notification ID is required'),
});

/**
 * Schéma pour marquer toutes les notifications comme lues
 */
export const MarkAllNotificationsReadSchema = z.object({
  markAllAsRead: z.boolean(),
});

/**
 * Schéma pour les filtres de notifications (query params)
 */
export const NotificationFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  status: z.enum(['all', 'unread', 'read']).optional(),
  type: z.string().optional(),
});

