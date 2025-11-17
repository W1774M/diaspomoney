/**
 * Implémentation MongoDB du repository d'attachments
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
import Attachment from '@/models/Attachment';
import { Attachment as AttachmentType } from '@/types/messaging';
import * as Sentry from '@sentry/nextjs';
import { ObjectId } from 'mongodb';
import { IAttachmentRepository } from '../interfaces/IMessagingRepository';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';

export class MongoAttachmentRepository implements IAttachmentRepository {
  private readonly log = childLogger({
    component: 'MongoAttachmentRepository',
  });
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AttachmentRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<AttachmentType | null> {
    try {
      const attachment = await (Attachment as any).findById(new ObjectId(id));
      const result = attachment ? this.mapToAttachment(attachment) : null;
      if (result) {
        this.log.debug({ attachmentId: id }, 'Attachment found');
      } else {
        this.log.debug({ attachmentId: id }, 'Attachment not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, id }, 'Error in findById');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoAttachmentRepository', action: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AttachmentRepository:findByUser' }) // Cache 5 minutes
  async findByUser(
    userId: string,
    filters?: {
      conversationId?: string;
      messageId?: string;
      type?: string;
      search?: string;
    },
    options?: PaginationOptions,
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
      this.log.error(
        { error, userId, filters, options },
        'Error in findByUser',
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoAttachmentRepository', action: 'findByUser' },
        extra: { userId, filters },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('AttachmentRepository:*') // Invalider le cache après création
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
      this.log.error({ error, uploadedBy: data.uploadedBy }, 'Error in create');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoAttachmentRepository', action: 'create' },
        extra: { uploadedBy: data.uploadedBy },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('AttachmentRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const result = await (Attachment as any).deleteOne({
        _id: new ObjectId(id),
      });
      return result.deletedCount > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error in delete');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoAttachmentRepository', action: 'delete' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('AttachmentRepository:*') // Invalider le cache après suppression
  async deleteByMessage(messageId: string): Promise<number> {
    try {
      const result = await (Attachment as any).deleteMany({
        messageId: new ObjectId(messageId),
      });
      return result.deletedCount;
    } catch (error) {
      this.log.error({ error, messageId }, 'Error in deleteByMessage');
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoAttachmentRepository',
          action: 'deleteByMessage',
        },
        extra: { messageId },
      });
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
