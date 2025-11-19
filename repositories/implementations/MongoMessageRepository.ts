/**
 * Implémentation MongoDB du repository de messages
 * Implémente les design patterns :
 * - Repository Pattern
 * - Dependency Injection
 * - Logger Pattern (structured logging avec childLogger)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Error Handling Pattern (Sentry)
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import Message from '@/models/Message';
import { Message as MessageType } from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import { ObjectId } from 'mongodb';
import { IMessageRepository } from '../interfaces/IMessagingRepository';
import type {
  PaginatedFindResult,
  PaginationOptions,
} from '@/lib/types';

export class MongoMessageRepository implements IMessageRepository {
  private readonly log = childLogger({
    component: 'MongoMessageRepository',
  });

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'MessageRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<MessageType | null> {
    try {
      const message = await (Message as any).findById(new ObjectId(id));
      const result = message ? this.mapToMessage(message) : null;
      if (result) {
        this.log.debug({ messageId: id }, 'Message found');
      } else {
        this.log.debug({ messageId: id }, 'Message not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, id }, 'Error in findById');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoMessageRepository', action: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'MessageRepository:findByConversation' }) // Cache 5 minutes
  async findByConversation(
    conversationId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<MessageType>> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 50;
      const offset = options?.offset || (page - 1) * limit;

      const query = (Message as any).find({
        conversationId: new ObjectId(conversationId),
      });

      if (options?.sort) {
        query.sort(options.sort);
      } else {
        query.sort({ createdAt: -1 });
      }

      const [messages, total] = await Promise.all([
        query.skip(offset).limit(limit).lean(),
        (Message as any).countDocuments({
          conversationId: new ObjectId(conversationId),
        }),
      ]);

      return {
        data: messages.map((m: any) => this.mapToMessage(m)).reverse(),
        total,
        pagination: {
          page,
          limit,
          pages: Math.ceil(total / limit),
          offset,
          total,
          hasNext: offset + limit < total,
          hasPrev: offset > 0,
        },
      };
    } catch (error) {
      this.log.error(
        { error, conversationId, options },
        'Error in findByConversation',
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoMessageRepository',
          action: 'findByConversation',
        },
        extra: { conversationId },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('MessageRepository:*') // Invalider le cache après création
  async create(data: Partial<MessageType>): Promise<MessageType> {
    try {
      const message = new Message({
        ...data,
        conversationId: new ObjectId(data.conversationId as any),
        senderId: new ObjectId(data.senderId as any),
        attachments: data.attachments?.map((a: any) => new ObjectId(a)),
      });
      await message.save();
      return this.mapToMessage(message);
    } catch (error) {
      this.log.error(
        { error, senderId: data.senderId, conversationId: data.conversationId },
        'Error in create',
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoMessageRepository', action: 'create' },
        extra: { senderId: data.senderId, conversationId: data.conversationId },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('MessageRepository:*') // Invalider le cache après marquage comme lu
  async markAsRead(messageId: string, userId: string): Promise<boolean> {
    try {
      await (Message as any).updateOne(
        {
          _id: new ObjectId(messageId),
          senderId: { $ne: new ObjectId(userId) },
        },
        {
          $set: {
            read: true,
            readAt: new Date(),
          },
        },
      );
      return true;
    } catch (error) {
      this.log.error({ error, messageId, userId }, 'Error in markAsRead');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoMessageRepository', action: 'markAsRead' },
        extra: { messageId, userId },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('MessageRepository:*') // Invalider le cache après marquage comme lu
  async markConversationAsRead(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    try {
      const result = await (Message as any).updateMany(
        {
          conversationId: new ObjectId(conversationId),
          senderId: { $ne: new ObjectId(userId) },
          read: false,
        },
        {
          $set: {
            read: true,
            readAt: new Date(),
          },
        },
      );
      return result.modifiedCount;
    } catch (error) {
      this.log.error(
        { error, conversationId, userId },
        'Error in markConversationAsRead',
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoMessageRepository',
          action: 'markConversationAsRead',
        },
        extra: { conversationId, userId },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('MessageRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const result = await (Message as any).deleteOne({
        _id: new ObjectId(id),
      });
      return result.deletedCount > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error in delete');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoMessageRepository', action: 'delete' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(60, { prefix: 'MessageRepository:countUnread' }) // Cache 1 minute (plus fréquent)
  async countUnread(conversationId: string, userId: string): Promise<number> {
    try {
      return await (Message as any).countDocuments({
        conversationId: new ObjectId(conversationId),
        senderId: { $ne: new ObjectId(userId) },
        read: false,
      });
    } catch (error) {
      this.log.error({ error, conversationId, userId }, 'Error in countUnread');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoMessageRepository', action: 'countUnread' },
        extra: { conversationId, userId },
      });
      throw error;
    }
  }

  private mapToMessage(doc: any): MessageType {
    const docId = doc._id?.toString() || doc.id || '';
    const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
    const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : createdAt;
    return {
      _id: docId,
      id: docId,
      conversationId: doc.conversationId,
      senderId: doc.senderId,
      text: doc.text,
      attachments: doc.attachments?.map((a: any) =>
        a.toString ? a.toString() : a,
      ),
      read: doc.read,
      readAt: doc.readAt,
      createdAt,
      updatedAt,
    };
  }
}
