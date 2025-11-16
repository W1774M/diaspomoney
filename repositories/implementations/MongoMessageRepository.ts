/**
 * Implémentation MongoDB du repository de messages
 */

import Message from '@/models/Message';
import { Message as MessageType } from '@/types/messaging';
import { ObjectId } from 'mongodb';
import { IMessageRepository } from '../interfaces/IMessagingRepository';
import { PaginatedResult, PaginationOptions } from '../interfaces/IRepository';

export class MongoMessageRepository implements IMessageRepository {
  async findById(id: string): Promise<MessageType | null> {
    try {
      const message = await (Message as any).findById(new ObjectId(id));
      return message ? this.mapToMessage(message) : null;
    } catch (error) {
      console.error('[MongoMessageRepository] Error in findById:', error);
      throw error;
    }
  }

  async findByConversation(
    conversationId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<MessageType>> {
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
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error(
        '[MongoMessageRepository] Error in findByConversation:',
        error
      );
      throw error;
    }
  }

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
      console.error('[MongoMessageRepository] Error in create:', error);
      throw error;
    }
  }

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
        }
      );
      return true;
    } catch (error) {
      console.error('[MongoMessageRepository] Error in markAsRead:', error);
      throw error;
    }
  }

  async markConversationAsRead(
    conversationId: string,
    userId: string
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
        }
      );
      return result.modifiedCount;
    } catch (error) {
      console.error(
        '[MongoMessageRepository] Error in markConversationAsRead:',
        error
      );
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await (Message as any).deleteOne({
        _id: new ObjectId(id),
      });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('[MongoMessageRepository] Error in delete:', error);
      throw error;
    }
  }

  async countUnread(conversationId: string, userId: string): Promise<number> {
    try {
      return await (Message as any).countDocuments({
        conversationId: new ObjectId(conversationId),
        senderId: { $ne: new ObjectId(userId) },
        read: false,
      });
    } catch (error) {
      console.error('[MongoMessageRepository] Error in countUnread:', error);
      throw error;
    }
  }

  private mapToMessage(doc: any): MessageType {
    return {
      _id: doc._id,
      conversationId: doc.conversationId,
      senderId: doc.senderId,
      text: doc.text,
      attachments: doc.attachments?.map((a: any) =>
        a.toString ? a.toString() : a
      ),
      read: doc.read,
      readAt: doc.readAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
