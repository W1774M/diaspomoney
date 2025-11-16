/**
 * Types et interfaces pour les notifications
 */

export type NotificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'EXPIRED';

export type NotificationChannelType =
  | 'EMAIL'
  | 'SMS'
  | 'PUSH'
  | 'WHATSAPP'
  | 'IN_APP';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface NotificationChannel {
  type: NotificationChannelType;
  enabled: boolean;
  priority: NotificationPriority;
}

/**
 * Template de notification
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  channels: NotificationChannel[];
  locale: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

/**
 * Données pour créer une notification
 */
export interface NotificationData {
  recipient: string;
  type: string;
  template: string;
  data: Record<string, any>;
  channels: NotificationChannel[];
  locale: string;
  priority: NotificationPriority;
  scheduledAt?: Date;
  expiresAt?: Date;
}

/**
 * Notification complète (pour le service)
 */
export interface Notification {
  id: string;
  recipient: string;
  type: string;
  subject: string;
  content: string;
  channels: NotificationChannel[];
  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

/**
 * Statistiques des notifications
 */
export interface NotificationStats {
  totalSent: number;
  deliveryRate: number;
  failureRate: number;
  averageDeliveryTime: number;
  channelBreakdown: Record<
    string,
    { sent: number; delivered: number; failed: number }
  >;
}

/**
 * Interface pour les notifications dans l'UI (page notifications, dropdown header)
 * Diffère de l'interface Notification dans types/index.ts qui est pour la base de données
 */
export interface UINotification {
  id: string;
  type: string;
  subject: string;
  content: string;
  status: NotificationStatus;
  channels: NotificationChannel[];
  read: boolean;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface NotificationResponse {
  success: boolean;
  notifications: UINotification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount: number;
}

export interface NotificationFilters {
  status?: 'all' | 'unread' | 'read';
  type?: string;
  page?: number;
  limit?: number;
}
