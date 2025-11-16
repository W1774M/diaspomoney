/**
 * Implémentation MongoDB du repository audit log
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
import type { AuditLog, AuditQuery } from '@/lib/security/audit-logging';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import type { IAuditLogRepository } from '../interfaces/IAuditLogRepository';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';

export class MongoAuditLogRepository implements IAuditLogRepository {
  private readonly collectionName = 'audit_logs';
  private readonly log = childLogger({
    component: 'MongoAuditLogRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AuditLogRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<AuditLog | null> {
    try {
      const collection = await this.getCollection();
      const auditLog = await collection.findOne({ _id: new ObjectId(id) });
      const result = auditLog ? this.mapToAuditLog(auditLog) : null;
      if (result) {
        this.log.debug({ auditLogId: id }, 'Audit log found');
      } else {
        this.log.debug({ auditLogId: id }, 'Audit log not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, auditLogId: id }, 'Error in findById');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AuditLogRepository:findAll' }) // Cache 5 minutes
  async findAll(filters?: Record<string, any>): Promise<AuditLog[]> {
    try {
      const collection = await this.getCollection();
      const auditLogs = await collection.find(filters || {}).toArray();
      const result = auditLogs.map(a => this.mapToAuditLog(a));
      this.log.debug({ count: result.length, filters }, 'Audit logs found');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AuditLogRepository:findOne' }) // Cache 5 minutes
  async findOne(filters: Record<string, any>): Promise<AuditLog | null> {
    try {
      const collection = await this.getCollection();
      const auditLog = await collection.findOne(filters);
      const result = auditLog ? this.mapToAuditLog(auditLog) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('AuditLogRepository:*') // Invalider le cache après création
  async create(data: Partial<AuditLog>): Promise<AuditLog> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const auditLogData: OptionalId<Document> = {
        ...data,
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        id:
          data.id ||
          `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: data.timestamp || now,
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(auditLogData);
      const auditLog = await collection.findOne({ _id: result.insertedId });
      if (!auditLog) {
        throw new Error('Failed to create audit log');
      }
      const mapped = this.mapToAuditLog(auditLog);
      this.log.info(
        { auditLogId: mapped.id, userId: mapped.userId },
        'Audit log created successfully'
      );
      return mapped;
    } catch (error) {
      this.log.error({ error, data }, 'Error in create');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('AuditLogRepository:*') // Invalider le cache après mise à jour
  async update(id: string, data: Partial<AuditLog>): Promise<AuditLog | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<AuditLog> = {
        ...data,
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      const updated = result?.['value']
        ? this.mapToAuditLog(result['value'])
        : null;
      if (updated) {
        this.log.info({ auditLogId: id }, 'Audit log updated successfully');
      } else {
        this.log.warn({ auditLogId: id }, 'Audit log not found for update');
      }
      return updated;
    } catch (error) {
      this.log.error({ error, auditLogId: id, data }, 'Error in update');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('AuditLogRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      const deleted = Boolean(result.deletedCount && result.deletedCount > 0);
      if (deleted) {
        this.log.info({ auditLogId: id }, 'Audit log deleted successfully');
      } else {
        this.log.warn({ auditLogId: id }, 'Audit log not found for deletion');
      }
      return deleted;
    } catch (error) {
      this.log.error({ error, auditLogId: id }, 'Error in delete');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AuditLogRepository:count' }) // Cache 5 minutes
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      const result = await collection.countDocuments(filters || {});
      this.log.debug({ count: result, filters }, 'Audit log count retrieved');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in count');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AuditLogRepository:exists' }) // Cache 5 minutes
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      const exists = count > 0;
      this.log.debug({ auditLogId: id, exists }, 'Audit log existence checked');
      return exists;
    } catch (error) {
      this.log.error({ error, auditLogId: id }, 'Error in exists');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AuditLogRepository:findWithPagination' }) // Cache 5 minutes
  async findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLog>> {
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
        cursor = cursor.sort({ timestamp: -1 });
      }

      cursor = cursor.skip(offset).limit(limit);

      const data = await cursor.toArray();
      const auditLogs = data.map(doc => this.mapToAuditLog(doc));

      const result = {
        data: auditLogs,
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };

      this.log.debug(
        {
          count: auditLogs.length,
          total,
          page,
          limit,
          offset,
          filters,
        },
        'Audit logs paginated'
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
  @Cacheable(300, { prefix: 'AuditLogRepository:searchAuditLogs' }) // Cache 5 minutes
  async searchAuditLogs(
    query: AuditQuery,
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLog>> {
    try {
      const collection = await this.getCollection();
      const limit = options?.limit || query.limit || 50;
      const offset = options?.offset || query.offset || 0;
      const page = options?.page || Math.floor(offset / limit) + 1;

      // Construire la requête MongoDB
      const mongoQuery: Record<string, any> = {};

      if (query.userId) {
        mongoQuery['userId'] = query.userId;
      }
      if (query.action) {
        mongoQuery['action'] = query.action;
      }
      if (query.resource) {
        mongoQuery['resource'] = query.resource;
      }
      if (query.severity) {
        mongoQuery['severity'] = query.severity;
      }
      if (query.category) {
        mongoQuery['category'] = query.category;
      }
      if (query.outcome) {
        mongoQuery['outcome'] = query.outcome;
      }
      if (query.dateFrom || query.dateTo) {
        mongoQuery['timestamp'] = {};
        if (query.dateFrom) {
          mongoQuery['timestamp']['$gte'] = query.dateFrom;
        }
        if (query.dateTo) {
          mongoQuery['timestamp']['$lte'] = query.dateTo;
        }
      }

      const total = await collection.countDocuments(mongoQuery);

      let cursor = collection.find(mongoQuery);

      // Trier par timestamp décroissant par défaut
      cursor = cursor.sort({ timestamp: -1 });

      cursor = cursor.skip(offset).limit(limit);

      const data = await cursor.toArray();
      const auditLogs = data.map(doc => this.mapToAuditLog(doc));

      const result = {
        data: auditLogs,
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };

      this.log.debug(
        {
          count: auditLogs.length,
          total,
          page,
          limit,
          offset,
          query,
        },
        'Audit logs searched'
      );

      return result;
    } catch (error) {
      this.log.error({ error, query, options }, 'Error in searchAuditLogs');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(600, { prefix: 'AuditLogRepository:getAuditStats' }) // Cache 10 minutes
  async getAuditStats(period: 'day' | 'week' | 'month'): Promise<{
    totalLogs: number;
    logsByCategory: Record<string, number>;
    logsBySeverity: Record<string, number>;
    logsByOutcome: Record<string, number>;
    averageRiskScore: number;
    complianceIssues: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
  }> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const query = { timestamp: { $gte: startDate } };

      // Total des logs
      const totalLogs = await collection.countDocuments(query);

      // Logs par catégorie
      const categoryPipeline = [
        { $match: query },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ];
      const categoryResults = await collection
        .aggregate(categoryPipeline)
        .toArray();
      const logsByCategory: Record<string, number> = {};
      categoryResults.forEach((item: any) => {
        if (item && item._id !== undefined && item.count !== undefined) {
          logsByCategory[item._id || 'UNKNOWN'] = item.count;
        }
      });

      // Logs par sévérité
      const severityPipeline = [
        { $match: query },
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 },
          },
        },
      ];
      const severityResults = await collection
        .aggregate(severityPipeline)
        .toArray();
      const logsBySeverity: Record<string, number> = {};
      severityResults.forEach((item: any) => {
        logsBySeverity[item._id || 'UNKNOWN'] = item.count;
      });

      // Logs par outcome
      const outcomePipeline = [
        { $match: query },
        {
          $group: {
            _id: '$outcome',
            count: { $sum: 1 },
          },
        },
      ];
      const outcomeResults = await collection
        .aggregate(outcomePipeline)
        .toArray();
      const logsByOutcome: Record<string, number> = {};
      outcomeResults.forEach((item: any) => {
        logsByOutcome[item._id || 'UNKNOWN'] = item.count;
      });

      // Score de risque moyen
      const riskScorePipeline = [
        { $match: query },
        {
          $group: {
            _id: null,
            avgRiskScore: { $avg: '$riskScore' },
          },
        },
      ];
      const riskScoreResult = await collection
        .aggregate(riskScorePipeline)
        .toArray();
      const averageRiskScore =
        riskScoreResult.length > 0 &&
        riskScoreResult[0] &&
        riskScoreResult[0]['avgRiskScore'] !== undefined
          ? Math.round((riskScoreResult[0]['avgRiskScore'] as number) * 100) /
            100
          : 0;

      // Problèmes de conformité (logs avec complianceFlags)
      const complianceQuery = {
        ...query,
        complianceFlags: { $exists: true, $ne: [] },
      };
      const complianceIssues = await collection.countDocuments(complianceQuery);

      // Top actions
      const topActionsPipeline = [
        { $match: query },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ];
      const topActionsResults = await collection
        .aggregate(topActionsPipeline)
        .toArray();
      const topActions = topActionsResults.map((item: any) => ({
        action: item._id || 'UNKNOWN',
        count: item.count,
      }));

      // Top users
      const topUsersPipeline = [
        { $match: { ...query, userId: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$userId',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ];
      const topUsersResults = await collection
        .aggregate(topUsersPipeline)
        .toArray();
      const topUsers = topUsersResults.map((item: any) => ({
        userId: item._id || 'UNKNOWN',
        count: item.count,
      }));

      const stats = {
        totalLogs,
        logsByCategory,
        logsBySeverity,
        logsByOutcome,
        averageRiskScore,
        complianceIssues,
        topActions,
        topUsers,
      };

      this.log.debug({ period, stats }, 'Audit stats retrieved');
      return stats;
    } catch (error) {
      this.log.error({ error, period }, 'Error in getAuditStats');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('AuditLogRepository:*') // Invalider le cache après suppression
  async deleteExpiredLogs(): Promise<number> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      // Trouver les logs dont la période de rétention est expirée
      const query = {
        $expr: {
          $lt: [
            {
              $add: [
                '$timestamp',
                { $multiply: ['$retentionPeriod', 24 * 60 * 60 * 1000] },
              ],
            },
            now.getTime(),
          ],
        },
      };

      const result = await collection.deleteMany(query);
      const deletedCount = result.deletedCount || 0;

      this.log.info(
        { deletedCount },
        'Expired audit logs deleted successfully'
      );

      return deletedCount;
    } catch (error) {
      this.log.error({ error }, 'Error in deleteExpiredLogs');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AuditLogRepository:findByUserId' }) // Cache 5 minutes
  async findByUserId(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLog>> {
    try {
      const result = await this.findWithPagination({ userId }, options);
      this.log.debug(
        { userId, count: result.data.length },
        'Audit logs found by user ID'
      );
      return result;
    } catch (error) {
      this.log.error({ error, userId }, 'Error in findByUserId');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AuditLogRepository:findByAction' }) // Cache 5 minutes
  async findByAction(
    action: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLog>> {
    try {
      const result = await this.findWithPagination({ action }, options);
      this.log.debug(
        { action, count: result.data.length },
        'Audit logs found by action'
      );
      return result;
    } catch (error) {
      this.log.error({ error, action }, 'Error in findByAction');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AuditLogRepository:findByCategory' }) // Cache 5 minutes
  async findByCategory(
    category: AuditLog['category'],
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLog>> {
    try {
      const result = await this.findWithPagination({ category }, options);
      this.log.debug(
        { category, count: result.data.length },
        'Audit logs found by category'
      );
      return result;
    } catch (error) {
      this.log.error({ error, category }, 'Error in findByCategory');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AuditLogRepository:findBySeverity' }) // Cache 5 minutes
  async findBySeverity(
    severity: AuditLog['severity'],
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLog>> {
    try {
      const result = await this.findWithPagination({ severity }, options);
      this.log.debug(
        { severity, count: result.data.length },
        'Audit logs found by severity'
      );
      return result;
    } catch (error) {
      this.log.error({ error, severity }, 'Error in findBySeverity');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mapper un document MongoDB vers un objet AuditLog
   */
  private mapToAuditLog(doc: any): AuditLog {
    return {
      id: doc.id || doc._id?.toString(),
      timestamp: doc.timestamp ? new Date(doc.timestamp) : new Date(),
      userId: doc.userId,
      sessionId: doc.sessionId,
      action: doc.action,
      resource: doc.resource,
      resourceId: doc.resourceId,
      method: doc.method,
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent,
      location: doc.location,
      details: doc.details || {},
      severity: doc.severity || 'LOW',
      category: doc.category || 'SYSTEM',
      outcome: doc.outcome || 'SUCCESS',
      riskScore: doc.riskScore || 0,
      complianceFlags: doc.complianceFlags || [],
      retentionPeriod: doc.retentionPeriod || 2555,
    };
  }
}
