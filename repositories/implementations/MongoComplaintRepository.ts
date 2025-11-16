/**
 * Implémentation MongoDB du repository complaint
 */

import { mongoClient } from '@/lib/mongodb';
import { Document, ObjectId, OptionalId } from 'mongodb';
import {
  Complaint,
  ComplaintFilters,
  ComplaintStatus,
  IComplaintRepository,
} from '../interfaces/IComplaintRepository';
import { PaginatedResult, PaginationOptions } from '../interfaces/IRepository';

export class MongoComplaintRepository implements IComplaintRepository {
  private readonly collectionName = 'complaints';

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  async findById(id: string): Promise<Complaint | null> {
    try {
      const collection = await this.getCollection();
      const complaint = await collection.findOne({ _id: new ObjectId(id) });
      return complaint ? this.mapToComplaint(complaint) : null;
    } catch (error) {
      console.error('[MongoComplaintRepository] Error in findById:', error);
      throw error;
    }
  }

  async findAll(filters?: Record<string, any>): Promise<Complaint[]> {
    try {
      const collection = await this.getCollection();
      const complaints = await collection.find(filters || {}).toArray();
      return complaints.map(c => this.mapToComplaint(c));
    } catch (error) {
      console.error('[MongoComplaintRepository] Error in findAll:', error);
      throw error;
    }
  }

  async findOne(filters: Record<string, any>): Promise<Complaint | null> {
    try {
      const collection = await this.getCollection();
      const complaint = await collection.findOne(filters);
      return complaint ? this.mapToComplaint(complaint) : null;
    } catch (error) {
      console.error('[MongoComplaintRepository] Error in findOne:', error);
      throw error;
    }
  }

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
      return this.mapToComplaint(complaint);
    } catch (error) {
      console.error('[MongoComplaintRepository] Error in create:', error);
      throw error;
    }
  }

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
      console.error('[MongoComplaintRepository] Error in update:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('[MongoComplaintRepository] Error in delete:', error);
      throw error;
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      return await collection.countDocuments(filters || {});
    } catch (error) {
      console.error('[MongoComplaintRepository] Error in count:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      return count > 0;
    } catch (error) {
      console.error('[MongoComplaintRepository] Error in exists:', error);
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
      console.error(
        '[MongoComplaintRepository] Error in findWithPagination:',
        error
      );
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
      console.error(
        '[MongoComplaintRepository] Error in findComplaintsWithFilters:',
        error
      );
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
      console.error(
        '[MongoComplaintRepository] Error in generateComplaintNumber:',
        error
      );
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
