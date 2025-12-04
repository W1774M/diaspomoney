/**
 * Implémentation MongoDB du repository Service
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import { mongoClient } from '@/lib/mongodb';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import { IServiceRepository, Service } from '../interfaces/IServiceRepository';

export class MongoServiceRepository implements IServiceRepository {
  private readonly collectionName = 'services';
  private readonly log = childLogger({
    component: 'MongoServiceRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  private mapToService(doc: Document): Service {
    return {
      _id: doc['_id'].toString(),
      id: doc['id'] || doc['_id'].toString(),
      category: doc['category'],
      label: doc['label'],
      description: doc['description'],
      price: doc['price'],
      isActive: doc['isActive'] ?? true,
      metadata: doc['metadata'] || {},
      associatedOptions: doc['associatedOptions'] || [],
      createdAt: doc['createdAt'] || new Date(),
      updatedAt: doc['updatedAt'] || new Date(),
    };
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceRepository:findById' })
  async findById(id: string): Promise<Service | null> {
    try {
      const collection = await this.getCollection();
      
      // Essayer d'abord par ID personnalisé
      let service = await collection.findOne({ id });
      
      // Si non trouvé et que l'ID ressemble à un ObjectId, essayer par _id
      if (!service && ObjectId.isValid(id)) {
        try {
          service = await collection.findOne({ _id: new ObjectId(id) });
        } catch (objectIdError) {
          // Si la conversion ObjectId échoue, on garde null
          this.log.debug({ id, error: objectIdError }, 'Failed to find by _id, already tried by custom id');
        }
      }
      
      return service ? this.mapToService(service) : null;
    } catch (error) {
      this.log.error({ error, id }, 'Error in findById');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceRepository:findByCustomId' })
  async findByCustomId(id: string): Promise<Service | null> {
    try {
      const collection = await this.getCollection();
      const service = await collection.findOne({ id });
      return service ? this.mapToService(service) : null;
    } catch (error) {
      this.log.error({ error, id }, 'Error in findByCustomId');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceRepository:findAll' })
  async findAll(filters?: Record<string, any>): Promise<Service[]> {
    try {
      const collection = await this.getCollection();
      const services = await collection.find(filters || {}).toArray();
      return services.map(s => this.mapToService(s));
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceRepository:findOne' })
  async findOne(filters: Record<string, any>): Promise<Service | null> {
    try {
      const collection = await this.getCollection();
      const service = await collection.findOne(filters);
      return service ? this.mapToService(service) : null;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ServiceRepository:*')
  async create(data: Partial<Service>): Promise<Service> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const serviceData: OptionalId<Document> = {
        ...data,
        _id: data._id ? new ObjectId(data._id) : new ObjectId(),
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(serviceData);
      const service = await collection.findOne({ _id: result.insertedId });
      if (!service) {
        throw new Error('Failed to create service');
      }
      return this.mapToService(service);
    } catch (error) {
      this.log.error({ error, data }, 'Error in create');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ServiceRepository:*')
  async update(id: string, data: Partial<Service>): Promise<Service> {
    try {
      const collection = await this.getCollection();
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };
      delete updateData._id;
      delete updateData.id;
      delete updateData.createdAt;
      
      // Essayer d'abord par ID personnalisé
      let result = await collection.updateOne(
        { id },
        { $set: updateData },
      );
      
      // Si aucun document mis à jour et que l'ID ressemble à un ObjectId, essayer par _id
      if (result.matchedCount === 0 && ObjectId.isValid(id)) {
        try {
          result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData },
          );
        } catch (objectIdError) {
          this.log.debug({ id, error: objectIdError }, 'Failed to update by _id, already tried by custom id');
        }
      }
      
      if (result.matchedCount === 0) {
        throw new Error('Service not found for update');
      }
      
      // Récupérer le document mis à jour - essayer d'abord par ID personnalisé
      let updated = await collection.findOne({ id });
      if (!updated && ObjectId.isValid(id)) {
        try {
          updated = await collection.findOne({ _id: new ObjectId(id) });
        } catch (_objectIdError) {
          // Ignorer l'erreur, on va vérifier si updated est null
        }
      }
      
      if (!updated) {
        throw new Error('Service not found after update');
      }
      return this.mapToService(updated);
    } catch (error) {
      this.log.error({ error, id, data }, 'Error in update');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ServiceRepository:*')
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      
      // Essayer d'abord par ID personnalisé (comme "consultation-medicale")
      let result = await collection.deleteOne({ id });
      
      // Si aucun document supprimé et que l'ID ressemble à un ObjectId, essayer par _id
      if (result.deletedCount === 0 && ObjectId.isValid(id)) {
        try {
          result = await collection.deleteOne({ _id: new ObjectId(id) });
        } catch (objectIdError) {
          // Si la conversion ObjectId échoue, on garde le résultat précédent (0 supprimé)
          this.log.debug({ id, error: objectIdError }, 'Failed to delete by _id, already tried by custom id');
        }
      }
      
      return result.deletedCount > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error in delete');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceRepository:findByCategory' })
  async findByCategory(category: 'HEALTH' | 'EDUCATION' | 'BTP'): Promise<Service[]> {
    try {
      const collection = await this.getCollection();
      const services = await collection.find({ category, isActive: true }).toArray();
      return services.map(s => this.mapToService(s));
    } catch (error) {
      this.log.error({ error, category }, 'Error in findByCategory');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceRepository:findActive' })
  async findActive(): Promise<Service[]> {
    try {
      const collection = await this.getCollection();
      const services = await collection.find({ isActive: true }).toArray();
      return services.map(s => this.mapToService(s));
    } catch (error) {
      this.log.error({ error }, 'Error in findActive');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceRepository:search' })
  async search(query: string): Promise<Service[]> {
    try {
      const collection = await this.getCollection();
      const services = await collection.find({
        $text: { $search: query },
        isActive: true,
      }).toArray();
      return services.map(s => this.mapToService(s));
    } catch (error) {
      this.log.error({ error, query }, 'Error in search');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceRepository:count' })
  async count(filters: Record<string, any> = {}): Promise<number> {
    try {
      const collection = await this.getCollection();
      return await collection.countDocuments(filters);
    } catch (error) {
      this.log.error({ error, filters }, 'Error in count');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceRepository:exists' })
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      
      // Essayer d'abord par ID personnalisé
      let count = await collection.countDocuments({ id }, { limit: 1 });
      
      // Si non trouvé et que l'ID ressemble à un ObjectId, essayer par _id
      if (count === 0 && ObjectId.isValid(id)) {
        try {
          count = await collection.countDocuments({ _id: new ObjectId(id) }, { limit: 1 });
        } catch (_objectIdError) {
          // Si la conversion ObjectId échoue, on garde 0
        }
      }
      
      return count > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error in exists');
      Sentry.captureException(error as Error);
      throw error;
    }
  }
}

