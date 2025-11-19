/**
 * Implémentation MongoDB du repository pour les demandes de sujet de données GDPR
 * Implémente les design patterns :
 * - Repository Pattern
 * - Dependency Injection
 * - Logger Pattern (structured logging avec childLogger)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Error Handling Pattern (Sentry)
 * - Singleton Pattern (via RepositoryContainer)
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import { mongoClient } from '@/lib/mongodb';
import type { DataSubjectRequest } from '@/types/gdpr';
import * as Sentry from '@sentry/nextjs';
import { ObjectId } from 'mongodb';
import type {
  DataSubjectRequestQuery,
  IDataSubjectRequestRepository,
} from '../interfaces/IDataSubjectRequestRepository';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';

export class MongoDataSubjectRequestRepository
  implements IDataSubjectRequestRepository
{
  private readonly collectionName = 'data_subject_requests';
  private readonly log = childLogger({
    component: 'MongoDataSubjectRequestRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('DataSubjectRequestRepository')
  async create(data: Partial<DataSubjectRequest>): Promise<DataSubjectRequest> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const document = {
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        id: data.id || new ObjectId().toString(),
        userId: data.userId || '',
        type: data.type || 'ACCESS',
        status: data.status || 'PENDING',
        requestedAt: data.requestedAt || now,
        completedAt: data.completedAt || null,
        reason: data.reason || null,
        data: data.data || null,
        createdAt: now,
        updatedAt: now,
      };

      await collection.insertOne(document);

      const createdRequest: DataSubjectRequest = {
        id: document.id,
        userId: document.userId,
        type: document.type as DataSubjectRequest['type'],
        status: document.status as DataSubjectRequest['status'],
        requestedAt: document.requestedAt,
        completedAt: document.completedAt
          ? new Date(document.completedAt)
          : undefined,
        reason: document.reason || undefined,
        data: document.data,
      };

      this.log.debug(
        { requestId: createdRequest.id, userId: createdRequest.userId },
        'Data subject request created',
      );

      return createdRequest;
    } catch (error) {
      this.log.error({ error, data }, 'Error creating data subject request');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataSubjectRequestRepository',
          action: 'create',
        },
        extra: { data },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataSubjectRequestRepository:findById' })
  async findById(id: string): Promise<DataSubjectRequest | null> {
    try {
      const collection = await this.getCollection();
      const document = await collection.findOne({
        $or: [{ _id: new ObjectId(id) }, { id }],
      });

      if (!document) {
        return null;
      }

      return this.mapToDataSubjectRequest(document);
    } catch (error) {
      this.log.error({ error, id }, 'Error finding data subject request by id');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataSubjectRequestRepository',
          action: 'findById',
        },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataSubjectRequestRepository:findAll' })
  async findAll(
    filter: Record<string, any> = {},
  ): Promise<DataSubjectRequest[]> {
    try {
      const collection = await this.getCollection();
      const documents = await collection.find(filter).toArray();
      return documents.map(doc => this.mapToDataSubjectRequest(doc));
    } catch (error) {
      this.log.error({ error, filter }, 'Error finding data subject requests');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataSubjectRequestRepository',
          action: 'findAll',
        },
        extra: { filter },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataSubjectRequestRepository:findOne' })
  async findOne(
    filter: Record<string, any>,
  ): Promise<DataSubjectRequest | null> {
    try {
      const collection = await this.getCollection();
      const document = await collection.findOne(filter);
      return document ? this.mapToDataSubjectRequest(document) : null;
    } catch (error) {
      this.log.error({ error, filter }, 'Error finding data subject request');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataSubjectRequestRepository',
          action: 'findOne',
        },
        extra: { filter },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataSubjectRequestRepository:count' })
  async count(filter: Record<string, any> = {}): Promise<number> {
    try {
      const collection = await this.getCollection();
      return await collection.countDocuments(filter);
    } catch (error) {
      this.log.error({ error, filter }, 'Error counting data subject requests');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataSubjectRequestRepository',
          action: 'count',
        },
        extra: { filter },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataSubjectRequestRepository:exists' })
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({
        $or: [{ _id: new ObjectId(id) }, { id }],
      });
      return count > 0;
    } catch (error) {
      this.log.error(
        { error, id },
        'Error checking data subject request existence',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataSubjectRequestRepository',
          action: 'exists',
        },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('DataSubjectRequestRepository')
  async update(
    id: string,
    data: Partial<DataSubjectRequest>,
  ): Promise<DataSubjectRequest | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Record<string, any> = {
        ...data,
        updatedAt: new Date(),
      };

      delete updateData['id'];
      delete updateData['_id'];

      const result = await collection.findOneAndUpdate(
        { $or: [{ _id: new ObjectId(id) }, { id }] },
        { $set: updateData },
        { returnDocument: 'after' },
      );

      if (!result) {
        return null;
      }

      return this.mapToDataSubjectRequest(result);
    } catch (error) {
      this.log.error(
        { error, id, data },
        'Error updating data subject request',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataSubjectRequestRepository',
          action: 'update',
        },
        extra: { id, data },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('Data SubjectRequestRepository')
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({
        $or: [{ _id: new ObjectId(id) }, { id }],
      });

      return result.deletedCount > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error deleting data subject request');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataSubjectRequestRepository',
          action: 'delete',
        },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataSubjectRequestRepository:findWithPagination' })
  async findWithPagination(
    filter: Record<string, any> = {},
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<DataSubjectRequest>> {
    try {
      const collection = await this.getCollection();
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const page = options.page || Math.floor(offset / limit) + 1;

      const total = await collection.countDocuments(filter);

      const sort = options.sort || { requestedAt: -1 };
      const documents = await collection
        .find(filter)
        .sort(sort as Record<string, 1 | -1>)
        .skip(offset)
        .limit(limit)
        .toArray();

      const data = documents.map(doc => this.mapToDataSubjectRequest(doc));

      return {
        data,
        total,
        limit,
        offset,
        page,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      this.log.error(
        { error, filter, options },
        'Error finding data subject requests with pagination',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataSubjectRequestRepository',
          action: 'findWithPagination',
        },
        extra: { filter, options },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataSubjectRequestRepository:searchRequests' })
  async searchRequests(
    query: DataSubjectRequestQuery,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<DataSubjectRequest>> {
    try {
      const mongoQuery: Record<string, any> = {};

      if (query.userId) {
        mongoQuery['userId'] = query.userId;
      }

      if (query.type) {
        mongoQuery['type'] = query.type;
      }

      if (query.status) {
        mongoQuery['status'] = query.status;
      }

      if (query.dateFrom || query.dateTo) {
        mongoQuery['requestedAt'] = {};
        if (query.dateFrom) {
          mongoQuery['requestedAt'].$gte = query.dateFrom;
        }
        if (query.dateTo) {
          mongoQuery['requestedAt'].$lte = query.dateTo;
        }
      }

      const paginationOptions: PaginationOptions = {
        limit: options?.limit || 50,
        offset: options?.offset || 0,
        sort: options?.sort || { requestedAt: -1 },
      };

      return this.findWithPagination(mongoQuery, paginationOptions);
    } catch (error) {
      this.log.error({ error, query }, 'Error searching data subject requests');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataSubjectRequestRepository',
          action: 'searchRequests',
        },
        extra: { query },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataSubjectRequestRepository:findByUserId' })
  async findByUserId(
    userId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<DataSubjectRequest>> {
    try {
      return this.findWithPagination(
        { userId },
        options || { sort: { requestedAt: -1 } },
      );
    } catch (error) {
      this.log.error({ error, userId }, 'Error finding requests by userId');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataSubjectRequestRepository',
          action: 'findByUserId',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('DataSubjectRequestRepository')
  async updateStatus(
    requestId: string,
    status: DataSubjectRequest['status'],
    completedAt?: Date,
    data?: any,
  ): Promise<DataSubjectRequest | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Record<string, any> = {
        status,
        updatedAt: new Date(),
      };

      if (completedAt) {
        updateData['completedAt'] = completedAt;
      }

      if (data !== undefined) {
        updateData['data'] = data;
      }

      const result = await collection.findOneAndUpdate(
        { $or: [{ _id: new ObjectId(requestId) }, { id: requestId }] },
        { $set: updateData },
        { returnDocument: 'after' },
      );

      if (!result) {
        return null;
      }

      return this.mapToDataSubjectRequest(result);
    } catch (error) {
      this.log.error(
        { error, requestId, status },
        'Error updating data subject request status',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataSubjectRequestRepository',
          action: 'updateStatus',
        },
        extra: { requestId, status, completedAt },
      });
      throw error;
    }
  }

  /**
   * Mapper un document MongoDB vers un objet DataSubjectRequest
   */
  private mapToDataSubjectRequest(doc: any): DataSubjectRequest {
    return {
      id: doc.id || doc._id?.toString() || '',
      userId: doc.userId || '',
      type: doc.type || 'ACCESS',
      status: doc.status || 'PENDING',
      requestedAt: doc.requestedAt ? new Date(doc.requestedAt) : new Date(),
      completedAt: doc.completedAt ? new Date(doc.completedAt) : undefined,
      reason: doc.reason || undefined,
      data: doc.data,
    };
  }
}
