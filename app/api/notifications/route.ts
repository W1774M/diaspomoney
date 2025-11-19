/**
 * API Route - Notifications
 * Endpoint pour gérer les notifications de l'utilisateur
 * Implémente les design patterns :
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via NotificationFiltersSchema, MarkNotificationReadSchema)
 */

import { auth } from '@/auth';
import { DATABASE } from '@/lib/constants';
import { handleApiRoute, ApiErrors, validateBody, validateQuery } from '@/lib/api/error-handler';
import { getMongoClient } from '@/lib/database/mongodb';
import { NotificationFiltersSchema, MarkNotificationReadSchema, MarkAllNotificationsReadSchema } from '@/lib/validations/notification.schema';
import { UINotification } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';
import { NotificationChannel } from '@/lib/types/notifications.types';
import { API } from '@/lib/constants';

/**
 * Interface pour une notification MongoDB
 */
interface MongoNotification {
  _id?: ObjectId;
  id?: string;
  type?: string;
  subject?: string;
  content?: string;
  status?: string;
  channels?: string[];
  read?: boolean;
  createdAt?: Date | string;
  sentAt?: Date | string;
  deliveredAt?: Date | string;
  failedAt?: Date | string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  recipient?: string;
  userId?: string | ObjectId;
}

/**
 * Fonction helper pour convertir une date en ISO string
 * 
 * @param date - Date à convertir (peut être Date, string, ou autre)
 * @returns ISO string de la date
 */
