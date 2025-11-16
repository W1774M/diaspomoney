/**
 * Implémentation MongoDB du repository de conversations
 */

import Conversation from '@/models/Conversation';
import { Conversation as ConversationType } from '@/types/messaging';
import { ObjectId } from 'mongodb';
import { IConversationRepository } from '../interfaces/IMessagingRepository';
import { PaginatedResult, PaginationOptions } from '../interfaces/IRepository';

export class MongoConversationRepository implements IConversationRepository {
  async findById(id: string): Promise<ConversationType | null> {
    try {
      const conversation = await (Conversation as any).findById(
        new ObjectId(id)
      );
      return conversation ? this.mapToConversation(conversation) : null;
    } catch (error) {
      console.error('[MongoConversationRepository] Error in findById:', error);
      throw error;
    }
  }

  async findByParticipant(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<ConversationType>> {
    try {
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
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error(
        '[MongoConversationRepository] Error in findByParticipant:',
        error
      );
      throw error;
    }
  }

  async findByParticipants(
    participantIds: string[],
    type?: 'user' | 'support'
  ): Promise<ConversationType | null> {
    try {
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
      console.error(
        '[MongoConversationRepository] Error in findByParticipants:',
        error
      );
      throw error;
    }
  }

  async create(data: Partial<ConversationType>): Promise<ConversationType> {
    try {
      const conversation = new Conversation({
        ...data,
        participants: data.participants?.map(
          (p: any) => new ObjectId(p.toString())
        ),
      });
      await conversation.save();
      return this.mapToConversation(conversation);
    } catch (error) {
      console.error('[MongoConversationRepository] Error in create:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<ConversationType>
  ): Promise<ConversationType | null> {
    try {
      const conversation = await (Conversation as any).findByIdAndUpdate(
        new ObjectId(id),
        { $set: data },
        { new: true }
      );
      return conversation ? this.mapToConversation(conversation) : null;
    } catch (error) {
      console.error('[MongoConversationRepository] Error in update:', error);
      throw error;
    }
  }

  async updateLastMessage(
    id: string,
    message: string,
    timestamp: Date
  ): Promise<boolean> {
    try {
      await (Conversation as any).updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            lastMessage: message,
            lastMessageAt: timestamp,
          },
        }
      );
      return true;
    } catch (error) {
      console.error(
        '[MongoConversationRepository] Error in updateLastMessage:',
        error
      );
      throw error;
    }
  }

  async incrementUnreadCount(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      await (Conversation as any).updateOne(
        { _id: new ObjectId(conversationId) },
        {
          $inc: {
            [`unreadCount.${userId}`]: 1,
          },
        }
      );
      return true;
    } catch (error) {
      console.error(
        '[MongoConversationRepository] Error in incrementUnreadCount:',
        error
      );
      throw error;
    }
  }

  async resetUnreadCount(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      await (Conversation as any).updateOne(
        { _id: new ObjectId(conversationId) },
        {
          $set: {
            [`unreadCount.${userId}`]: 0,
          },
        }
      );
      return true;
    } catch (error) {
      console.error(
        '[MongoConversationRepository] Error in resetUnreadCount:',
        error
      );
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await (Conversation as any).deleteOne({
        _id: new ObjectId(id),
      });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('[MongoConversationRepository] Error in delete:', error);
      throw error;
    }
  }

  private mapToConversation(doc: any): ConversationType {
    return {
      _id: doc._id,
      participants: doc.participants?.map((p: any) =>
        p.toString ? p.toString() : p
      ),
      type: doc.type,
      lastMessage: doc.lastMessage,
      lastMessageAt: doc.lastMessageAt,
      unreadCount: doc.unreadCount || {},
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
