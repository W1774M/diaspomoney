import { BaseEntity } from './index';

export type INotificationUIType = 'info' | 'success' | 'warning' | 'error';

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
export interface NotificationTemplate extends BaseEntity {
  _id: string; // Requis pour BaseEntity
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  channels: NotificationChannel[];
  locale: string;
  createdAt: Date; // Requis pour BaseEntity
  updatedAt: Date; // Requis pour BaseEntity
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
 * Version de base pour les notifications UI
 */
export interface UINotificationBase {
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
  metadata?: Record<string, any>;
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
 * Diffère de l'interface Notification qui est pour la base de données
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

export interface NotificationState {
  notifications: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>;
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface NotificationSettingsData {
  language: string;
  timezone: string;
  notifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface NotificationSettingsProps {
  data: NotificationSettingsData;
  setData: (data: NotificationSettingsData) => void;
  onSave: () => void;
  saving: boolean;
}

export const NotificationType = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  WHATSAPP: 'WHATSAPP',
} as const;

/**
 * Notification pour la base de données (avec BaseEntity)
 */
export interface Notification extends BaseEntity {
  channels: NotificationChannel[];
  id: string;
  recipient: string;
  recipientId?: string;
  userId: string;
  type: string;
  status: NotificationStatus;
  subject: string;
  content: string;
  metadata?: Record<string, any>;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}