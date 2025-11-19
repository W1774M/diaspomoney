/**
 * Implémentation MongoDB du repository pour les règles de disponibilité
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
import type { AvailabilityRule } from '@/lib/types/availability.types';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import type {
  AvailabilityRuleFilters,
  IAvailabilityRuleRepository,
} from '../interfaces/IAvailabilityRuleRepository';
import type {
  PaginatedFindResult,
  PaginationOptions,
} from '@/lib/types';

export class MongoAvailabilityRuleRepository
  implements IAvailabilityRuleRepository
{
  private readonly collectionName = 'availabilityRules';
  private readonly log = childLogger({
    component: 'MongoAvailabilityRuleRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  private mapToAvailabilityRule(doc: Document): AvailabilityRule {
    const id = doc['_id']?.toString() || '';
    
    // Mapper les timeSlots vers les jours de la semaine
    const timeSlots = (doc['timeSlots'] || []) as Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isActive: boolean;
    }>;
    
    const monday = timeSlots.filter(s => s.dayOfWeek === 1);
    const tuesday = timeSlots.filter(s => s.dayOfWeek === 2);
    const wednesday = timeSlots.filter(s => s.dayOfWeek === 3);
    const thursday = timeSlots.filter(s => s.dayOfWeek === 4);
    const friday = timeSlots.filter(s => s.dayOfWeek === 5);
    const saturday = timeSlots.filter(s => s.dayOfWeek === 6);
    const sunday = timeSlots.filter(s => s.dayOfWeek === 0);

    return {
      id,
      _id: id,
      userId: doc['userId']?.toString() || doc['userId'] || '',
      name: doc['name'] || '',
      type: doc['type'] || 'weekly',
      isActive: doc['isActive'] ?? true,
      startDate: doc['startDate'],
      endDate: doc['endDate'],
      timeSlots: timeSlots.map(slot => ({
        id: `${id}-${slot.dayOfWeek}-${slot.startTime}`,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive ?? true,
        start: slot.startTime,
        end: slot.endTime,
      })),
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
      timezone: doc['timezone'] || 'UTC',
      createdAt: doc['createdAt'] || new Date(),
      updatedAt: doc['updatedAt'] || new Date(),
    };
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AvailabilityRuleRepository:findById' })
  async findById(id: string): Promise<AvailabilityRule | null> {
    try {
      const collection = await this.getCollection();
      const rule = await collection.findOne({ _id: new ObjectId(id) });
      const result = rule ? this.mapToAvailabilityRule(rule) : null;
      if (result) {
        this.log.debug({ ruleId: id }, 'Availability rule found');
      } else {
        this.log.debug({ ruleId: id }, 'Availability rule not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, ruleId: id }, 'Error in findById');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AvailabilityRuleRepository:findAll' })
  async findAll(filters?: Record<string, any>): Promise<AvailabilityRule[]> {
    try {
      const collection = await this.getCollection();
      const rules = await collection.find(filters || {}).toArray();
      const result = rules.map(r => this.mapToAvailabilityRule(r));
      this.log.debug({ count: result.length, filters }, 'Availability rules found');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AvailabilityRuleRepository:findOne' })
  async findOne(filters: Record<string, any>): Promise<AvailabilityRule | null> {
    try {
      const collection = await this.getCollection();
      const rule = await collection.findOne(filters);
      const result = rule ? this.mapToAvailabilityRule(rule) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('AvailabilityRuleRepository:*')
  async create(data: Partial<AvailabilityRule>): Promise<AvailabilityRule> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const ruleData: OptionalId<Document> = {
        userId: data.userId || '',
        name: data.name || '',
        type: data.type || 'weekly',
        isActive: data.isActive ?? true,
        startDate: data.startDate,
        endDate: data.endDate,
        timeSlots: (data.timeSlots || []).map(slot => ({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime || slot.start,
          endTime: slot.endTime || slot.end,
          isActive: slot.isActive ?? true,
        })),
        timezone: data.timezone || 'UTC',
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(ruleData);
      const insertedId = result.insertedId.toString();
      
      this.log.info(
        { ruleId: insertedId, userId: data.userId },
        'Availability rule created',
      );

      const created = await collection.findOne({ _id: result.insertedId });
      return this.mapToAvailabilityRule(created!);
    } catch (error) {
      this.log.error({ error, data }, 'Error in create');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('AvailabilityRuleRepository:*')
  async update(
    id: string,
    data: Partial<AvailabilityRule>,
  ): Promise<AvailabilityRule | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<Document> = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData['name'] = data.name;
      if (data.type !== undefined) updateData['type'] = data.type;
      if (data.isActive !== undefined) updateData['isActive'] = data.isActive;
      if (data.startDate !== undefined) updateData['startDate'] = data.startDate;
      if (data.endDate !== undefined) updateData['endDate'] = data.endDate;
      if (data.timeSlots !== undefined) {
        updateData['timeSlots'] = data.timeSlots.map(slot => ({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime || slot.start,
          endTime: slot.endTime || slot.end,
          isActive: slot.isActive ?? true,
        }));
      }
      if (data.timezone !== undefined) updateData['timezone'] = data.timezone;

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' },
      );

      if (!result) {
        this.log.warn({ ruleId: id }, 'Availability rule not found for update');
        return null;
      }

      this.log.info({ ruleId: id }, 'Availability rule updated');
      return this.mapToAvailabilityRule(result);
    } catch (error) {
      this.log.error({ error, ruleId: id }, 'Error in update');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('AvailabilityRuleRepository:*')
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      const deleted = result.deletedCount > 0;
      
      if (deleted) {
        this.log.info({ ruleId: id }, 'Availability rule deleted');
      } else {
        this.log.warn({ ruleId: id }, 'Availability rule not found for deletion');
      }
      
      return deleted;
    } catch (error) {
      this.log.error({ error, ruleId: id }, 'Error in delete');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AvailabilityRuleRepository:count' })
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments(filters || {});
      this.log.debug({ count, filters }, 'Count completed');
      return count;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in count');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AvailabilityRuleRepository:exists' })
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      return count > 0;
    } catch (error) {
      this.log.error({ error, ruleId: id }, 'Error in exists');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AvailabilityRuleRepository:findWithPagination' })
  async findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<AvailabilityRule>> {
    try {
      const collection = await this.getCollection();
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;

      const [data, total] = await Promise.all([
        collection
          .find(filters || {})
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .toArray(),
        collection.countDocuments(filters || {}),
      ]);

      const page = Math.floor(offset / limit) + 1;
      const pages = Math.ceil(total / limit);
      const result: PaginatedFindResult<AvailabilityRule> = {
        data: data.map(r => this.mapToAvailabilityRule(r)),
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
        { count: result.data.length, total, filters, options },
        'findWithPagination completed',
      );
      return result;
    } catch (error) {
      this.log.error({ error, filters, options }, 'Error in findWithPagination');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AvailabilityRuleRepository:findByUserId' })
  async findByUserId(
    userId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<AvailabilityRule>> {
    return this.findWithPagination({ userId }, options);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AvailabilityRuleRepository:findActiveByUserId' })
  async findActiveByUserId(
    userId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<AvailabilityRule>> {
    return this.findWithPagination({ userId, isActive: true }, options);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AvailabilityRuleRepository:findRulesWithFilters' })
  async findRulesWithFilters(
    filters: AvailabilityRuleFilters,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<AvailabilityRule>> {
    const mongoFilters: Record<string, any> = {};
    
    if (filters.userId) mongoFilters['userId'] = filters.userId;
    if (filters.type) mongoFilters['type'] = filters.type;
    if (filters.isActive !== undefined) mongoFilters['isActive'] = filters.isActive;

    return this.findWithPagination(mongoFilters, options);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AvailabilityRuleRepository:countByUserId' })
  async countByUserId(userId: string): Promise<number> {
    return this.count({ userId });
  }
}