function toISOString(date: unknown): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  if (typeof date === 'object' && date !== null && 'toISOString' in date && typeof (date as { toISOString: () => string }).toISOString === 'function') {
    return (date as { toISOString: () => string }).toISOString();
  }
  try {
    return new Date(date as string | number | Date).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Mappe une notification MongoDB vers UINotification
 * 
 * @param notif - Notification MongoDB
 * @returns Notification UI
 */
function mapNotificationToUI(notif: MongoNotification): UINotification {
  const mapped: UINotification = {
    id: notif._id?.toString() || notif.id || '',
    type: notif.type || '',
    subject: notif.subject || '',
    content: notif.content || '',
    status: (notif.status || 'PENDING') as UINotification['status'],
    channels: Array.isArray(notif.channels) ? notif.channels.map(channel => channel as unknown as NotificationChannel) : [],
    read: notif.read === true,
    createdAt: toISOString(notif.createdAt),
    metadata: (notif.metadata && typeof notif.metadata === 'object') ? notif.metadata as Record<string, unknown> : {},
  };

  // Ajouter les propriétés optionnelles seulement si elles existent
  if (notif.sentAt) {
    mapped.sentAt = toISOString(notif.sentAt);
  }
  if (notif.deliveredAt) {
    mapped.deliveredAt = toISOString(notif.deliveredAt);
  }
  if (notif.failedAt) {
    mapped.failedAt = toISOString(notif.failedAt);
  }
  if (notif.failureReason && typeof notif.failureReason === 'string') {
    mapped.failureReason = notif.failureReason;
  }

  return mapped;
}

/**
 * Construit le filtre utilisateur pour les notifications
 * 
 * @param userId - ID de l'utilisateur
 * @returns Filtre MongoDB
 */
function buildUserFilter(userId: string): { $or: Array<{ recipient?: string; userId?: string | ObjectId }> } {
  return {
    $or: [
      { recipient: userId },
      { userId: userId },
      { userId: new ObjectId(userId) },
    ],
  };
}

/**
 * GET /api/notifications - Récupérer les notifications de l'utilisateur
 * 
 * @param request - La requête HTTP
 * @returns Liste paginée des notifications
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user?.email || !session.user.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    // Récupérer et valider les paramètres de requête
    const { searchParams } = new URL(request.url);
    const filters = validateQuery(searchParams, NotificationFiltersSchema);

    const page = filters.page ?? API.PAGINATION.DEFAULT_LIMIT;
    const limit = filters.limit ?? API.PAGINATION.DEFAULT_LIMIT;
    const status = filters.status; // 'all', 'unread', 'read'
    const type = filters.type; // Type de notification

    // Connexion à la base de données
    const client = await getMongoClient();
    const db = client.db();
    const notificationsCollection = db.collection<MongoNotification>(
      DATABASE.COLLECTIONS.NOTIFICATIONS,
    );

    // Construire le filtre pour l'utilisateur
    const userId = session.user.id;
    const userFilter = buildUserFilter(userId);

    // Ajouter le filtre pour le statut read/unread
    if (status === 'unread') {
      (userFilter as { read?: { $ne: boolean } }).read = { $ne: true };
    } else if (status === 'read') {
      (userFilter as { read?: boolean }).read = true;
    }

    // Filtrer par type si fourni
    if (type) {
      (userFilter as { type?: string }).type = type;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Récupérer les notifications avec pagination
    const notifications = await notificationsCollection
      .find(userFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Compter le total pour la pagination
    const total = await notificationsCollection.countDocuments(userFilter);

    // Compter les notifications non lues
    const unreadFilter = buildUserFilter(userId);
    (unreadFilter as { read?: { $ne: boolean } }).read = { $ne: true };
    const unreadCount = await notificationsCollection.countDocuments(unreadFilter);

    // Mapper les notifications MongoDB vers UINotification
    const mappedNotifications = notifications.map(mapNotificationToUI);

    return {
      success: true,
      notifications: mappedNotifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }, 'api/notifications');
}

/**
 * PATCH /api/notifications - Marquer une notification comme lue
 * 
 * @param request - La requête HTTP
 * @returns Confirmation de mise à jour
 */
export async function PATCH(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.email || !session.user.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    const body = await request.json();
    const data = validateBody(body, MarkNotificationReadSchema);
    const { notificationId } = data;

    // Connexion à la base de données
    const client = await getMongoClient();
    const db = client.db();
    const notificationsCollection = db.collection<MongoNotification>(
      DATABASE.COLLECTIONS.NOTIFICATIONS,
    );

    // Vérifier que la notification appartient à l'utilisateur
    const userId = session.user.id;

    // Valider l'ObjectId
    let notificationObjectId: ObjectId;
    try {
      notificationObjectId = new ObjectId(notificationId);
    } catch {
      throw ApiErrors.VALIDATION_ERROR('ID de notification invalide');
    }

    const notification = await notificationsCollection.findOne({
      _id: notificationObjectId,
      ...buildUserFilter(userId),
    });

    if (!notification) {
      throw ApiErrors.NOT_FOUND;
    }

    // Mettre à jour la notification comme lue
    await notificationsCollection.updateOne(
      { _id: notificationObjectId },
      { $set: { read: true, updatedAt: new Date() } },
    );

    return {
      success: true,
      message: 'Notification mise à jour',
    };
  }, 'api/notifications');
}

/**
 * PUT /api/notifications - Marquer toutes les notifications comme lues
 * 
 * @param request - La requête HTTP
 * @returns Confirmation de mise à jour
 */
export async function PUT(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.email || !session.user.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    const body = await request.json();
    const data = validateBody(body, MarkAllNotificationsReadSchema);

    if (!data.markAllAsRead) {
      throw ApiErrors.VALIDATION_ERROR('Paramètre markAllAsRead requis');
    }

    // Connexion à la base de données
    const client = await getMongoClient();
    const db = client.db();
    const notificationsCollection = db.collection<MongoNotification>(
      DATABASE.COLLECTIONS.NOTIFICATIONS,
    );

    // Construire le filtre pour l'utilisateur
    const userId = session.user.id;
    const userFilter = buildUserFilter(userId);
    (userFilter as { read?: { $ne: boolean } }).read = { $ne: true }; // Seulement les non lues

    // Marquer toutes les notifications non lues comme lues
    const result = await notificationsCollection.updateMany(userFilter, {
      $set: { read: true, updatedAt: new Date() },
    });

    return {
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues',
      updatedCount: result.modifiedCount,
    };
  }, 'api/notifications');
}
