/**
 * Implémentation MongoDB du repository d'attachments
 */

import Attachment from '@/models/Attachment';
import { Attachment as AttachmentType } from '@/types/messaging';
import { ObjectId } from 'mongodb';
import { IAttachmentRepository } from '../interfaces/IMessagingRepository';
import { PaginatedResult, PaginationOptions } from '../interfaces/IRepository';

export class MongoAttachmentRepository implements IAttachmentRepository {
  async findById(id: string): Promise<AttachmentType | null> {
    try {
      const attachment = await (Attachment as any).findById(new ObjectId(id));
      return attachment ? this.mapToAttachment(attachment) : null;
    } catch (error) {
      console.error('[MongoAttachmentRepository] Error in findById:', error);
      throw error;
    }
  }

  async findByUser(
    userId: string,
    filters?: {
      conversationId?: string;
      messageId?: string;
      type?: string;
      search?: string;
    },
    options?: PaginationOptions
  ): Promise<PaginatedResult<AttachmentType>> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const offset = options?.offset || (page - 1) * limit;

      const queryFilters: any = {
        uploadedBy: new ObjectId(userId),
      };

      if (filters?.conversationId) {
        queryFilters.conversationId = new ObjectId(filters.conversationId);
      }

      if (filters?.messageId) {
        queryFilters.messageId = new ObjectId(filters.messageId);
      }

      if (filters?.type) {
        queryFilters.type = filters.type;
      }

      if (filters?.search) {
        queryFilters.name = { $regex: filters.search, $options: 'i' };
      }

      const query = (Attachment as any).find(queryFilters);

      if (options?.sort) {
        query.sort(options.sort);
      } else {
        query.sort({ createdAt: -1 });
      }

      const [attachments, total] = await Promise.all([
        query.skip(offset).limit(limit).lean(),
        (Attachment as any).countDocuments(queryFilters),
      ]);

      return {
        data: attachments.map((a: any) => this.mapToAttachment(a)),
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error('[MongoAttachmentRepository] Error in findByUser:', error);
      throw error;
    }
  }

  async create(data: Partial<AttachmentType>): Promise<AttachmentType> {
    try {
      const attachment = new Attachment({
        ...data,
        uploadedBy: new ObjectId(data.uploadedBy as any),
        conversationId: data.conversationId
          ? new ObjectId(data.conversationId as any)
          : undefined,
        messageId: data.messageId
          ? new ObjectId(data.messageId as any)
          : undefined,
      });
      await attachment.save();
      return this.mapToAttachment(attachment);
    } catch (error) {
      console.error('[MongoAttachmentRepository] Error in create:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await (Attachment as any).deleteOne({
        _id: new ObjectId(id),
      });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('[MongoAttachmentRepository] Error in delete:', error);
      throw error;
    }
  }

  async deleteByMessage(messageId: string): Promise<number> {
    try {
      const result = await (Attachment as any).deleteMany({
        messageId: new ObjectId(messageId),
      });
      return result.deletedCount;
    } catch (error) {
      console.error(
        '[MongoAttachmentRepository] Error in deleteByMessage:',
        error
      );
      throw error;
    }
  }

  private mapToAttachment(doc: any): AttachmentType {
    return {
      _id: doc._id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      url: doc.url,
      uploadedBy: doc.uploadedBy,
      conversationId: doc.conversationId,
      messageId: doc.messageId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
