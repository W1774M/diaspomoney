/**
 * Implémentation MongoDB du repository ServiceOption
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import { mongoClient } from '@/lib/mongodb';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import { IServiceOptionRepository, ServiceOption } from '../interfaces/IServiceOptionRepository';

export class MongoServiceOptionRepository implements IServiceOptionRepository {
  private readonly collectionName = 'service_options';
  private readonly log = childLogger({
    component: 'MongoServiceOptionRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  private mapToServiceOption(doc: Document): ServiceOption {
    return {
      _id: doc['_id'].toString(),
      id: doc['id'] || doc['_id'].toString(),
      category: doc['category'] || undefined, // Peut être undefined
      label: doc['label'],
      description: doc['description'],
      price: doc['price'],
      optional: doc['optional'] ?? true,
      isActive: doc['isActive'] ?? true,
      metadata: doc['metadata'] || {},
      associatedServices: doc['associatedServices'] || [],
      createdAt: doc['createdAt'] || new Date(),
      updatedAt: doc['updatedAt'] || new Date(),
    };
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceOptionRepository:findById' })
  async findById(id: string): Promise<ServiceOption | null> {
    try {
      const collection = await this.getCollection();
      
      // Essayer d'abord par ID personnalisé
      let option = await collection.findOne({ id });
      
      // Si non trouvé et que l'ID ressemble à un ObjectId, essayer par _id
      if (!option && ObjectId.isValid(id)) {
        try {
          option = await collection.findOne({ _id: new ObjectId(id) });
        } catch (objectIdError) {
          // Si la conversion ObjectId échoue, on garde null
          this.log.debug({ id, error: objectIdError }, 'Failed to find by _id, already tried by custom id');
        }
      }
      
      return option ? this.mapToServiceOption(option) : null;
    } catch (error) {
      this.log.error({ error, id }, 'Error in findById');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceOptionRepository:findByCustomId' })
  async findByCustomId(id: string): Promise<ServiceOption | null> {
    try {
      const collection = await this.getCollection();
      const option = await collection.findOne({ id });
      return option ? this.mapToServiceOption(option) : null;
    } catch (error) {
      this.log.error({ error, id }, 'Error in findByCustomId');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceOptionRepository:findAll' })
  async findAll(filters?: Record<string, any>): Promise<ServiceOption[]> {
    try {
      const collection = await this.getCollection();
      const options = await collection.find(filters || {}).toArray();
      return options.map(o => this.mapToServiceOption(o));
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceOptionRepository:findOne' })
  async findOne(filters: Record<string, any>): Promise<ServiceOption | null> {
    try {
      const collection = await this.getCollection();
      const option = await collection.findOne(filters);
      return option ? this.mapToServiceOption(option) : null;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ServiceOptionRepository:*')
  async create(data: Partial<ServiceOption>): Promise<ServiceOption> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const optionData: OptionalId<Document> = {
        ...data,
        _id: data._id ? new ObjectId(data._id) : new ObjectId(),
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(optionData);
      const option = await collection.findOne({ _id: result.insertedId });
      if (!option) {
        throw new Error('Failed to create service option');
      }
      return this.mapToServiceOption(option);
    } catch (error) {
      this.log.error({ error, data }, 'Error in create');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ServiceOptionRepository:*')
  async update(id: string, data: Partial<ServiceOption>): Promise<ServiceOption> {
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
        throw new Error('Service option not found for update');
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
        throw new Error('Service option not found after update');
      }
      return this.mapToServiceOption(updated);
    } catch (error) {
      this.log.error({ error, id, data }, 'Error in update');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ServiceOptionRepository:*')
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
  @Cacheable(300, { prefix: 'ServiceOptionRepository:findByCategory' })
  async findByCategory(category: 'HEALTH' | 'EDUCATION' | 'BTP'): Promise<ServiceOption[]> {
    try {
      const collection = await this.getCollection();
      const options = await collection.find({ category, isActive: true }).toArray();
      return options.map(o => this.mapToServiceOption(o));
    } catch (error) {
      this.log.error({ error, category }, 'Error in findByCategory');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceOptionRepository:findActive' })
  async findActive(): Promise<ServiceOption[]> {
    try {
      const collection = await this.getCollection();
      const options = await collection.find({ isActive: true }).toArray();
      return options.map(o => this.mapToServiceOption(o));
    } catch (error) {
      this.log.error({ error }, 'Error in findActive');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceOptionRepository:search' })
  async search(query: string): Promise<ServiceOption[]> {
    try {
      const collection = await this.getCollection();
      const options = await collection.find({
        $text: { $search: query },
        isActive: true,
      }).toArray();
      return options.map(o => this.mapToServiceOption(o));
    } catch (error) {
      this.log.error({ error, query }, 'Error in search');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ServiceOptionRepository:*')
  @InvalidateCache('ServiceRepository:*')
  async associateToService(optionId: string, serviceId: string): Promise<void> {
    try {
      const collection = await this.getCollection();
      const serviceCollection = await (await mongoClient).db().collection('services');
      
      // Ajouter le service à la liste des services associés de l'option
      await collection.updateOne(
        { id: optionId },
        { 
          $addToSet: { associatedServices: serviceId },
          $set: { updatedAt: new Date() },
        },
      );
      
      // Ajouter l'option à la liste des options associées du service
      await serviceCollection.updateOne(
        { id: serviceId },
        { 
          $addToSet: { associatedOptions: optionId },
          $set: { updatedAt: new Date() },
        },
      );
    } catch (error) {
      this.log.error({ error, optionId, serviceId }, 'Error in associateToService');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ServiceOptionRepository:*')
  @InvalidateCache('ServiceRepository:*')
  async dissociateFromService(optionId: string, serviceId: string): Promise<void> {
    try {
      const collection = await this.getCollection();
      const serviceCollection = await (await mongoClient).db().collection('services');
      
      // Retirer le service de la liste des services associés de l'option
      await collection.updateOne(
        { id: optionId },
        { 
          $pull: { associatedServices: serviceId } as any,
          $set: { updatedAt: new Date() },
        },
      );
      
      // Retirer l'option de la liste des options associées du service
      await serviceCollection.updateOne(
        { id: serviceId },
        { 
          $pull: { associatedOptions: optionId } as any,
          $set: { updatedAt: new Date() },
        },
      );
    } catch (error) {
      this.log.error({ error, optionId, serviceId }, 'Error in dissociateFromService');
      Sentry.captureException(error as Error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ServiceOptionRepository:count' })
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
  @Cacheable(300, { prefix: 'ServiceOptionRepository:exists' })
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

