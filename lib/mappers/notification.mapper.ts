/**
 * Mappers pour les notifications
 * Transforme les documents notification en réponses API
 */

import type { IMapper, MappingOptions } from '@/lib/types';
import type { NotificationStatus, NotificationChannelType, NotificationPriority, NotificationChannel } from '@/lib/types/notifications.types';

/**
 * Type pour un document Notification MongoDB
 */
export interface NotificationDocument {
  _id?: any;
  id?: string;
  recipient?: string;
  type?: string;
  subject?: string;
  content?: string;
  template?: string;
  channels?: Array<{
    type?: string;
    enabled?: boolean;
    priority?: string;
  }>;
  status?: string;
  priority?: string;
  locale?: string;
  sentAt?: Date | string;
  deliveredAt?: Date | string;
  failedAt?: Date | string;
  failureReason?: string;
  scheduledAt?: Date | string;
  expiresAt?: Date | string;
  metadata?: Record<string, any>;
  data?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

/**
 * Type pour une réponse API de notification
 */
export interface NotificationResponse {
  id: string;
  _id: string;
  recipient: string;
  type: string;
  subject: string;
  content: string;
  template?: string;
  channels: NotificationChannel[];
  status: NotificationStatus;
  priority: NotificationPriority;
  locale?: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  scheduledAt?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
  data?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convertit une date en ISO string de manière sécurisée
 */
function toISOString(date: Date | string | undefined | null): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  try {
    return new Date(date as string | number).toISOString();
  } catch {
    return undefined;
  }
}

/**
 * Mappe le statut
 */
function mapStatus(status: string | undefined): NotificationStatus {
  if (!status) return 'PENDING';
  
  const statusMap: Record<string, NotificationStatus> = {
    pending: 'PENDING',
    sent: 'SENT',
    delivered: 'DELIVERED',
    failed: 'FAILED',
    expired: 'EXPIRED',
  };
  
  const normalizedStatus = status.toUpperCase();
  return (statusMap[normalizedStatus.toLowerCase()] || normalizedStatus) as NotificationStatus;
}

/**
 * Mappe le type de canal
 */
function mapChannelType(type: string | undefined): NotificationChannelType {
  if (!type) return 'EMAIL';
  
  const typeMap: Record<string, NotificationChannelType> = {
    email: 'EMAIL',
    sms: 'SMS',
    push: 'PUSH',
    whatsapp: 'WHATSAPP',
    in_app: 'IN_APP',
    inapp: 'IN_APP',
  };
  
  const normalizedType = type.toUpperCase().replace('_', '');
  return (typeMap[normalizedType.toLowerCase()] || normalizedType) as NotificationChannelType;
}

/**
 * Mappe la priorité
 */
function mapPriority(priority: string | undefined): NotificationPriority {
  if (!priority) return 'MEDIUM';
  
  const priorityMap: Record<string, NotificationPriority> = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
    urgent: 'URGENT',
  };
  
  const normalizedPriority = priority.toUpperCase();
  return (priorityMap[normalizedPriority.toLowerCase()] || normalizedPriority) as NotificationPriority;
}

/**
 * Mappe les canaux
 */
function mapChannels(channels: Array<{ type?: string; enabled?: boolean; priority?: string }> | undefined): NotificationChannel[] {
  if (!channels || channels.length === 0) {
    return [{ type: 'EMAIL', enabled: true, priority: 'MEDIUM' }];
  }
  
  return channels.map(channel => ({
    type: mapChannelType(channel.type),
    enabled: channel.enabled ?? true,
    priority: mapPriority(channel.priority),
  }));
}

/**
 * Classe NotificationMapper implémentant IMapper
 */
export class NotificationMapper implements IMapper<NotificationDocument, NotificationResponse> {
  /**
   * Transforme un document notification vers une réponse API
   */
  map(input: NotificationDocument, options?: MappingOptions): NotificationResponse {
    return mapNotificationToResponse(input, options);
  }

  /**
   * Transforme un tableau de documents notification
   */
  mapMany(inputs: NotificationDocument[], options?: MappingOptions): NotificationResponse[] {
    return inputs.map((input) => this.map(input, options));
  }
}

/**
 * Instance singleton du mapper
 */
export const notificationMapper = new NotificationMapper();

/**
 * Mappe un document notification vers une réponse API
 * 
 * @param notificationDoc - Document notification depuis le repository
 * @param options - Options de mapping
 * @returns Réponse API formatée
 */
export function mapNotificationToResponse(
  notificationDoc: NotificationDocument,
  _options?: MappingOptions,
): NotificationResponse {
  // Extraire l'ID
  const id = notificationDoc.id || notificationDoc._id?.toString() || '';
  const _id = notificationDoc._id?.toString() || id;

  const sentAtValue = notificationDoc.sentAt ? toISOString(notificationDoc.sentAt) : undefined;
  const deliveredAtValue = notificationDoc.deliveredAt ? toISOString(notificationDoc.deliveredAt) : undefined;
  const failedAtValue = notificationDoc.failedAt ? toISOString(notificationDoc.failedAt) : undefined;
  const scheduledAtValue = notificationDoc.scheduledAt ? toISOString(notificationDoc.scheduledAt) : undefined;
  const expiresAtValue = notificationDoc.expiresAt ? toISOString(notificationDoc.expiresAt) : undefined;
  
  return {
    id,
    _id,
    recipient: notificationDoc.recipient || '',
    type: notificationDoc.type || '',
    subject: notificationDoc.subject || '',
    content: notificationDoc.content || '',
    ...(notificationDoc.template && { template: notificationDoc.template }),
    channels: mapChannels(notificationDoc.channels),
    status: mapStatus(notificationDoc.status),
    priority: mapPriority(notificationDoc.priority),
    ...(notificationDoc.locale && { locale: notificationDoc.locale }),
    ...(sentAtValue && { sentAt: sentAtValue }),
    ...(deliveredAtValue && { deliveredAt: deliveredAtValue }),
    ...(failedAtValue && { failedAt: failedAtValue }),
    ...(notificationDoc.failureReason && { failureReason: notificationDoc.failureReason }),
    ...(scheduledAtValue && { scheduledAt: scheduledAtValue }),
    ...(expiresAtValue && { expiresAt: expiresAtValue }),
    ...(notificationDoc.metadata && { metadata: notificationDoc.metadata }),
    ...(notificationDoc.data && { data: notificationDoc.data }),
    createdAt: toISOString(notificationDoc.createdAt) || new Date().toISOString(),
    updatedAt: toISOString(notificationDoc.updatedAt) || new Date().toISOString(),
  };
}

