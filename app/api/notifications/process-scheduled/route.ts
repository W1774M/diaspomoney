/**
 * API Route - Process Scheduled Notifications
 * Déclenche l'envoi des notifications planifiées (scheduledAt <= now) et encore en PENDING.
 *
 * IMPORTANT: cette route doit être appelée par un cron externe (Vercel Cron, GitHub Actions, etc.)
 * et protégée par un secret (Authorization: Bearer <NOTIFICATIONS_CRON_SECRET>).
 */

import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

import { DATABASE } from '@/lib/constants';
import { getMongoClient } from '@/lib/database/mongodb';
import { handleApiRoute, ApiErrors } from '@/lib/api/error-handler';
import { notificationService } from '@/services/notification/notification.service';

interface MongoNotificationDue {
  _id: ObjectId;
  status?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  sentAt?: Date | null;
}

function assertCronAuth(request: NextRequest) {
  const expected = process.env['NOTIFICATIONS_CRON_SECRET'];
  const isProd = process.env['NODE_ENV'] === 'production';

  // En prod, secret obligatoire
  if (isProd && !expected) {
    throw ApiErrors.FORBIDDEN;
  }

  // En dev, si pas de secret, on autorise pour faciliter les tests
  if (!expected) return;

  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

  if (!token || token !== expected) {
    throw ApiErrors.UNAUTHORIZED;
  }
}

export async function POST(request: NextRequest) {
  return handleApiRoute(
    request,
    async () => {
      assertCronAuth(request);

      const { searchParams } = new URL(request.url);
      const limitRaw = Number(searchParams.get('limit') || '50');
      const limit = Number.isFinite(limitRaw)
        ? Math.min(Math.max(1, limitRaw), 200)
        : 50;

      const now = new Date();

      const client = await getMongoClient();
      const db = client.db();
      const collection = db.collection<MongoNotificationDue>(
        DATABASE.COLLECTIONS.NOTIFICATIONS,
      );

      // Sélection: PENDING + due (scheduledAt absent ou <= now) + pas expirée + pas déjà envoyée
      const due = await collection
        .find({
          status: 'PENDING',
          $and: [
            {
              $or: [{ scheduledAt: { $exists: false } }, { scheduledAt: { $lte: now } }],
            },
            {
              $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
            },
            {
              // éviter de retraiter des notifications déjà envoyées
              $or: [{ sentAt: { $exists: false } }, { sentAt: null }],
            },
          ],
        })
        .sort({ scheduledAt: 1, createdAt: 1 })
        .limit(limit)
        .toArray();

      let processed = 0;
      let delivered = 0;
      let failed = 0;

      for (const doc of due) {
        processed += 1;
        try {
          const ok = await notificationService.deliverNotificationById(
            doc._id.toString(),
          );
          if (ok) delivered += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }

      return {
        success: true,
        processed,
        delivered,
        failed,
        limit,
      };
    },
    'api/notifications/process-scheduled',
  );
}


