/**
 * Implémentation MongoDB du repository health provider
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
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import type {
  HealthProvider,
  HealthProviderFilters,
  IHealthProviderRepository,
} from '../interfaces/IHealthProviderRepository';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';

export class MongoHealthProviderRepository
  implements IHealthProviderRepository
{
  private readonly collectionName = 'healthProviders';
  private readonly log = childLogger({
    component: 'MongoHealthProviderRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'HealthProviderRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<HealthProvider | null> {
    try {
      const collection = await this.getCollection();
      const provider = await collection.findOne({ _id: new ObjectId(id) });
      const result = provider ? this.mapToHealthProvider(provider) : null;
      if (result) {
        this.log.debug({ providerId: id }, 'Health provider found');
      } else {
        this.log.debug({ providerId: id }, 'Health provider not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, providerId: id }, 'Error in findById');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'HealthProviderRepository:findAll' }) // Cache 5 minutes
  async findAll(filters?: Record<string, any>): Promise<HealthProvider[]> {
    try {
      const collection = await this.getCollection();
      const providers = await collection.find(filters || {}).toArray();
      const result = providers.map(p => this.mapToHealthProvider(p));
      this.log.debug(
        { count: result.length, filters },
        'Health providers found',
      );
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'HealthProviderRepository:findOne' }) // Cache 5 minutes
  async findOne(filters: Record<string, any>): Promise<HealthProvider | null> {
    try {
      const collection = await this.getCollection();
      const provider = await collection.findOne(filters);
      const result = provider ? this.mapToHealthProvider(provider) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('HealthProviderRepository:*') // Invalider le cache après création
  async create(data: Partial<HealthProvider>): Promise<HealthProvider> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const providerData: OptionalId<Document> = {
        ...data,
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(providerData);
      const provider = await collection.findOne({ _id: result.insertedId });
      if (!provider) {
        throw new Error('Failed to create health provider');
      }
      const mappedProvider = this.mapToHealthProvider(provider);
      this.log.info(
        {
          providerId: mappedProvider.id,
          name: mappedProvider.name,
          type: mappedProvider.type,
        },
        'Health provider created successfully',
      );
      return mappedProvider;
    } catch (error) {
      this.log.error(
        { error, name: data.name, type: data.type },
        'Error in create',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('HealthProviderRepository:*') // Invalider le cache après mise à jour
  async update(
    id: string,
    data: Partial<HealthProvider>,
  ): Promise<HealthProvider | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<HealthProvider> = {
        ...data,
        updatedAt: new Date(),
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' },
      );
      const updated = result?.['value']
        ? this.mapToHealthProvider(result['value'])
        : null;
      if (updated) {
        this.log.info(
          { providerId: id },
          'Health provider updated successfully',
        );
      } else {
        this.log.warn(
          { providerId: id },
          'Health provider not found for update',
        );
      }
      return updated;
    } catch (error) {
      this.log.error({ error, providerId: id }, 'Error in update');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('HealthProviderRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      const deleted = result.deletedCount > 0;
      if (deleted) {
        this.log.info(
          { providerId: id },
          'Health provider deleted successfully',
        );
      } else {
        this.log.warn(
          { providerId: id },
          'Health provider not found for deletion',
        );
      }
      return deleted;
    } catch (error) {
      this.log.error({ error, providerId: id }, 'Error in delete');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'HealthProviderRepository:count' }) // Cache 5 minutes
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments(filters || {});
      this.log.debug({ count, filters }, 'Health provider count retrieved');
      return count;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in count');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'HealthProviderRepository:exists' }) // Cache 5 minutes
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      const exists = count > 0;
      this.log.debug(
        { providerId: id, exists },
        'Health provider existence checked',
      );
      return exists;
    } catch (error) {
      this.log.error({ error, providerId: id }, 'Error in exists');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'HealthProviderRepository:findWithPagination' }) // Cache 5 minutes
  async findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<HealthProvider>> {
    try {
      const collection = await this.getCollection();
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;
      const page = options?.page || Math.floor(offset / limit) + 1;

      const query = filters || {};
      const total = await collection.countDocuments(query);

      let cursor = collection.find(query);

      if (options?.sort) {
        cursor = cursor.sort(options.sort);
      } else {
        cursor = cursor.sort({ rating: -1, name: 1 }); // Trier par note décroissante, puis par nom
      }

      cursor = cursor.skip(offset).limit(limit);

      const data = await cursor.toArray();
      const providers = data.map(doc => this.mapToHealthProvider(doc));

      const result = {
        data: providers,
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };

      this.log.debug(
        {
          count: providers.length,
          total,
          page,
          limit,
          offset,
          filters,
        },
        'Health providers paginated',
      );

      return result;
    } catch (error) {
      this.log.error(
        { error, filters, options },
        'Error in findWithPagination',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'HealthProviderRepository:findByType' }) // Cache 5 minutes
  async findByType(
    type: 'DOCTOR' | 'HOSPITAL' | 'PHARMACY' | 'CLINIC',
    options?: PaginationOptions,
  ): Promise<PaginatedResult<HealthProvider>> {
    try {
      const result = await this.findWithPagination({ type }, options);
      this.log.debug(
        { type, count: result.data.length },
        'Health providers found by type',
      );
      return result;
    } catch (error) {
      this.log.error({ error, type }, 'Error in findByType');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'HealthProviderRepository:findBySpecialty' }) // Cache 5 minutes
  async findBySpecialty(
    specialty: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<HealthProvider>> {
    try {
      const result = await this.findWithPagination(
        { specialties: { $in: [specialty] } },
        options,
      );
      this.log.debug(
        { specialty, count: result.data.length },
        'Health providers found by specialty',
      );
      return result;
    } catch (error) {
      this.log.error({ error, specialty }, 'Error in findBySpecialty');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'HealthProviderRepository:findByCity' }) // Cache 5 minutes
  async findByCity(
    city: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<HealthProvider>> {
    try {
      const result = await this.findWithPagination(
        { 'address.city': city },
        options,
      );
      this.log.debug(
        { city, count: result.data.length },
        'Health providers found by city',
      );
      return result;
    } catch (error) {
      this.log.error({ error, city }, 'Error in findByCity');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'HealthProviderRepository:findActive' }) // Cache 5 minutes
  async findActive(
    options?: PaginationOptions,
  ): Promise<PaginatedResult<HealthProvider>> {
    try {
      const result = await this.findWithPagination({ isActive: true }, options);
      this.log.debug(
        { count: result.data.length },
        'Active health providers found',
      );
      return result;
    } catch (error) {
      this.log.error({ error }, 'Error in findActive');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'HealthProviderRepository:findByMinRating' }) // Cache 5 minutes
  async findByMinRating(
    minRating: number,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<HealthProvider>> {
    try {
      const result = await this.findWithPagination(
        { rating: { $gte: minRating } },
        options,
      );
      this.log.debug(
        { minRating, count: result.data.length },
        'Health providers found by min rating',
      );
      return result;
    } catch (error) {
      this.log.error({ error, minRating }, 'Error in findByMinRating');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, {
    prefix: 'HealthProviderRepository:findProvidersWithFilters',
  }) // Cache 5 minutes
  async findProvidersWithFilters(
    filters: HealthProviderFilters,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<HealthProvider>> {
    try {
      const query: Record<string, any> = {};

      if (filters.type) {
        query['type'] = filters.type;
      }
      if (filters.specialties && filters.specialties.length > 0) {
        query['specialties'] = { $in: filters.specialties };
      }
      if (filters.city) {
        query['address.city'] = filters.city;
      }
      if (filters.country) {
        query['address.country'] = filters.country;
      }
      if (filters.languages && filters.languages.length > 0) {
        query['languages'] = { $in: filters.languages };
      }
      if (filters.isActive !== undefined) {
        query['isActive'] = filters.isActive;
      }
      if (filters.minRating !== undefined) {
        query['rating'] = { $gte: filters.minRating };
      }

      const result = await this.findWithPagination(query, options);
      this.log.debug(
        {
          count: result.data.length,
          total: result.total,
          filters,
        },
        'Health providers found with filters',
      );
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findProvidersWithFilters');
      Sentry.captureException(error);
      throw error;
    }
  }

  private mapToHealthProvider(doc: any): HealthProvider {
    return {
      id: doc._id?.toString() || doc.id,
      _id: doc._id?.toString(),
      name: doc.name,
      type: doc.type,
      specialties: doc.specialties || [],
      address: doc.address || {
        street: '',
        city: '',
        country: '',
        postalCode: '',
      },
      contact: doc.contact || {
        phone: '',
        email: '',
      },
      languages: doc.languages || [],
      rating: doc.rating || 0,
      reviewCount: doc.reviewCount || 0,
      isActive: doc.isActive !== undefined ? doc.isActive : true,
      availability: doc.availability || {},
      services: doc.services || [],
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }
}
