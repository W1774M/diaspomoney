/**
 * Implémentation MongoDB du repository de conversations
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
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { Conversation as ConversationType } from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import { ObjectId } from 'mongodb';
import { IConversationRepository } from '../interfaces/IMessagingRepository';
import type {
  PaginatedFindResult,
  PaginationOptions,
} from '@/lib/types';

export class MongoConversationRepository implements IConversationRepository {
  private readonly log = childLogger({
    component: 'MongoConversationRepository',
  });

  // S'assurer que MongoDB est connecté avant chaque opération
  private async ensureConnection() {
    await dbConnect();
  }
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ConversationRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<ConversationType | null> {
    try {
      // S'assurer que MongoDB est connecté
      await this.ensureConnection();

      const conversation = await (Conversation as any).findById(
        new ObjectId(id),
      );
      const result = conversation ? this.mapToConversation(conversation) : null;
      if (result) {
        this.log.debug({ conversationId: id }, 'Conversation found');
      } else {
        this.log.debug({ conversationId: id }, 'Conversation not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, id }, 'Error in findById');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoConversationRepository', action: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ConversationRepository:findByParticipant' }) // Cache 5 minutes
  async findByParticipant(
    userId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<ConversationType>> {
    try {
      // S'assurer que MongoDB est connecté
      await this.ensureConnection();

      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const offset = options?.offset || (page - 1) * limit;

      const query = (Conversation as any).find({
        participants: new ObjectId(userId),
      });

      if (options?.sort) {
        query.sort(options.sort);
      } else {
        query.sort({ lastMessageAt: -1 });
      }

      const [conversations, total] = await Promise.all([
        query.skip(offset).limit(limit).lean(),
        (Conversation as any).countDocuments({
          participants: new ObjectId(userId),
        }),
      ]);

      return {
        data: conversations.map((c: any) => this.mapToConversation(c)),
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
      this.log.error({ error, userId, options }, 'Error in findByParticipant');
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoConversationRepository',
          action: 'findByParticipant',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ConversationRepository:findByParticipants' }) // Cache 5 minutes
  async findByParticipants(
    participantIds: string[],
    type?: 'user' | 'support',
  ): Promise<ConversationType | null> {
    try {
      // S'assurer que MongoDB est connecté
      await this.ensureConnection();

      const filters: any = {
        participants: {
          $all: participantIds.map(id => new ObjectId(id)),
        },
      };

      if (type) {
        filters.type = type;
      }

      const conversation = await (Conversation as any).findOne(filters).lean();
      return conversation ? this.mapToConversation(conversation) : null;
    } catch (error) {
      this.log.error(
        { error, participantIds, type },
        'Error in findByParticipants',
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoConversationRepository',
          action: 'findByParticipants',
        },
        extra: { participantIds, type },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ConversationRepository:*') // Invalider le cache après création
  async create(data: Partial<ConversationType>): Promise<ConversationType> {
    try {
      const conversation = new Conversation({
        ...data,
        participants: data.participants?.map(
          (p: any) => new ObjectId(p.toString()),
        ),
      });
      await conversation.save();
      return this.mapToConversation(conversation);
    } catch (error) {
      this.log.error(
        { error, participants: data.participants, type: data.type },
        'Error in create',
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoConversationRepository', action: 'create' },
        extra: { participants: data.participants, type: data.type },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ConversationRepository:*') // Invalider le cache après mise à jour
  async update(
    id: string,
    data: Partial<ConversationType>,
  ): Promise<ConversationType | null> {
    try {
      const conversation = await (Conversation as any).findByIdAndUpdate(
        new ObjectId(id),
        { $set: data },
        { new: true },
      );
      return conversation ? this.mapToConversation(conversation) : null;
    } catch (error) {
      this.log.error({ error, id, data }, 'Error in update');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoConversationRepository', action: 'update' },
        extra: { id, data },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ConversationRepository:*') // Invalider le cache après mise à jour du dernier message
  async updateLastMessage(
    id: string,
    message: string,
    timestamp: Date,
  ): Promise<boolean> {
    try {
      await (Conversation as any).updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            lastMessage: message,
            lastMessageAt: timestamp,
          },
        },
      );
      return true;
    } catch (error) {
      this.log.error(
        { error, id, message, timestamp },
        'Error in updateLastMessage',
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoConversationRepository',
          action: 'updateLastMessage',
        },
        extra: { id, message, timestamp },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ConversationRepository:*') // Invalider le cache après incrément
  async incrementUnreadCount(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      await (Conversation as any).updateOne(
        { _id: new ObjectId(conversationId) },
        {
          $inc: {
            [`unreadCount.${userId}`]: 1,
          },
        },
      );
      return true;
    } catch (error) {
      this.log.error(
        { error, conversationId, userId },
        'Error in incrementUnreadCount',
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoConversationRepository',
          action: 'incrementUnreadCount',
        },
        extra: { conversationId, userId },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ConversationRepository:*') // Invalider le cache après réinitialisation
  async resetUnreadCount(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      await (Conversation as any).updateOne(
        { _id: new ObjectId(conversationId) },
        {
          $set: {
            [`unreadCount.${userId}`]: 0,
          },
        },
      );
      return true;
    } catch (error) {
      this.log.error(
        { error, conversationId, userId },
        'Error in resetUnreadCount',
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoConversationRepository',
          action: 'resetUnreadCount',
        },
        extra: { conversationId, userId },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ConversationRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const result = await (Conversation as any).deleteOne({
        _id: new ObjectId(id),
      });
      return result.deletedCount > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error in delete');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoConversationRepository', action: 'delete' },
        extra: { id },
      });
      throw error;
    }
  }

  private mapToConversation(doc: any): ConversationType {
    const docId = doc._id?.toString() || doc.id || '';
    const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
    const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : createdAt;
    return {
      _id: docId,
      id: docId,
      participants: doc.participants?.map((p: any) =>
        p.toString ? p.toString() : p,
      ),
      type: doc.type,
      lastMessage: doc.lastMessage,
      lastMessageAt: doc.lastMessageAt,
      unreadCount: doc.unreadCount || {},
      createdAt,
      updatedAt,
    };
  }
}
