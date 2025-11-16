/**
 * Implémentation MongoDB du repository KYC
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
import type { KYCData, KYCFilters } from '@/types/kyc';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import type { IKYCRepository } from '../interfaces/IKYCRepository';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';

export class MongoKYCRepository implements IKYCRepository {
  private readonly collectionName = 'kyc';
  private readonly log = childLogger({
    component: 'MongoKYCRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'KYCRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<KYCData | null> {
    try {
      const collection = await this.getCollection();
      const kyc = await collection.findOne({ _id: new ObjectId(id) });
      const result = kyc ? this.mapToKYC(kyc) : null;
      if (result) {
        this.log.debug({ kycId: id }, 'KYC found');
      } else {
        this.log.debug({ kycId: id }, 'KYC not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, kycId: id }, 'Error in findById');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'KYCRepository:findAll' }) // Cache 5 minutes
  async findAll(filters?: Record<string, any>): Promise<KYCData[]> {
    try {
      const collection = await this.getCollection();
      const kycs = await collection.find(filters || {}).toArray();
      const result = kycs.map(k => this.mapToKYC(k));
      this.log.debug({ count: result.length, filters }, 'KYC records found');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'KYCRepository:findOne' }) // Cache 5 minutes
  async findOne(filters: Record<string, any>): Promise<KYCData | null> {
    try {
      const collection = await this.getCollection();
      const kyc = await collection.findOne(filters);
      const result = kyc ? this.mapToKYC(kyc) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('KYCRepository:*') // Invalider le cache après création
  async create(data: Partial<KYCData>): Promise<KYCData> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const kycData: OptionalId<Document> = {
        ...data,
        _id: data._id ? new ObjectId(data._id) : new ObjectId(),
        userId: data.userId ? new ObjectId(data.userId) : undefined,
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(kycData);
      const kyc = await collection.findOne({ _id: result.insertedId });
      if (!kyc) {
        throw new Error('Failed to create KYC');
      }
      const mapped = this.mapToKYC(kyc);
      this.log.info(
        { kycId: mapped._id, userId: mapped.userId },
        'KYC created successfully'
      );
      return mapped;
    } catch (error) {
      this.log.error({ error, data }, 'Error in create');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('KYCRepository:*') // Invalider le cache après mise à jour
  async update(id: string, data: Partial<KYCData>): Promise<KYCData | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<KYCData> = {
        ...data,
        updatedAt: new Date(),
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      const mapped = result?.['value'] ? this.mapToKYC(result['value']) : null;
      if (mapped) {
        this.log.info({ kycId: id }, 'KYC updated successfully');
      } else {
        this.log.warn({ kycId: id }, 'KYC not found for update');
      }
      return mapped;
    } catch (error) {
      this.log.error({ error, kycId: id, data }, 'Error in update');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('KYCRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      const deleted = Boolean(result.deletedCount && result.deletedCount > 0);
      if (deleted) {
        this.log.info({ kycId: id }, 'KYC deleted successfully');
      } else {
        this.log.warn({ kycId: id }, 'KYC not found for deletion');
      }
      return deleted;
    } catch (error) {
      this.log.error({ error, kycId: id }, 'Error in delete');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'KYCRepository:count' }) // Cache 5 minutes
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      const result = await collection.countDocuments(filters || {});
      this.log.debug({ count: result, filters }, 'Count completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in count');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'KYCRepository:exists' }) // Cache 5 minutes
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      const result = count > 0;
      this.log.debug({ kycId: id, exists: result }, 'Exists check completed');
      return result;
    } catch (error) {
      this.log.error({ error, kycId: id }, 'Error in exists');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'KYCRepository:findWithPagination' }) // Cache 5 minutes
  async findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<KYCData>> {
    try {
      const collection = await this.getCollection();
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const page = options?.page ?? Math.floor(offset / limit) + 1;
      const sort = options?.sort || { submittedAt: -1 };

      const query = filters || {};
      const total = await collection.countDocuments(query);
      const kycs = await collection
        .find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .toArray();

      const result = {
        data: kycs.map(k => this.mapToKYC(k)),
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
      this.log.debug(
        { count: result.data.length, total, page, limit, filters },
        'findWithPagination completed'
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
  @Cacheable(300, { prefix: 'KYCRepository:findByUserId' }) // Cache 5 minutes
  async findByUserId(userId: string): Promise<KYCData | null> {
    try {
      const result = await this.findOne({ userId: new ObjectId(userId) });
      this.log.debug({ userId, found: !!result }, 'findByUserId completed');
      return result;
    } catch (error) {
      this.log.error({ error, userId }, 'Error in findByUserId');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, {
    prefix: 'KYCRepository:findKYCWithFilters',
  }) // Cache 5 minutes
  async findKYCWithFilters(
    filters: KYCFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<KYCData>> {
    try {
      const query: Record<string, any> = {};

      if (filters.userId) {
        query['userId'] = new ObjectId(filters.userId);
      }
      if (filters.status) {
        query['status'] = filters.status;
      }
      if (filters.documentType) {
        query['documents.type'] = filters.documentType;
      }
      if (filters.documentStatus) {
        query['documents.status'] = filters.documentStatus;
      }

      const result = await this.findWithPagination(query, options);
      this.log.debug(
        { count: result.data.length, total: result.total, filters },
        'findKYCWithFilters completed'
      );
      return result;
    } catch (error) {
      this.log.error(
        { error, filters, options },
        'Error in findKYCWithFilters'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('KYCRepository:*') // Invalider le cache après mise à jour
  async updateStatus(
    kycId: string,
    status: KYCData['status'],
    reviewedAt?: Date,
    rejectionReason?: string
  ): Promise<KYCData | null> {
    try {
      const updateData: Partial<KYCData> = {
        status,
        updatedAt: new Date(),
      };
      if (reviewedAt) {
        updateData.reviewedAt = reviewedAt;
      }
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      const result = await this.update(kycId, updateData);
      if (result) {
        this.log.info({ kycId, status }, 'KYC status updated successfully');
      }
      return result;
    } catch (error) {
      this.log.error({ error, kycId, status }, 'Error in updateStatus');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('KYCRepository:*') // Invalider le cache après mise à jour
  async updateDocumentStatus(
    kycId: string,
    documentIndex: number,
    status: KYCData['documents'][0]['status'],
    reviewedAt?: Date,
    rejectionReason?: string
  ): Promise<KYCData | null> {
    try {
      const collection = await this.getCollection();
      const kyc = await collection.findOne({ _id: new ObjectId(kycId) });
      if (!kyc) {
        throw new Error('KYC not found');
      }

      const documents = kyc['documents'] || [];
      if (documentIndex < 0 || documentIndex >= documents.length) {
        throw new Error('Invalid document index');
      }

      documents[documentIndex] = {
        ...documents[documentIndex],
        status,
        reviewedAt: reviewedAt || new Date(),
        rejectionReason,
      };

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(kycId) },
        {
          $set: {
            documents,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      const mapped = result?.['value'] ? this.mapToKYC(result['value']) : null;
      if (mapped) {
        this.log.info(
          { kycId, documentIndex, status },
          'Document status updated successfully'
        );
      }
      return mapped;
    } catch (error) {
      this.log.error(
        { error, kycId, documentIndex, status },
        'Error in updateDocumentStatus'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mapper un document MongoDB vers un objet KYCData
   */
  private mapToKYC(doc: any): KYCData {
    return {
      _id: doc._id?.toString(),
      userId: doc.userId?.toString() || doc.userId,
      documents: doc.documents || [],
      status: doc.status || 'PENDING',
      submittedAt: doc.submittedAt || new Date(),
      reviewedAt: doc.reviewedAt,
      rejectionReason: doc.rejectionReason,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }
}
