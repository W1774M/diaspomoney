/**
 * Implémentation MongoDB du repository spécialité
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
import { ISpeciality } from '@/types';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import { ISpecialityRepository } from '../interfaces/ISpecialityRepository';

export class MongoSpecialityRepository implements ISpecialityRepository {
  private readonly collectionName = 'specialitytypes';
  private readonly log = childLogger({
    component: 'MongoSpecialityRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  private mapToSpeciality(doc: Document): ISpeciality {
    return {
      _id: doc['_id'].toString(),
      name: doc['name'],
      description: doc['description'],
      group: doc['group'],
      isActive: doc['isActive'] ?? true,
      createdAt: doc['createdAt'] || new Date(),
      updatedAt: doc['updatedAt'] || new Date(),
    };
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'SpecialityRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<ISpeciality | null> {
    try {
      const collection = await this.getCollection();
      const speciality = await collection.findOne({ _id: new ObjectId(id) });
      const result = speciality ? this.mapToSpeciality(speciality) : null;
      if (result) {
        this.log.debug({ specialityId: id }, 'Speciality found');
      } else {
        this.log.debug({ specialityId: id }, 'Speciality not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, id }, 'Error in findById');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoSpecialityRepository', action: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'SpecialityRepository:findAll' }) // Cache 5 minutes
  async findAll(filters?: Record<string, any>): Promise<ISpeciality[]> {
    try {
      const collection = await this.getCollection();
      const specialities = await collection.find(filters || {}).toArray();
      const result = specialities.map(s => this.mapToSpeciality(s));
      this.log.debug({ count: result.length, filters }, 'Specialities found');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoSpecialityRepository', action: 'findAll' },
        extra: { filters },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'SpecialityRepository:findOne' }) // Cache 5 minutes
  async findOne(filters: Record<string, any>): Promise<ISpeciality | null> {
    try {
      const collection = await this.getCollection();
      const speciality = await collection.findOne(filters);
      const result = speciality ? this.mapToSpeciality(speciality) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoSpecialityRepository', action: 'findOne' },
        extra: { filters },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('SpecialityRepository:*') // Invalider le cache après création
  async create(data: Partial<ISpeciality>): Promise<ISpeciality> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const specialityData: OptionalId<Document> = {
        name: data.name!,
        description: data.description!,
        group: data.group!,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
        ...(data._id ? { _id: new ObjectId(data._id) } : {}),
      };
      const result = await collection.insertOne(specialityData);
      const speciality = await collection.findOne({ _id: result.insertedId });
      if (!speciality) {
        throw new Error('Failed to create speciality');
      }
      const mappedSpeciality = this.mapToSpeciality(speciality);
      this.log.info(
        { specialityId: mappedSpeciality._id, name: mappedSpeciality.name },
        'Speciality created successfully',
      );
      return mappedSpeciality;
    } catch (error) {
      this.log.error({ error, name: data.name }, 'Error in create');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoSpecialityRepository', action: 'create' },
        extra: { name: data.name },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('SpecialityRepository:*') // Invalider le cache après mise à jour
  async update(
    id: string,
    data: Partial<ISpeciality>,
  ): Promise<ISpeciality | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<ISpeciality> = {
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
      return result?.['value'] ? this.mapToSpeciality(result['value']) : null;
    } catch (error) {
      this.log.error({ error, id, data }, 'Error in update');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoSpecialityRepository', action: 'update' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('SpecialityRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error in delete');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoSpecialityRepository', action: 'delete' },
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
        tags: { component: 'MongoSpecialityRepository', action: 'count' },
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
        tags: { component: 'MongoSpecialityRepository', action: 'exists' },
        extra: { id },
      });
      throw error;
    }
  }

  async findByName(name: string): Promise<ISpeciality | null> {
    try {
      return await this.findOne({ name });
    } catch (error) {
      this.log.error({ error, name }, 'Error in findByName');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoSpecialityRepository', action: 'findByName' },
        extra: { name },
      });
      throw error;
    }
  }

  async findByGroup(group: string): Promise<ISpeciality[]> {
    try {
      return await this.findAll({ group });
    } catch (error) {
      this.log.error({ error, group }, 'Error in findByGroup');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoSpecialityRepository', action: 'findByGroup' },
        extra: { group },
      });
      throw error;
    }
  }

  async findActive(): Promise<ISpeciality[]> {
    try {
      return await this.findAll({ isActive: true });
    } catch (error) {
      this.log.error({ error }, 'Error in findActive');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoSpecialityRepository', action: 'findActive' },
      });
      throw error;
    }
  }
}
