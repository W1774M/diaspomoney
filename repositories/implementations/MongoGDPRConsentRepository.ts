/**
 * Implémentation MongoDB du repository pour les consentements GDPR
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
import type { GDPRConsent } from '@/types/gdpr';
import * as Sentry from '@sentry/nextjs';
import { ObjectId } from 'mongodb';
import type {
  GDPRConsentQuery,
  IGDPRConsentRepository,
} from '../interfaces/IGDPRConsentRepository';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';

export class MongoGDPRConsentRepository implements IGDPRConsentRepository {
  private readonly collectionName = 'gdpr_consents';
  private readonly log = childLogger({
    component: 'MongoGDPRConsentRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('GDPRConsentRepository')
  async create(data: Partial<GDPRConsent>): Promise<GDPRConsent> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const document = {
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        id: data.id || new ObjectId().toString(),
        userId: data.userId || '',
        purpose: data.purpose || '',
        granted: data.granted ?? true,
        grantedAt: data.grantedAt || now,
        withdrawnAt: data.withdrawnAt || null,
        legalBasis: data.legalBasis || 'CONSENT',
        dataCategories: data.dataCategories || [],
        retentionPeriod: data.retentionPeriod || 365,
        isActive: data.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      };

      await collection.insertOne(document);

      const createdConsent: GDPRConsent = {
        id: document.id,
        userId: document.userId,
        purpose: document.purpose,
        granted: document.granted,
        grantedAt: document.grantedAt,
        withdrawnAt: document.withdrawnAt || new Date(),
        legalBasis: document.legalBasis as GDPRConsent['legalBasis'],
        dataCategories: document.dataCategories,
        retentionPeriod: document.retentionPeriod,
        isActive: document.isActive,
      };

      this.log.debug(
        { consentId: createdConsent.id, userId: createdConsent.userId },
        'GDPR consent created',
      );

      return createdConsent;
    } catch (error) {
      this.log.error({ error, data }, 'Error creating GDPR consent');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoGDPRConsentRepository',
          action: 'create',
        },
        extra: { data },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'GDPRConsentRepository:findById' })
  async findById(id: string): Promise<GDPRConsent | null> {
    try {
      const collection = await this.getCollection();
      const document = await collection.findOne({
        $or: [{ _id: new ObjectId(id) }, { id }],
      });

      if (!document) {
        return null;
      }

      return this.mapToGDPRConsent(document);
    } catch (error) {
      this.log.error({ error, id }, 'Error finding GDPR consent by id');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoGDPRConsentRepository',
          action: 'findById',
        },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'GDPRConsentRepository:findAll' })
  async findAll(filter: Record<string, any> = {}): Promise<GDPRConsent[]> {
    try {
      const collection = await this.getCollection();
      const documents = await collection.find(filter).toArray();
      return documents.map(doc => this.mapToGDPRConsent(doc));
    } catch (error) {
      this.log.error({ error, filter }, 'Error finding GDPR consents');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoGDPRConsentRepository',
          action: 'findAll',
        },
        extra: { filter },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'GDPRConsentRepository:findOne' })
  async findOne(filter: Record<string, any>): Promise<GDPRConsent | null> {
    try {
      const collection = await this.getCollection();
      const document = await collection.findOne(filter);
      return document ? this.mapToGDPRConsent(document) : null;
    } catch (error) {
      this.log.error({ error, filter }, 'Error finding GDPR consent');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoGDPRConsentRepository',
          action: 'findOne',
        },
        extra: { filter },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'GDPRConsentRepository:count' })
  async count(filter: Record<string, any> = {}): Promise<number> {
    try {
      const collection = await this.getCollection();
      return await collection.countDocuments(filter);
    } catch (error) {
      this.log.error({ error, filter }, 'Error counting GDPR consents');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoGDPRConsentRepository',
          action: 'count',
        },
        extra: { filter },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'GDPRConsentRepository:exists' })
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({
        $or: [{ _id: new ObjectId(id) }, { id }],
      });
      return count > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error checking GDPR consent existence');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoGDPRConsentRepository',
          action: 'exists',
        },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('GDPRConsentRepository')
  async update(
    id: string,
    data: Partial<GDPRConsent>,
  ): Promise<GDPRConsent | null> {
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

      return this.mapToGDPRConsent(result);
    } catch (error) {
      this.log.error({ error, id, data }, 'Error updating GDPR consent');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoGDPRConsentRepository',
          action: 'update',
        },
        extra: { id, data },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('GDPRConsentRepository')
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({
        $or: [{ _id: new ObjectId(id) }, { id }],
      });

      return result.deletedCount > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error deleting GDPR consent');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoGDPRConsentRepository',
          action: 'delete',
        },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'GDPRConsentRepository:findWithPagination' })
  async findWithPagination(
    filter: Record<string, any> = {},
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<GDPRConsent>> {
    try {
      const collection = await this.getCollection();
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const page = options.page || Math.floor(offset / limit) + 1;

      const total = await collection.countDocuments(filter);

      const sort = options.sort || { grantedAt: -1 };
      const documents = await collection
        .find(filter)
        .sort(sort as Record<string, 1 | -1>)
        .skip(offset)
        .limit(limit)
        .toArray();

      const data = documents.map(doc => this.mapToGDPRConsent(doc));

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
        'Error finding GDPR consents with pagination',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoGDPRConsentRepository',
          action: 'findWithPagination',
        },
        extra: { filter, options },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'GDPRConsentRepository:searchConsents' })
  async searchConsents(
    query: GDPRConsentQuery,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<GDPRConsent>> {
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

      if (query.isActive !== undefined) {
        mongoQuery['isActive'] = query.isActive;
      }

      if (query.granted !== undefined) {
        mongoQuery['granted'] = query.granted;
      }

      if (query.dateFrom || query.dateTo) {
        mongoQuery['grantedAt'] = {};
        if (query.dateFrom) {
          mongoQuery['grantedAt'].$gte = query.dateFrom;
        }
        if (query.dateTo) {
          mongoQuery['grantedAt'].$lte = query.dateTo;
        }
      }

      const paginationOptions: PaginationOptions = {
        limit: (query as any)['limit'] || options?.limit || 50,
        offset: (query as any)['offset'] || options?.offset || 0,
        sort: options?.sort || { grantedAt: -1 },
      };

      return this.findWithPagination(mongoQuery, paginationOptions);
    } catch (error) {
      this.log.error({ error, query }, 'Error searching GDPR consents');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoGDPRConsentRepository',
          action: 'searchConsents',
        },
        extra: { query },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'GDPRConsentRepository:findActiveByUserId' })
  async findActiveByUserId(
    userId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<GDPRConsent>> {
    try {
      return this.findWithPagination(
        { userId, isActive: true },
        options || { sort: { grantedAt: -1 } },
      );
    } catch (error) {
      this.log.error(
        { error, userId },
        'Error finding active consents by userId',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoGDPRConsentRepository',
          action: 'findActiveByUserId',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('GDPRConsentRepository')
  async withdrawConsent(
    consentId: string,
    userId: string,
    reason?: string,
  ): Promise<GDPRConsent | null> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const updateData: Record<string, any> = {
        isActive: false,
        granted: false,
        withdrawnAt: now,
        updatedAt: now,
      };

      // Ajouter la raison du retrait si fournie
      if (reason) {
        updateData['withdrawalReason'] = reason;
      }

      const result = await collection.findOneAndUpdate(
        {
          $or: [{ _id: new ObjectId(consentId) }, { id: consentId }],
          userId,
        },
        {
          $set: updateData,
        },
        { returnDocument: 'after' },
      );

      if (!result) {
        return null;
      }

      return this.mapToGDPRConsent(result);
    } catch (error) {
      this.log.error(
        { error, consentId, userId, reason },
        'Error withdrawing GDPR consent',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoGDPRConsentRepository',
          action: 'withdrawConsent',
        },
        extra: { consentId, userId, reason },
      });
      throw error;
    }
  }

  /**
   * Mapper un document MongoDB vers un objet GDPRConsent
   */
  private mapToGDPRConsent(doc: any): GDPRConsent {
    return {
      id: doc.id || doc._id?.toString() || '',
      userId: doc.userId || '',
      purpose: doc.purpose || '',
      granted: doc.granted ?? true,
      grantedAt: doc.grantedAt ? new Date(doc.grantedAt) : new Date(),
      withdrawnAt: doc.withdrawnAt ? new Date(doc.withdrawnAt) : new Date(),
      legalBasis: doc.legalBasis || 'CONSENT',
      dataCategories: doc.dataCategories || [],
      retentionPeriod: doc.retentionPeriod || 365,
      isActive: doc.isActive ?? true,
    };
  }
}
