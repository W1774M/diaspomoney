/**
 * Implémentation MongoDB du repository téléconsultation
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
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';
import type {
  ITeleconsultationRepository,
  Teleconsultation,
  TeleconsultationFilters,
  TeleconsultationStatus,
} from '../interfaces/ITeleconsultationRepository';

export class MongoTeleconsultationRepository
  implements ITeleconsultationRepository
{
  private readonly collectionName = 'teleconsultations';
  private readonly log = childLogger({
    component: 'MongoTeleconsultationRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TeleconsultationRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<Teleconsultation | null> {
    try {
      const collection = await this.getCollection();
      const teleconsultation = await collection.findOne({
        _id: new ObjectId(id),
      });
      const result = teleconsultation
        ? this.mapToTeleconsultation(teleconsultation)
        : null;
      if (result) {
        this.log.debug({ teleconsultationId: id }, 'Teleconsultation found');
      } else {
        this.log.debug(
          { teleconsultationId: id },
          'Teleconsultation not found'
        );
      }
      return result;
    } catch (error) {
      this.log.error({ error, teleconsultationId: id }, 'Error in findById');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TeleconsultationRepository:findAll' }) // Cache 5 minutes
  async findAll(filters?: Record<string, any>): Promise<Teleconsultation[]> {
    try {
      const collection = await this.getCollection();
      const teleconsultations = await collection.find(filters || {}).toArray();
      const result = teleconsultations.map(t => this.mapToTeleconsultation(t));
      this.log.debug(
        { count: result.length, filters },
        'Teleconsultations found'
      );
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TeleconsultationRepository:findOne' }) // Cache 5 minutes
  async findOne(
    filters: Record<string, any>
  ): Promise<Teleconsultation | null> {
    try {
      const collection = await this.getCollection();
      const teleconsultation = await collection.findOne(filters);
      const result = teleconsultation
        ? this.mapToTeleconsultation(teleconsultation)
        : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('TeleconsultationRepository:*') // Invalider le cache après création
  async create(data: Partial<Teleconsultation>): Promise<Teleconsultation> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const teleconsultationData: OptionalId<Document> = {
        ...data,
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(teleconsultationData);
      const teleconsultation = await collection.findOne({
        _id: result.insertedId,
      });
      if (!teleconsultation) {
        throw new Error('Failed to create teleconsultation');
      }
      const mappedTeleconsultation =
        this.mapToTeleconsultation(teleconsultation);
      this.log.info(
        {
          teleconsultationId: mappedTeleconsultation.id,
          appointmentId: mappedTeleconsultation.appointmentId,
          status: mappedTeleconsultation.status,
        },
        'Teleconsultation created successfully'
      );
      return mappedTeleconsultation;
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
  @InvalidateCache('TeleconsultationRepository:*') // Invalider le cache après mise à jour
  async update(
    id: string,
    data: Partial<Teleconsultation>
  ): Promise<Teleconsultation | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<Teleconsultation> = {
        ...data,
        updatedAt: new Date(),
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      const updated = result?.['value']
        ? this.mapToTeleconsultation(result['value'])
        : null;
      if (updated) {
        this.log.info(
          { teleconsultationId: id },
          'Teleconsultation updated successfully'
        );
      } else {
        this.log.warn(
          { teleconsultationId: id },
          'Teleconsultation not found for update'
        );
      }
      return updated;
    } catch (error) {
      this.log.error({ error, teleconsultationId: id }, 'Error in update');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('TeleconsultationRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      const deleted = result.deletedCount > 0;
      if (deleted) {
        this.log.info(
          { teleconsultationId: id },
          'Teleconsultation deleted successfully'
        );
      } else {
        this.log.warn(
          { teleconsultationId: id },
          'Teleconsultation not found for deletion'
        );
      }
      return deleted;
    } catch (error) {
      this.log.error({ error, teleconsultationId: id }, 'Error in delete');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TeleconsultationRepository:count' }) // Cache 5 minutes
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments(filters || {});
      this.log.debug({ count, filters }, 'Teleconsultation count retrieved');
      return count;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in count');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TeleconsultationRepository:exists' }) // Cache 5 minutes
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      const exists = count > 0;
      this.log.debug(
        { teleconsultationId: id, exists },
        'Teleconsultation existence checked'
      );
      return exists;
    } catch (error) {
      this.log.error({ error, teleconsultationId: id }, 'Error in exists');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TeleconsultationRepository:findWithPagination' }) // Cache 5 minutes
  async findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Teleconsultation>> {
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
        cursor = cursor.sort({ createdAt: -1 });
      }

      cursor = cursor.skip(offset).limit(limit);

      const data = await cursor.toArray();
      const teleconsultations = data.map(doc =>
        this.mapToTeleconsultation(doc)
      );

      const result = {
        data: teleconsultations,
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };

      this.log.debug(
        {
          count: teleconsultations.length,
          total,
          page,
          limit,
          offset,
          filters,
        },
        'Teleconsultations paginated'
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
  @Cacheable(300, { prefix: 'TeleconsultationRepository:findByAppointment' }) // Cache 5 minutes
  async findByAppointment(
    appointmentId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Teleconsultation>> {
    try {
      const result = await this.findWithPagination({ appointmentId }, options);
      this.log.debug(
        { appointmentId, count: result.data.length },
        'Teleconsultations found by appointment'
      );
      return result;
    } catch (error) {
      this.log.error({ error, appointmentId }, 'Error in findByAppointment');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TeleconsultationRepository:findByStatus' }) // Cache 5 minutes
  async findByStatus(
    status: TeleconsultationStatus,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Teleconsultation>> {
    try {
      const result = await this.findWithPagination({ status }, options);
      this.log.debug(
        { status, count: result.data.length },
        'Teleconsultations found by status'
      );
      return result;
    } catch (error) {
      this.log.error({ error, status }, 'Error in findByStatus');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TeleconsultationRepository:findActive' }) // Cache 5 minutes
  async findActive(
    options?: PaginationOptions
  ): Promise<PaginatedResult<Teleconsultation>> {
    try {
      const result = await this.findWithPagination(
        { status: { $in: ['WAITING', 'ACTIVE'] } },
        options
      );
      this.log.debug(
        { count: result.data.length },
        'Active teleconsultations found'
      );
      return result;
    } catch (error) {
      this.log.error({ error }, 'Error in findActive');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('TeleconsultationRepository:*') // Invalider le cache après mise à jour du statut
  async updateStatus(
    teleconsultationId: string,
    status: TeleconsultationStatus
  ): Promise<boolean> {
    try {
      const result = await this.update(teleconsultationId, {
        status,
      } as Partial<Teleconsultation>);
      const updated = result !== null;
      if (updated) {
        this.log.info(
          { teleconsultationId, status },
          'Teleconsultation status updated successfully'
        );
      } else {
        this.log.warn(
          { teleconsultationId, status },
          'Teleconsultation not found for status update'
        );
      }
      return updated;
    } catch (error) {
      this.log.error(
        { error, teleconsultationId, status },
        'Error in updateStatus'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('TeleconsultationRepository:*') // Invalider le cache après fin de téléconsultation
  async endTeleconsultation(
    teleconsultationId: string
  ): Promise<Teleconsultation | null> {
    try {
      // Récupérer la téléconsultation pour obtenir startedAt
      const teleconsultation = await this.findById(teleconsultationId);
      if (!teleconsultation || !teleconsultation.startedAt) {
        this.log.warn(
          { teleconsultationId },
          'Teleconsultation not found or not started'
        );
        return null;
      }

      // Calculer la durée en minutes
      const endedAt = new Date();
      const duration = Math.floor(
        (endedAt.getTime() - teleconsultation.startedAt.getTime()) / (1000 * 60)
      );

      // Mettre à jour la téléconsultation
      const result = await this.update(teleconsultationId, {
        status: 'ENDED',
        endedAt,
        duration,
      } as Partial<Teleconsultation>);

      if (result) {
        this.log.info(
          {
            teleconsultationId,
            duration,
            appointmentId: result.appointmentId,
          },
          'Teleconsultation ended successfully'
        );
      }

      return result;
    } catch (error) {
      this.log.error(
        { error, teleconsultationId },
        'Error in endTeleconsultation'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, {
    prefix: 'TeleconsultationRepository:findTeleconsultationsWithFilters',
  }) // Cache 5 minutes
  async findTeleconsultationsWithFilters(
    filters: TeleconsultationFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Teleconsultation>> {
    try {
      const query: Record<string, any> = {};

      if (filters.appointmentId) {
        query['appointmentId'] = filters.appointmentId;
      }
      if (filters.status) {
        query['status'] = filters.status;
      }
      if (filters.dateFrom || filters.dateTo) {
        query['createdAt'] = {};
        if (filters.dateFrom) {
          query['createdAt'].$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          query['createdAt'].$lte = filters.dateTo;
        }
      }

      const result = await this.findWithPagination(query, options);
      this.log.debug(
        {
          count: result.data.length,
          total: result.total,
          filters,
        },
        'Teleconsultations found with filters'
      );
      return result;
    } catch (error) {
      this.log.error(
        { error, filters },
        'Error in findTeleconsultationsWithFilters'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  private mapToTeleconsultation(doc: any): Teleconsultation {
    return {
      id: doc._id?.toString() || doc.id,
      _id: doc._id?.toString(),
      appointmentId: doc.appointmentId,
      roomUrl: doc.roomUrl,
      accessToken: doc.accessToken,
      status: this.mapStatus(doc.status),
      startedAt: doc.startedAt,
      endedAt: doc.endedAt,
      duration: doc.duration,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }

  private mapStatus(status: string): TeleconsultationStatus {
    const statusMap: Record<string, TeleconsultationStatus> = {
      waiting: 'WAITING',
      active: 'ACTIVE',
      ended: 'ENDED',
    };
    return (
      statusMap[status?.toLowerCase()] ||
      (status as TeleconsultationStatus) ||
      'WAITING'
    );
  }
}
