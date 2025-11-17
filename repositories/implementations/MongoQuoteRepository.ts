/**
 * Implémentation MongoDB du repository devis
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
import { mongoClient } from '@/lib/mongodb';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import { IQuoteRepository, Quote } from '../interfaces/IQuoteRepository';

export class MongoQuoteRepository implements IQuoteRepository {
  private readonly collectionName = 'quotes';
  private readonly log = childLogger({
    component: 'MongoQuoteRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  private mapToQuote(doc: Document): Quote {
    return {
      _id: doc['_id'].toString(),
      id: doc['_id'].toString(),
      type: doc['type'],
      projectType: doc['projectType'],
      area: doc['area'],
      features: doc['features'] || [],
      budget: doc['budget'],
      timeline: doc['timeline'],
      location: doc['location'],
      contact: doc['contact'],
      description: doc['description'],
      urgency: doc['urgency'],
      costEstimate: doc['costEstimate'],
      status: doc['status'] || 'PENDING',
      providerId: doc['providerId'],
      schoolId: doc['schoolId'],
      studentType: doc['studentType'],
      studentInfo: doc['studentInfo'],
      academicInfo: doc['academicInfo'],
      preferences: doc['preferences'],
      questions: doc['questions'],
      createdAt: doc['createdAt'] || new Date(),
      updatedAt: doc['updatedAt'] || new Date(),
    };
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'QuoteRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<Quote | null> {
    try {
      const collection = await this.getCollection();
      const quote = await collection.findOne({ _id: new ObjectId(id) });
      const result = quote ? this.mapToQuote(quote) : null;
      if (result) {
        this.log.debug({ quoteId: id }, 'Quote found');
      } else {
        this.log.debug({ quoteId: id }, 'Quote not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, id }, 'Error in findById');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoQuoteRepository', action: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'QuoteRepository:findAll' }) // Cache 5 minutes
  async findAll(filters?: Record<string, any>): Promise<Quote[]> {
    try {
      const collection = await this.getCollection();
      const quotes = await collection.find(filters || {}).toArray();
      const result = quotes.map(q => this.mapToQuote(q));
      this.log.debug({ count: result.length, filters }, 'Quotes found');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoQuoteRepository', action: 'findAll' },
        extra: { filters },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'QuoteRepository:findOne' }) // Cache 5 minutes
  async findOne(filters: Record<string, any>): Promise<Quote | null> {
    try {
      const collection = await this.getCollection();
      const quote = await collection.findOne(filters);
      const result = quote ? this.mapToQuote(quote) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoQuoteRepository', action: 'findOne' },
        extra: { filters },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('QuoteRepository:*') // Invalider le cache après création
  async create(data: Partial<Quote>): Promise<Quote> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const quoteData: OptionalId<
        Document & { _id?: string | ObjectId | undefined }
      > = {
        ...data,
        status: data.status || 'PENDING',
        createdAt: now,
        updatedAt: now,
        ...(data._id ? { _id: new ObjectId(data._id) } : {}),
      };
      const result = await collection.insertOne(
        quoteData as OptionalId<Document>,
      );
      const quote = await collection.findOne({ _id: result.insertedId });
      if (!quote) {
        throw new Error('Failed to create quote');
      }
      const mappedQuote = this.mapToQuote(quote);
      this.log.info(
        { quoteId: mappedQuote.id, type: mappedQuote.type },
        'Quote created successfully',
      );
      return mappedQuote;
    } catch (error) {
      this.log.error({ error, type: data.type }, 'Error in create');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoQuoteRepository', action: 'create' },
        extra: { type: data.type },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('QuoteRepository:*') // Invalider le cache après mise à jour
  async update(id: string, data: Partial<Quote>): Promise<Quote | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<Quote> = {
        ...data,
        updatedAt: new Date(),
      };
      // Exclure _id, createdAt de la mise à jour
      delete updateData._id;
      delete updateData.createdAt;

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' },
      );
      return result?.['value'] ? this.mapToQuote(result['value']) : null;
    } catch (error) {
      this.log.error({ error, id, data }, 'Error in update');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoQuoteRepository', action: 'update' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('QuoteRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error in delete');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoQuoteRepository', action: 'delete' },
        extra: { id },
      });
      throw error;
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      return await collection.countDocuments(filters || {});
    } catch (error) {
      this.log.error({ error, filters }, 'Error in count');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoQuoteRepository', action: 'count' },
        extra: { filters },
      });
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      return count > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error in exists');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoQuoteRepository', action: 'exists' },
        extra: { id },
      });
      throw error;
    }
  }

  async findByType(type: 'BTP' | 'EDUCATION'): Promise<Quote[]> {
    try {
      return await this.findAll({ type });
    } catch (error) {
      this.log.error({ error, type }, 'Error in findByType');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoQuoteRepository', action: 'findByType' },
        extra: { type },
      });
      throw error;
    }
  }

  async findByStatus(
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED',
  ): Promise<Quote[]> {
    try {
      return await this.findAll({ status });
    } catch (error) {
      this.log.error({ error, status }, 'Error in findByStatus');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoQuoteRepository', action: 'findByStatus' },
        extra: { status },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'QuoteRepository:findByContactEmail' }) // Cache 5 minutes
  async findByContactEmail(email: string): Promise<Quote[]> {
    try {
      return await this.findAll({ 'contact.email': email });
    } catch (error) {
      this.log.error({ error, email }, 'Error in findByContactEmail');
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoQuoteRepository',
          action: 'findByContactEmail',
        },
        extra: { email },
      });
      throw error;
    }
  }
}
