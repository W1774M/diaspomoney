/**
 * Implémentation MongoDB du repository bénéficiaire
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
import type { Beneficiary, BeneficiaryFilters } from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import type { IBeneficiaryRepository } from '../interfaces/IBeneficiaryRepository';
import type {
  PaginatedFindResult,
  PaginationOptions,
} from '@/lib/types';

export class MongoBeneficiaryRepository implements IBeneficiaryRepository {
  private readonly collectionName = 'beneficiaries';
  private readonly log = childLogger({
    component: 'MongoBeneficiaryRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BeneficiaryRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<Beneficiary | null> {
    try {
      const collection = await this.getCollection();
      const beneficiary = await collection.findOne({ _id: new ObjectId(id) });
      const result = beneficiary ? this.mapToBeneficiary(beneficiary) : null;
      if (result) {
        this.log.debug({ beneficiaryId: id }, 'Beneficiary found');
      } else {
        this.log.debug({ beneficiaryId: id }, 'Beneficiary not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, beneficiaryId: id }, 'Error in findById');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BeneficiaryRepository:findAll' }) // Cache 5 minutes
  async findAll(filters?: Record<string, any>): Promise<Beneficiary[]> {
    try {
      const collection = await this.getCollection();
      const beneficiaries = await collection.find(filters || {}).toArray();
      const result = beneficiaries.map(b => this.mapToBeneficiary(b));
      this.log.debug({ count: result.length, filters }, 'Beneficiaries found');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BeneficiaryRepository:findOne' }) // Cache 5 minutes
  async findOne(filters: Record<string, any>): Promise<Beneficiary | null> {
    try {
      const collection = await this.getCollection();
      const beneficiary = await collection.findOne(filters);
      const result = beneficiary ? this.mapToBeneficiary(beneficiary) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BeneficiaryRepository:*') // Invalider le cache après création
  async create(data: Partial<Beneficiary>): Promise<Beneficiary> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const beneficiaryData: OptionalId<Document> = {
        ...data,
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        userId: data.payerId ? new ObjectId(data.payerId) : undefined,
        payerId: data.payerId ? new ObjectId(data.payerId) : undefined,
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(beneficiaryData);
      const beneficiary = await collection.findOne({ _id: result.insertedId });
      if (!beneficiary) {
        throw new Error('Failed to create beneficiary');
      }
      const mapped = this.mapToBeneficiary(beneficiary);
      this.log.info(
        { beneficiaryId: mapped.id, payerId: mapped.payerId },
        'Beneficiary created successfully',
      );
      return mapped;
    } catch (error) {
      this.log.error({ error, data }, 'Error in create');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BeneficiaryRepository:*') // Invalider le cache après mise à jour
  async update(
    id: string,
    data: Partial<Beneficiary>,
  ): Promise<Beneficiary | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<Beneficiary> = {
        ...data,
        updatedAt: new Date(),
      };
      if (data.payerId) {
        updateData.payerId = data.payerId;
        (updateData as any).userId = new ObjectId(data.payerId);
      }
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' },
      );
      const mapped = result?.['value']
        ? this.mapToBeneficiary(result['value'])
        : null;
      if (mapped) {
        this.log.info(
          { beneficiaryId: id },
          'Beneficiary updated successfully',
        );
      } else {
        this.log.warn(
          { beneficiaryId: id },
          'Beneficiary not found for update',
        );
      }
      return mapped;
    } catch (error) {
      this.log.error({ error, beneficiaryId: id, data }, 'Error in update');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BeneficiaryRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      const deleted = Boolean(result.deletedCount && result.deletedCount > 0);
      if (deleted) {
        this.log.info(
          { beneficiaryId: id },
          'Beneficiary deleted successfully',
        );
      } else {
        this.log.warn(
          { beneficiaryId: id },
          'Beneficiary not found for deletion',
        );
      }
      return deleted;
    } catch (error) {
      this.log.error({ error, beneficiaryId: id }, 'Error in delete');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BeneficiaryRepository:count' }) // Cache 5 minutes
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      const result = await collection.countDocuments(filters || {});
      this.log.debug({ count: result, filters }, 'Count completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in count');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BeneficiaryRepository:exists' }) // Cache 5 minutes
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      const result = count > 0;
      this.log.debug(
        { beneficiaryId: id, exists: result },
        'Exists check completed',
      );
      return result;
    } catch (error) {
      this.log.error({ error, beneficiaryId: id }, 'Error in exists');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BeneficiaryRepository:findWithPagination' }) // Cache 5 minutes
  async findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<Beneficiary>> {
    try {
      const collection = await this.getCollection();
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const page = options?.page ?? Math.floor(offset / limit) + 1;
      const sort = options?.sort || { createdAt: -1 };

      const query = filters || {};
      const total = await collection.countDocuments(query);
      const beneficiaries = await collection
        .find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .toArray();

      const pages = Math.ceil(total / limit);
      const result = {
        data: beneficiaries.map(b => this.mapToBeneficiary(b)),
        total,
        pagination: {
          page,
          limit,
          pages,
          offset,
          total,
          hasNext: offset + limit < total,
          hasPrev: offset > 0,
        },
      };
      this.log.debug(
        { count: result.data.length, total, page, limit, filters },
        'findWithPagination completed',
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
  @Cacheable(300, { prefix: 'BeneficiaryRepository:findByPayer' }) // Cache 5 minutes
  async findByPayer(
    payerId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<Beneficiary>> {
    try {
      const query = {
        $or: [
          { payerId: new ObjectId(payerId) },
          { userId: new ObjectId(payerId) },
        ],
      };
      return this.findWithPagination(query, options);
    } catch (error) {
      this.log.error({ error, payerId }, 'Error in findByPayer');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BeneficiaryRepository:findActiveByPayer' }) // Cache 5 minutes
  async findActiveByPayer(
    payerId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<Beneficiary>> {
    try {
      const query = {
        $or: [
          { payerId: new ObjectId(payerId) },
          { userId: new ObjectId(payerId) },
        ],
        isActive: true,
      };
      return this.findWithPagination(query, options);
    } catch (error) {
      this.log.error({ error, payerId }, 'Error in findActiveByPayer');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, {
    prefix: 'BeneficiaryRepository:findBeneficiariesWithFilters',
  }) // Cache 5 minutes
  async findBeneficiariesWithFilters(
    filters: BeneficiaryFilters,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<Beneficiary>> {
    try {
      const query: Record<string, any> = {};

      if (filters.payerId) {
        query['$or'] = [
          { payerId: new ObjectId(filters.payerId) },
          { userId: new ObjectId(filters.payerId) },
        ];
      }
      if (filters.isActive !== undefined) {
        query['isActive'] = filters.isActive;
      }
      if (filters.relationship) {
        query['relationship'] = filters.relationship;
      }
      if (filters.country) {
        query['country'] = filters.country;
      }
      if (filters.searchTerm) {
        query['$or'] = [
          ...(query['$or'] || []),
          { firstName: { $regex: filters.searchTerm, $options: 'i' } },
          { lastName: { $regex: filters.searchTerm, $options: 'i' } },
          { email: { $regex: filters.searchTerm, $options: 'i' } },
        ];
      }

      const result = await this.findWithPagination(query, options);
      this.log.debug(
        { count: result.data.length, total: result.total, filters },
        'findBeneficiariesWithFilters completed',
      );
      return result;
    } catch (error) {
      this.log.error(
        { error, filters, options },
        'Error in findBeneficiariesWithFilters',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BeneficiaryRepository:countByPayer' }) // Cache 5 minutes
  async countByPayer(payerId: string): Promise<number> {
    try {
      const query = {
        $or: [
          { payerId: new ObjectId(payerId) },
          { userId: new ObjectId(payerId) },
        ],
      };
      const result = await this.count(query);
      this.log.debug({ payerId, count: result }, 'countByPayer completed');
      return result;
    } catch (error) {
      this.log.error({ error, payerId }, 'Error in countByPayer');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BeneficiaryRepository:*') // Invalider le cache après désactivation
  async deactivate(beneficiaryId: string, payerId: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.findOneAndUpdate(
        {
          _id: new ObjectId(beneficiaryId),
          $or: [
            { payerId: new ObjectId(payerId) },
            { userId: new ObjectId(payerId) },
          ],
        },
        {
          $set: {
            isActive: false,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' },
      );
      const deactivated = result?.['value'] !== null;
      if (deactivated) {
        this.log.info(
          { beneficiaryId, payerId },
          'Beneficiary deactivated successfully',
        );
      } else {
        this.log.warn(
          { beneficiaryId, payerId },
          'Beneficiary not found or does not belong to payer',
        );
      }
      return deactivated;
    } catch (error) {
      this.log.error({ error, beneficiaryId, payerId }, 'Error in deactivate');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mapper un document MongoDB vers un objet Beneficiary
   */
  private mapToBeneficiary(doc: any): Beneficiary {
    const payerId =
      doc.payerId?.toString() ||
      doc.userId?.toString() ||
      doc.payerId ||
      doc.userId;
    return {
      id: doc._id?.toString() || doc.id,
      _id: doc._id?.toString(),
      payerId: payerId,
      firstName: doc.firstName || doc.name?.split(' ')[0] || '',
      lastName: doc.lastName || doc.name?.split(' ').slice(1).join(' ') || '',
      email: doc.email,
      phone: doc.phone,
      relationship: doc.relationship,
      country: doc.country,
      address: doc.address,
      isActive:
        doc.isActive !== undefined ? doc.isActive : doc.status === 'active',
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }
}
