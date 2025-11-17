/**
 * Implémentation MongoDB du repository complaint
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
import type {
  Complaint,
  ComplaintFilters,
  ComplaintStatus,
  IComplaintRepository,
} from '../interfaces/IComplaintRepository';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';

export class MongoComplaintRepository implements IComplaintRepository {
  private readonly collectionName = 'complaints';
  private readonly log = childLogger({
    component: 'MongoComplaintRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ComplaintRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<Complaint | null> {
    try {
      const collection = await this.getCollection();
      const complaint = await collection.findOne({ _id: new ObjectId(id) });
      const result = complaint ? this.mapToComplaint(complaint) : null;
      if (result) {
        this.log.debug({ complaintId: id }, 'Complaint found');
      } else {
        this.log.debug({ complaintId: id }, 'Complaint not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, id }, 'Error in findById');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoComplaintRepository', action: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ComplaintRepository:findAll' }) // Cache 5 minutes
  async findAll(filters?: Record<string, any>): Promise<Complaint[]> {
    try {
      const collection = await this.getCollection();
      const complaints = await collection.find(filters || {}).toArray();
      const result = complaints.map(c => this.mapToComplaint(c));
      this.log.debug({ count: result.length, filters }, 'Complaints found');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoComplaintRepository', action: 'findAll' },
        extra: { filters },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ComplaintRepository:findOne' }) // Cache 5 minutes
  async findOne(filters: Record<string, any>): Promise<Complaint | null> {
    try {
      const collection = await this.getCollection();
      const complaint = await collection.findOne(filters);
      const result = complaint ? this.mapToComplaint(complaint) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoComplaintRepository', action: 'findOne' },
        extra: { filters },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ComplaintRepository:*') // Invalider le cache après création
  async create(data: Partial<Complaint>): Promise<Complaint> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const complaintData: OptionalId<Document> = {
        ...data,
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(complaintData);
      const complaint = await collection.findOne({ _id: result.insertedId });
      if (!complaint) {
        throw new Error('Failed to create complaint');
      }
      const mappedComplaint = this.mapToComplaint(complaint);
      this.log.info(
        { complaintId: mappedComplaint.id, userId: mappedComplaint.userId },
        'Complaint created successfully'
      );
      return mappedComplaint;
    } catch (error) {
      this.log.error({ error, userId: data.userId }, 'Error in create');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoComplaintRepository', action: 'create' },
        extra: { userId: data.userId },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ComplaintRepository:*') // Invalider le cache après mise à jour
  async update(
    id: string,
    data: Partial<Complaint>
  ): Promise<Complaint | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<Complaint> = {
        ...data,
        updatedAt: new Date(),
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      return result?.['value'] ? this.mapToComplaint(result['value']) : null;
    } catch (error) {
      this.log.error({ error, id, data }, 'Error in update');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoComplaintRepository', action: 'update' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('ComplaintRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error in delete');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoComplaintRepository', action: 'delete' },
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
        tags: { component: 'MongoComplaintRepository', action: 'count' },
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
        tags: { component: 'MongoComplaintRepository', action: 'exists' },
        extra: { id },
      });
      throw error;
    }
  }

  async findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Complaint>> {
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
      const complaints = data.map(doc => this.mapToComplaint(doc));

      return {
        data: complaints,
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      this.log.error(
        { error, filters, options },
        'Error in findWithPagination'
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoComplaintRepository',
          action: 'findWithPagination',
        },
        extra: { filters, options },
      });
      throw error;
    }
  }

  async findByUser(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Complaint>> {
    return this.findWithPagination({ userId }, options);
  }

  async findByProvider(
    provider: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Complaint>> {
    return this.findWithPagination({ provider }, options);
  }

  async findByStatus(
    status: ComplaintStatus,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Complaint>> {
    return this.findWithPagination({ status }, options);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'ComplaintRepository:findComplaintsWithFilters' }) // Cache 5 minutes
  async findComplaintsWithFilters(
    filters: ComplaintFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Complaint>> {
    try {
      const query: Record<string, any> = {};

      if (filters.userId) {
        query['userId'] = filters.userId;
      }
      if (filters.provider) {
        query['provider'] = filters.provider;
      }
      if (filters.appointmentId) {
        query['appointmentId'] = filters.appointmentId;
      }
      if (filters.type) {
        query['type'] = filters.type;
      }
      if (filters.priority) {
        query['priority'] = filters.priority;
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

      return this.findWithPagination(query, options);
    } catch (error) {
      this.log.error(
        { error, filters, options },
        'Error in findComplaintsWithFilters'
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoComplaintRepository',
          action: 'findComplaintsWithFilters',
        },
        extra: { filters, options },
      });
      throw error;
    }
  }

  async generateComplaintNumber(): Promise<string> {
    try {
      const collection = await this.getCollection();
      const year = new Date().getFullYear();
      const prefix = `REC-${year}-`;

      // Trouver le dernier numéro de l'année
      const lastComplaint = await collection.findOne(
        { number: { $regex: `^${prefix}` } },
        { sort: { number: -1 } }
      );

      let sequence = 1;
      if (lastComplaint && lastComplaint['number']) {
        const lastNumber = lastComplaint['number'].replace(prefix, '');
        sequence = parseInt(lastNumber, 10) + 1;
      }

      return `${prefix}${sequence.toString().padStart(3, '0')}`;
    } catch (error) {
      this.log.error({ error }, 'Error in generateComplaintNumber');
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoComplaintRepository',
          action: 'generateComplaintNumber',
        },
      });
      throw error;
    }
  }

  private mapToComplaint(doc: any): Complaint {
    return {
      id: doc._id?.toString() || doc.id,
      _id: doc._id?.toString(),
      number: doc.number,
      title: doc.title,
      type: doc.type || 'QUALITY',
      priority: doc.priority || 'MEDIUM',
      status: this.mapStatus(doc.status),
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
      description: doc.description || '',
      provider: doc.provider || '',
      appointmentId: doc.appointmentId || '',
      userId: doc.userId,
    };
  }

  private mapStatus(status: string): ComplaintStatus {
    const statusMap: Record<string, ComplaintStatus> = {
      open: 'OPEN',
      in_progress: 'IN_PROGRESS',
      resolved: 'RESOLVED',
      closed: 'CLOSED',
    };
    return statusMap[status?.toLowerCase()] || 'OPEN';
  }
}
