/**
 * Implémentation MongoDB du repository pour les enregistrements de traitement de données GDPR
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
import type { DataProcessingRecord } from '@/types/gdpr';
import * as Sentry from '@sentry/nextjs';
import { ObjectId } from 'mongodb';
import type {
  DataProcessingRecordQuery,
  IDataProcessingRecordRepository,
} from '../interfaces/IDataProcessingRecordRepository';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';

export class MongoDataProcessingRecordRepository
  implements IDataProcessingRecordRepository
{
  private readonly collectionName = 'data_processing_records';
  private readonly log = childLogger({
    component: 'MongoDataProcessingRecordRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('DataProcessingRecordRepository')
  async create(
    data: Partial<DataProcessingRecord>
  ): Promise<DataProcessingRecord> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const document = {
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        id: data.id || new ObjectId().toString(),
        userId: data.userId || '',
        purpose: data.purpose || '',
        dataCategories: data.dataCategories || [],
        legalBasis: data.legalBasis || '',
        processedAt: data.processedAt || now,
        processor: data.processor || 'diaspomoney-system',
        retentionPeriod: data.retentionPeriod || 365,
        isAnonymized: data.isAnonymized ?? false,
        createdAt: now,
        updatedAt: now,
      };

      await collection.insertOne(document);

      const createdRecord: DataProcessingRecord = {
        id: document.id,
        userId: document.userId,
        purpose: document.purpose,
        dataCategories: document.dataCategories,
        legalBasis: document.legalBasis,
        processedAt: document.processedAt,
        processor: document.processor,
        retentionPeriod: document.retentionPeriod,
        isAnonymized: document.isAnonymized,
      };

      this.log.debug(
        { recordId: createdRecord.id, userId: createdRecord.userId },
        'Data processing record created'
      );

      return createdRecord;
    } catch (error) {
      this.log.error({ error, data }, 'Error creating data processing record');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataProcessingRecordRepository',
          action: 'create',
        },
        extra: { data },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataProcessingRecordRepository:findById' })
  async findById(id: string): Promise<DataProcessingRecord | null> {
    try {
      const collection = await this.getCollection();
      const document = await collection.findOne({
        $or: [{ _id: new ObjectId(id) }, { id }],
      });

      if (!document) {
        return null;
      }

      return this.mapToDataProcessingRecord(document);
    } catch (error) {
      this.log.error(
        { error, id },
        'Error finding data processing record by id'
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataProcessingRecordRepository',
          action: 'findById',
        },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataProcessingRecordRepository:findAll' })
  async findAll(
    filter: Record<string, any> = {}
  ): Promise<DataProcessingRecord[]> {
    try {
      const collection = await this.getCollection();
      const documents = await collection.find(filter).toArray();
      return documents.map(doc => this.mapToDataProcessingRecord(doc));
    } catch (error) {
      this.log.error(
        { error, filter },
        'Error finding data processing records'
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataProcessingRecordRepository',
          action: 'findAll',
        },
        extra: { filter },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataProcessingRecordRepository:findOne' })
  async findOne(
    filter: Record<string, any>
  ): Promise<DataProcessingRecord | null> {
    try {
      const collection = await this.getCollection();
      const document = await collection.findOne(filter);
      return document ? this.mapToDataProcessingRecord(document) : null;
    } catch (error) {
      this.log.error({ error, filter }, 'Error finding data processing record');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataProcessingRecordRepository',
          action: 'findOne',
        },
        extra: { filter },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataProcessingRecordRepository:count' })
  async count(filter: Record<string, any> = {}): Promise<number> {
    try {
      const collection = await this.getCollection();
      return await collection.countDocuments(filter);
    } catch (error) {
      this.log.error(
        { error, filter },
        'Error counting data processing records'
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataProcessingRecordRepository',
          action: 'count',
        },
        extra: { filter },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataProcessingRecordRepository:exists' })
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
        'Error checking data processing record existence'
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataProcessingRecordRepository',
          action: 'exists',
        },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('DataProcessingRecordRepository')
  async update(
    id: string,
    data: Partial<DataProcessingRecord>
  ): Promise<DataProcessingRecord | null> {
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
        { returnDocument: 'after' }
      );

      if (!result) {
        return null;
      }

      return this.mapToDataProcessingRecord(result);
    } catch (error) {
      this.log.error(
        { error, id, data },
        'Error updating data processing record'
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataProcessingRecordRepository',
          action: 'update',
        },
        extra: { id, data },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('DataProcessingRecordRepository')
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({
        $or: [{ _id: new ObjectId(id) }, { id }],
      });

      return result.deletedCount > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error deleting data processing record');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataProcessingRecordRepository',
          action: 'delete',
        },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, {
    prefix: 'DataProcessingRecordRepository:findWithPagination',
  })
  async findWithPagination(
    filter: Record<string, any> = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<DataProcessingRecord>> {
    try {
      const collection = await this.getCollection();
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const page = options.page || Math.floor(offset / limit) + 1;

      const total = await collection.countDocuments(filter);

      const sort = options.sort || { processedAt: -1 };
      const documents = await collection
        .find(filter)
        .sort(sort as Record<string, 1 | -1>)
        .skip(offset)
        .limit(limit)
        .toArray();

      const data = documents.map(doc => this.mapToDataProcessingRecord(doc));

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
        'Error finding data processing records with pagination'
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataProcessingRecordRepository',
          action: 'findWithPagination',
        },
        extra: { filter, options },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataProcessingRecordRepository:searchRecords' })
  async searchRecords(
    query: DataProcessingRecordQuery,
    options?: PaginationOptions
  ): Promise<PaginatedResult<DataProcessingRecord>> {
    try {
      const mongoQuery: Record<string, any> = {};

      if (query.userId) {
        mongoQuery['userId'] = query.userId;
      }

      if (query.purpose) {
        mongoQuery['purpose'] = query.purpose;
      }

      if (query.legalBasis) {
        mongoQuery['legalBasis'] = query.legalBasis;
      }

      if (query.processor) {
        mongoQuery['processor'] = query.processor;
      }

      if (query.isAnonymized !== undefined) {
        mongoQuery['isAnonymized'] = query.isAnonymized;
      }

      if (query.dateFrom || query.dateTo) {
        mongoQuery['processedAt'] = {};
        if (query.dateFrom) {
          mongoQuery['processedAt'].$gte = query.dateFrom;
        }
        if (query.dateTo) {
          mongoQuery['processedAt'].$lte = query.dateTo;
        }
      }

      const paginationOptions: PaginationOptions = {
        limit: options?.limit || 50,
        offset: options?.offset || 0,
        sort: options?.sort || { processedAt: -1 },
      };

      return this.findWithPagination(mongoQuery, paginationOptions);
    } catch (error) {
      this.log.error(
        { error, query },
        'Error searching data processing records'
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataProcessingRecordRepository',
          action: 'searchRecords',
        },
        extra: { query },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'DataProcessingRecordRepository:findByUserId' })
  async findByUserId(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<DataProcessingRecord>> {
    try {
      return this.findWithPagination(
        { userId },
        options || { sort: { processedAt: -1 } }
      );
    } catch (error) {
      this.log.error({ error, userId }, 'Error finding records by userId');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoDataProcessingRecordRepository',
          action: 'findByUserId',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Mapper un document MongoDB vers un objet DataProcessingRecord
   */
  private mapToDataProcessingRecord(doc: any): DataProcessingRecord {
    return {
      id: doc.id || doc._id?.toString() || '',
      userId: doc.userId || '',
      purpose: doc.purpose || '',
      dataCategories: doc.dataCategories || [],
      legalBasis: doc.legalBasis || '',
      processedAt: doc.processedAt ? new Date(doc.processedAt) : new Date(),
      processor: doc.processor || 'diaspomoney-system',
      retentionPeriod: doc.retentionPeriod || 365,
      isAnonymized: doc.isAnonymized ?? false,
    };
  }
}
