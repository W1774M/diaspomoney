/**
 * Implémentation MongoDB du repository prescription
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
  IPrescriptionRepository,
  Prescription,
  PrescriptionFilters,
} from '../interfaces/IPrescriptionRepository';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';

export class MongoPrescriptionRepository implements IPrescriptionRepository {
  private readonly collectionName = 'prescriptions';
  private readonly log = childLogger({
    component: 'MongoPrescriptionRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PrescriptionRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<Prescription | null> {
    try {
      const collection = await this.getCollection();
      const prescription = await collection.findOne({ _id: new ObjectId(id) });
      const result = prescription ? this.mapToPrescription(prescription) : null;
      if (result) {
        this.log.debug({ prescriptionId: id }, 'Prescription found');
      } else {
        this.log.debug({ prescriptionId: id }, 'Prescription not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, prescriptionId: id }, 'Error in findById');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PrescriptionRepository:findAll' }) // Cache 5 minutes
  async findAll(filters?: Record<string, any>): Promise<Prescription[]> {
    try {
      const collection = await this.getCollection();
      const prescriptions = await collection.find(filters || {}).toArray();
      const result = prescriptions.map(p => this.mapToPrescription(p));
      this.log.debug({ count: result.length, filters }, 'Prescriptions found');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PrescriptionRepository:findOne' }) // Cache 5 minutes
  async findOne(filters: Record<string, any>): Promise<Prescription | null> {
    try {
      const collection = await this.getCollection();
      const prescription = await collection.findOne(filters);
      const result = prescription ? this.mapToPrescription(prescription) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('PrescriptionRepository:*') // Invalider le cache après création
  async create(data: Partial<Prescription>): Promise<Prescription> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const prescriptionData: OptionalId<Document> = {
        ...data,
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(prescriptionData);
      const prescription = await collection.findOne({ _id: result.insertedId });
      if (!prescription) {
        throw new Error('Failed to create prescription');
      }
      const mappedPrescription = this.mapToPrescription(prescription);
      this.log.info(
        {
          prescriptionId: mappedPrescription.id,
          appointmentId: mappedPrescription.appointmentId,
        },
        'Prescription created successfully'
      );
      return mappedPrescription;
    } catch (error) {
      this.log.error(
        { error, appointmentId: data.appointmentId },
        'Error in create'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('PrescriptionRepository:*') // Invalider le cache après mise à jour
  async update(
    id: string,
    data: Partial<Prescription>
  ): Promise<Prescription | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<Prescription> = {
        ...data,
        updatedAt: new Date(),
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      const updated = result?.['value']
        ? this.mapToPrescription(result['value'])
        : null;
      if (updated) {
        this.log.info(
          { prescriptionId: id },
          'Prescription updated successfully'
        );
      } else {
        this.log.warn(
          { prescriptionId: id },
          'Prescription not found for update'
        );
      }
      return updated;
    } catch (error) {
      this.log.error({ error, prescriptionId: id }, 'Error in update');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('PrescriptionRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      const deleted = result.deletedCount > 0;
      if (deleted) {
        this.log.info(
          { prescriptionId: id },
          'Prescription deleted successfully'
        );
      } else {
        this.log.warn(
          { prescriptionId: id },
          'Prescription not found for deletion'
        );
      }
      return deleted;
    } catch (error) {
      this.log.error({ error, prescriptionId: id }, 'Error in delete');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PrescriptionRepository:count' }) // Cache 5 minutes
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments(filters || {});
      this.log.debug({ count, filters }, 'Prescription count retrieved');
      return count;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in count');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PrescriptionRepository:exists' }) // Cache 5 minutes
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      const exists = count > 0;
      this.log.debug(
        { prescriptionId: id, exists },
        'Prescription existence checked'
      );
      return exists;
    } catch (error) {
      this.log.error({ error, prescriptionId: id }, 'Error in exists');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PrescriptionRepository:findWithPagination' }) // Cache 5 minutes
  async findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prescription>> {
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
        cursor = cursor.sort({ issuedAt: -1 });
      }

      cursor = cursor.skip(offset).limit(limit);

      const data = await cursor.toArray();
      const prescriptions = data.map(doc => this.mapToPrescription(doc));

      const result = {
        data: prescriptions,
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };

      this.log.debug(
        {
          count: prescriptions.length,
          total,
          page,
          limit,
          offset,
          filters,
        },
        'Prescriptions paginated'
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
  @Cacheable(300, { prefix: 'PrescriptionRepository:findByAppointment' }) // Cache 5 minutes
  async findByAppointment(
    appointmentId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prescription>> {
    try {
      const result = await this.findWithPagination({ appointmentId }, options);
      this.log.debug(
        { appointmentId, count: result.data.length },
        'Prescriptions found by appointment'
      );
      return result;
    } catch (error) {
      this.log.error({ error, appointmentId }, 'Error in findByAppointment');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PrescriptionRepository:findByIssuer' }) // Cache 5 minutes
  async findByIssuer(
    issuedBy: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prescription>> {
    try {
      const result = await this.findWithPagination({ issuedBy }, options);
      this.log.debug(
        { issuedBy, count: result.data.length },
        'Prescriptions found by issuer'
      );
      return result;
    } catch (error) {
      this.log.error({ error, issuedBy }, 'Error in findByIssuer');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PrescriptionRepository:findValid' }) // Cache 5 minutes
  async findValid(
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prescription>> {
    try {
      const now = new Date();
      const result = await this.findWithPagination(
        { validUntil: { $gte: now } },
        options
      );
      this.log.debug(
        { count: result.data.length },
        'Valid prescriptions found'
      );
      return result;
    } catch (error) {
      this.log.error({ error }, 'Error in findValid');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PrescriptionRepository:findExpired' }) // Cache 5 minutes
  async findExpired(
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prescription>> {
    try {
      const now = new Date();
      const result = await this.findWithPagination(
        { validUntil: { $lt: now } },
        options
      );
      this.log.debug(
        { count: result.data.length },
        'Expired prescriptions found'
      );
      return result;
    } catch (error) {
      this.log.error({ error }, 'Error in findExpired');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, {
    prefix: 'PrescriptionRepository:findPrescriptionsWithFilters',
  }) // Cache 5 minutes
  async findPrescriptionsWithFilters(
    filters: PrescriptionFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prescription>> {
    try {
      const query: Record<string, any> = {};

      if (filters.appointmentId) {
        query['appointmentId'] = filters.appointmentId;
      }
      if (filters.issuedBy) {
        query['issuedBy'] = filters.issuedBy;
      }
      if (filters.validUntilFrom || filters.validUntilTo) {
        query['validUntil'] = {};
        if (filters.validUntilFrom) {
          query['validUntil'].$gte = filters.validUntilFrom;
        }
        if (filters.validUntilTo) {
          query['validUntil'].$lte = filters.validUntilTo;
        }
      }
      if (filters.issuedAtFrom || filters.issuedAtTo) {
        query['issuedAt'] = {};
        if (filters.issuedAtFrom) {
          query['issuedAt'].$gte = filters.issuedAtFrom;
        }
        if (filters.issuedAtTo) {
          query['issuedAt'].$lte = filters.issuedAtTo;
        }
      }

      const result = await this.findWithPagination(query, options);
      this.log.debug(
        {
          count: result.data.length,
          total: result.total,
          filters,
        },
        'Prescriptions found with filters'
      );
      return result;
    } catch (error) {
      this.log.error(
        { error, filters },
        'Error in findPrescriptionsWithFilters'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  private mapToPrescription(doc: any): Prescription {
    return {
      id: doc._id?.toString() || doc.id,
      _id: doc._id?.toString(),
      appointmentId: doc.appointmentId,
      medications: doc.medications || [],
      instructions: doc.instructions,
      validUntil: doc.validUntil,
      issuedAt: doc.issuedAt,
      issuedBy: doc.issuedBy,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }
}
