import { auth } from '@/auth';
import { DATABASE } from '@/lib/constants';
import { getMongoClient } from '@/lib/database/mongodb';
import { UINotification } from '@/types/notifications';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route - Notifications
 * Endpoint pour récupérer les notifications de l'utilisateur
 */

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'all', 'unread', 'read'
    const type = searchParams.get('type'); // Type de notification

    // Connexion à la base de données
    const client = await getMongoClient();
    const db = client.db();
    const notificationsCollection = db.collection(
      DATABASE.COLLECTIONS.NOTIFICATIONS,
    );

    // Construire le filtre pour l'utilisateur
    // Les notifications peuvent avoir 'recipient' (string) ou 'userId' (ObjectId)
    const userId = session.user.id;
    const userFilter: any = {
      $or: [
        { recipient: userId },
        { userId: userId },
        { userId: new ObjectId(userId) },
      ],
    };

    // Ajouter le filtre pour le statut read/unread
    if (status === 'unread') {
      userFilter.read = { $ne: true };
    } else if (status === 'read') {
      userFilter.read = true;
    }

    // Filtrer par type si fourni
    if (type) {
      userFilter.type = type;
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

    // Compter les notifications non lues (pour tous les filtres sauf 'read')
    const unreadFilter: any = {
      $or: [
        { recipient: userId },
        { userId: userId },
        { userId: new ObjectId(userId) },
      ],
      read: { $ne: true },
    };
    const unreadCount = await notificationsCollection.countDocuments(
      unreadFilter,
    );

    // Fonction helper pour convertir une date en ISO string
    const toISOString = (date: any): string => {
      if (!date) return new Date().toISOString();
      if (typeof date === 'string') return date;
      if (date instanceof Date) return date.toISOString();
      if (typeof date.toISOString === 'function') return date.toISOString();
      try {
        return new Date(date).toISOString();
      } catch {
        return new Date().toISOString();
      }
    };

    // Mapper les notifications MongoDB vers UINotification
    const mappedNotifications: UINotification[] = notifications.map(
      (notif: any) => {
        const mapped: UINotification = {
          id: notif._id?.toString() || notif.id || '',
          type: notif.type || '',
          subject: notif.subject || '',
          content: notif.content || '',
          status: (notif.status || 'PENDING') as UINotification['status'],
          channels: notif.channels || [],
          read: notif.read === true,
          createdAt: toISOString(notif.createdAt),
          metadata: notif.metadata || {},
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
        if (notif.failureReason) {
          mapped.failureReason = notif.failureReason;
        }

        return mapped;
      },
    );

    return NextResponse.json({
      success: true,
      notifications: mappedNotifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error('[API][notifications] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notifications' },
      { status: 500 },
    );
  }
}

/**
 * Marquer une notification comme lue
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID de notification requis' },
        { status: 400 },
      );
    }

    // Connexion à la base de données
    const client = await getMongoClient();
    const db = client.db();
    const notificationsCollection = db.collection(
      DATABASE.COLLECTIONS.NOTIFICATIONS,
    );

    // Vérifier que la notification appartient à l'utilisateur
    const userId = session.user.id;

    // Valider l'ObjectId
    let notificationObjectId: ObjectId;
    try {
      notificationObjectId = new ObjectId(notificationId);
    } catch {
      return NextResponse.json(
        { error: 'ID de notification invalide' },
        { status: 400 },
      );
    }

    const notification = await notificationsCollection.findOne({
      _id: notificationObjectId,
      $or: [
        { recipient: userId },
        { userId: userId },
        { userId: new ObjectId(userId) },
      ],
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification non trouvée ou accès non autorisé' },
        { status: 404 },
      );
    }

    // Mettre à jour la notification comme lue
    await notificationsCollection.updateOne(
      { _id: notificationObjectId },
      { $set: { read: true, updatedAt: new Date() } },
    );

    return NextResponse.json({
      success: true,
      message: 'Notification mise à jour',
    });
  } catch (error) {
    console.error('[API][notifications] Erreur PATCH:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la notification' },
      { status: 500 },
    );
  }
}

/**
 * Marquer toutes les notifications comme lues
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { markAllAsRead } = body;

    if (!markAllAsRead) {
      return NextResponse.json(
        { error: 'Paramètre markAllAsRead requis' },
        { status: 400 },
      );
    }

    // Connexion à la base de données
    const client = await getMongoClient();
    const db = client.db();
    const notificationsCollection = db.collection(
      DATABASE.COLLECTIONS.NOTIFICATIONS,
    );

    // Construire le filtre pour l'utilisateur
    const userId = session.user.id;
    const userFilter: any = {
      $or: [
        { recipient: userId },
        { userId: userId },
        { userId: new ObjectId(userId) },
      ],
      read: { $ne: true }, // Seulement les non lues
    };

    // Marquer toutes les notifications non lues comme lues
    const result = await notificationsCollection.updateMany(userFilter, {
      $set: { read: true, updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues',
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('[API][notifications] Erreur PUT:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des notifications' },
      { status: 500 },
    );
  }
}
