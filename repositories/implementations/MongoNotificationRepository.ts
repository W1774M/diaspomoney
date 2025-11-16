/**
 * Implémentation MongoDB du repository notification
 *
 * Implémente les design patterns :
 * - Repository Pattern
 * - Logger Pattern (structured logging avec childLogger)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Error Handling Pattern (Sentry)
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import { mongoClient } from '@/lib/mongodb';
import type { Notification, NotificationStatus } from '@/types/notifications';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import type {
  INotificationRepository,
  NotificationFilters,
} from '../interfaces/INotificationRepository';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';

export class MongoNotificationRepository implements INotificationRepository {
  private readonly collectionName = 'notifications';
  private readonly log = childLogger({
    component: 'MongoNotificationRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<Notification | null> {
    try {
      const collection = await this.getCollection();
      const notification = await collection.findOne({ _id: new ObjectId(id) });
      const result = notification ? this.mapToNotification(notification) : null;
      if (result) {
        this.log.debug({ notificationId: id }, 'Notification found');
      } else {
        this.log.debug({ notificationId: id }, 'Notification not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, notificationId: id }, 'Error in findById');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationRepository:findAll' }) // Cache 5 minutes
  async findAll(filters?: Record<string, any>): Promise<Notification[]> {
    try {
      const collection = await this.getCollection();
      const notifications = await collection.find(filters || {}).toArray();
      const result = notifications.map(n => this.mapToNotification(n));
      this.log.debug({ count: result.length, filters }, 'Notifications found');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationRepository:findOne' }) // Cache 5 minutes
  async findOne(filters: Record<string, any>): Promise<Notification | null> {
    try {
      const collection = await this.getCollection();
      const notification = await collection.findOne(filters);
      const result = notification ? this.mapToNotification(notification) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('NotificationRepository:*') // Invalider le cache après création
  async create(data: Partial<Notification>): Promise<Notification> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const notificationData: OptionalId<Document> = {
        ...data,
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(notificationData);
      const notification = await collection.findOne({
        _id: result.insertedId,
      });
      if (!notification) {
        throw new Error('Failed to create notification');
      }
      const mappedNotification = this.mapToNotification(notification);
      this.log.info(
        {
          notificationId: mappedNotification.id,
          recipient: mappedNotification.recipient,
          type: mappedNotification.type,
          status: mappedNotification.status,
        },
        'Notification created successfully'
      );
      return mappedNotification;
    } catch (error) {
      this.log.error(
        { error, recipient: data.recipient, type: data.type },
        'Error in create'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('NotificationRepository:*') // Invalider le cache après mise à jour
  async update(
    id: string,
    data: Partial<Notification>
  ): Promise<Notification | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<Notification> = {
        ...data,
        updatedAt: new Date(),
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      const updated = result?.['value']
        ? this.mapToNotification(result['value'])
        : null;
      if (updated) {
        this.log.info(
          { notificationId: id },
          'Notification updated successfully'
        );
      } else {
        this.log.warn(
          { notificationId: id },
          'Notification not found for update'
        );
      }
      return updated;
    } catch (error) {
      this.log.error({ error, notificationId: id }, 'Error in update');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('NotificationRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      const deleted = result.deletedCount > 0;
      if (deleted) {
        this.log.info(
          { notificationId: id },
          'Notification deleted successfully'
        );
      } else {
        this.log.warn(
          { notificationId: id },
          'Notification not found for deletion'
        );
      }
      return deleted;
    } catch (error) {
      this.log.error({ error, notificationId: id }, 'Error in delete');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationRepository:count' }) // Cache 5 minutes
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments(filters || {});
      this.log.debug({ count, filters }, 'Notification count retrieved');
      return count;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in count');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationRepository:exists' }) // Cache 5 minutes
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      const exists = count > 0;
      this.log.debug(
        { notificationId: id, exists },
        'Notification existence checked'
      );
      return exists;
    } catch (error) {
      this.log.error({ error, notificationId: id }, 'Error in exists');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationRepository:findWithPagination' }) // Cache 5 minutes
  async findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Notification>> {
    try {
      const collection = await this.getCollection();
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;
      const page = options?.page || Math.floor(offset / limit) + 1;

      const query = filters || {};
      const total = await collection.countDocuments(query);

      let cursor = collection.find(query);

      if (options?.sort) {
        cursor = cursor.sort(options.sort);
      } else {
        cursor = cursor.sort({ createdAt: -1 });
      }

      cursor = cursor.skip(offset).limit(limit);

      const data = await cursor.toArray();
      const notifications = data.map(doc => this.mapToNotification(doc));

      const result = {
        data: notifications,
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };

      this.log.debug(
        {
          count: notifications.length,
          total,
          page,
          limit,
          offset,
          filters,
        },
        'Notifications paginated'
      );

      return result;
    } catch (error) {
      this.log.error(
        { error, filters, options },
        'Error in findWithPagination'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationRepository:findByRecipient' }) // Cache 5 minutes
  async findByRecipient(
    recipient: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Notification>> {
    try {
      const result = await this.findWithPagination({ recipient }, options);
      this.log.debug(
        { recipient, count: result.data.length },
        'Notifications found by recipient'
      );
      return result;
    } catch (error) {
      this.log.error({ error, recipient }, 'Error in findByRecipient');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationRepository:findByStatus' }) // Cache 5 minutes
  async findByStatus(
    status: NotificationStatus,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Notification>> {
    try {
      const result = await this.findWithPagination({ status }, options);
      this.log.debug(
        { status, count: result.data.length },
        'Notifications found by status'
      );
      return result;
    } catch (error) {
      this.log.error({ error, status }, 'Error in findByStatus');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationRepository:findByType' }) // Cache 5 minutes
  async findByType(
    type: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Notification>> {
    try {
      const result = await this.findWithPagination({ type }, options);
      this.log.debug(
        { type, count: result.data.length },
        'Notifications found by type'
      );
      return result;
    } catch (error) {
      this.log.error({ error, type }, 'Error in findByType');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationRepository:findPending' }) // Cache 5 minutes
  async findPending(
    options?: PaginationOptions
  ): Promise<PaginatedResult<Notification>> {
    try {
      const result = await this.findWithPagination(
        { status: 'PENDING' },
        options
      );
      this.log.debug(
        { count: result.data.length },
        'Pending notifications found'
      );
      return result;
    } catch (error) {
      this.log.error({ error }, 'Error in findPending');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, {
    prefix: 'NotificationRepository:findNotificationsWithFilters',
  }) // Cache 5 minutes
  async findNotificationsWithFilters(
    filters: NotificationFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Notification>> {
    try {
      const query: Record<string, any> = {};

      if (filters.recipient) {
        query['recipient'] = filters.recipient;
      }
      if (filters.type) {
        query['type'] = filters.type;
      }
      if (filters.status) {
        query['status'] = filters.status;
      }
      if (filters.channelType) {
        query['channels.type'] = filters.channelType;
      }
      if (filters.dateFrom || filters.dateTo) {
        query['createdAt'] = {};
        if (filters.dateFrom) {
          query['createdAt'].$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          query['createdAt'].$lte = filters.dateTo;
        }
      }

      const result = await this.findWithPagination(query, options);
      this.log.debug(
        {
          count: result.data.length,
          total: result.total,
          filters,
        },
        'Notifications found with filters'
      );
      return result;
    } catch (error) {
      this.log.error(
        { error, filters },
        'Error in findNotificationsWithFilters'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('NotificationRepository:*') // Invalider le cache après mise à jour du statut
  async updateStatus(
    id: string,
    status: NotificationStatus,
    metadata?: {
      sentAt?: Date;
      deliveredAt?: Date;
      failedAt?: Date;
      failureReason?: string;
    }
  ): Promise<Notification | null> {
    try {
      const updateData: Partial<Notification> = {
        status,
        updatedAt: new Date(),
      };

      if (metadata) {
        if (metadata.sentAt) updateData.sentAt = metadata.sentAt;
        if (metadata.deliveredAt) updateData.deliveredAt = metadata.deliveredAt;
        if (metadata.failedAt) updateData.failedAt = metadata.failedAt;
        if (metadata.failureReason)
          updateData.failureReason = metadata.failureReason;
      }

      const result = await this.update(id, updateData);
      if (result) {
        this.log.info(
          { notificationId: id, status },
          'Notification status updated successfully'
        );
      }
      return result;
    } catch (error) {
      this.log.error(
        { error, notificationId: id, status },
        'Error in updateStatus'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationRepository:getStats' }) // Cache 5 minutes
  async getStats(period: 'day' | 'week' | 'month' = 'day'): Promise<{
    totalSent: number;
    deliveryRate: number;
    failureRate: number;
    averageDeliveryTime: number;
    channelBreakdown: Record<
      string,
      { sent: number; delivered: number; failed: number }
    >;
  }> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      let dateFrom: Date;

      switch (period) {
        case 'day':
          dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const query = { createdAt: { $gte: dateFrom } };

      // Compter les notifications envoyées
      const totalSent = await collection.countDocuments({
        ...query,
        status: { $in: ['SENT', 'DELIVERED', 'FAILED'] },
      });

      // Compter les notifications livrées
      const delivered = await collection.countDocuments({
        ...query,
        status: 'DELIVERED',
      });

      // Compter les notifications échouées
      const failed = await collection.countDocuments({
        ...query,
        status: 'FAILED',
      });

      // Calculer les taux
      const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
      const failureRate = totalSent > 0 ? (failed / totalSent) * 100 : 0;

      // Calculer le temps moyen de livraison
      const deliveredNotifications = await collection
        .find({
          ...query,
          status: 'DELIVERED',
          sentAt: { $exists: true },
          deliveredAt: { $exists: true },
        })
        .toArray();

      let averageDeliveryTime = 0;
      if (deliveredNotifications.length > 0) {
        const totalTime = deliveredNotifications.reduce((sum, notif) => {
          const sentAt = notif['sentAt']
            ? new Date(notif['sentAt']).getTime()
            : 0;
          const deliveredAt = notif['deliveredAt']
            ? new Date(notif['deliveredAt']).getTime()
            : 0;
          return sum + (deliveredAt - sentAt);
        }, 0);
        averageDeliveryTime = totalTime / deliveredNotifications.length / 1000; // en secondes
      }

      // Breakdown par canal
      const channelBreakdown: Record<
        string,
        { sent: number; delivered: number; failed: number }
      > = {};

      const allNotifications = await collection.find(query).toArray();
      for (const notif of allNotifications) {
        const channels = notif['channels'] || [];
        for (const channel of channels) {
          const channelType = channel.type || 'UNKNOWN';
          if (!channelBreakdown[channelType]) {
            channelBreakdown[channelType] = {
              sent: 0,
              delivered: 0,
              failed: 0,
            };
          }
          if (notif['status'] === 'SENT' || notif['status'] === 'DELIVERED') {
            channelBreakdown[channelType].sent++;
          }
          if (notif['status'] === 'DELIVERED') {
            channelBreakdown[channelType].delivered++;
          }
          if (notif['status'] === 'FAILED') {
            channelBreakdown[channelType].failed++;
          }
        }
      }

      const stats = {
        totalSent,
        deliveryRate,
        failureRate,
        averageDeliveryTime,
        channelBreakdown,
      };

      this.log.debug({ period, stats }, 'Notification stats calculated');
      return stats;
    } catch (error) {
      this.log.error({ error, period }, 'Error in getStats');
      Sentry.captureException(error);
      throw error;
    }
  }

  private mapToNotification(doc: any): Notification {
    return {
      id: doc._id?.toString() || doc.id,
      _id: doc._id?.toString(),
      recipient: doc.recipient,
      type: doc.type,
      subject: doc.subject,
      content: doc.content,
      channels: doc.channels || [],
      status: doc.status || 'PENDING',
      sentAt: doc.sentAt,
      deliveredAt: doc.deliveredAt,
      failedAt: doc.failedAt,
      failureReason: doc.failureReason,
      metadata: doc.metadata || {},
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }
}
