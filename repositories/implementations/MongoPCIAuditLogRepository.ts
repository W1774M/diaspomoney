/**
 * Implémentation MongoDB du repository pour les logs d'audit PCI-DSS
 * Implémente les design patterns :
 * - Repository Pattern
 * - Dependency Injection
 * - Logger Pattern (structured logging avec childLogger)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Error Handling Pattern (Sentry)
 * - Singleton Pattern (via RepositoryContainer)
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import { mongoClient } from '@/lib/mongodb';
import type { PCIAuditLog } from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import { ObjectId } from 'mongodb';
import type {
  IPCIAuditLogRepository,
  PCIAuditLogQuery,
} from '../interfaces/IPCIAuditLogRepository';
import type {
  PaginatedFindResult,
  PaginationOptions,
} from '@/lib/types';

export class MongoPCIAuditLogRepository implements IPCIAuditLogRepository {
  private readonly collectionName = 'pci_audit_logs';
  private readonly log = childLogger({
    component: 'MongoPCIAuditLogRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @InvalidateCache('PCIAuditLogRepository')
  async create(data: Partial<PCIAuditLog>): Promise<PCIAuditLog> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      const document = {
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        id: data.id || new ObjectId().toString(),
        timestamp: data.timestamp || now,
        event: data.event || '',
        userId: data.userId || null,
        transactionId: data.transactionId || null,
        ipAddress: data.ipAddress || 'unknown',
        userAgent: data.userAgent || 'unknown',
        severity: data.severity || 'LOW',
        details: data.details || {},
        complianceStatus: data.complianceStatus || 'REVIEW_REQUIRED',
        createdAt: now,
        updatedAt: now,
      };

      await collection.insertOne(document);

      const createdLog: PCIAuditLog = {
        _id: document.id,
        id: document.id,
        timestamp: document.timestamp,
        event: document.event,
        userId: document.userId || undefined,
        transactionId: document.transactionId || undefined,
        ipAddress: document.ipAddress,
        userAgent: document.userAgent,
        severity: document.severity,
        details: document.details,
        complianceStatus: document.complianceStatus,
        createdAt: document.createdAt || document.timestamp,
        updatedAt: document.updatedAt || document.timestamp,
      };

      this.log.debug(
        { auditLogId: createdLog.id, event: createdLog.event },
        'PCI audit log created',
      );

      return createdLog;
    } catch (error) {
      this.log.error({ error, data }, 'Error creating PCI audit log');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoPCIAuditLogRepository',
          action: 'create',
        },
        extra: { data },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PCIAuditLogRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<PCIAuditLog | null> {
    try {
      const collection = await this.getCollection();
      const document = await collection.findOne({
        $or: [{ _id: new ObjectId(id) }, { id }],
      });

      if (!document) {
        return null;
      }

      return this.mapToPCIAuditLog(document);
    } catch (error) {
      this.log.error({ error, id }, 'Error finding PCI audit log by id');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoPCIAuditLogRepository',
          action: 'findById',
        },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PCIAuditLogRepository:findAll' }) // Cache 5 minutes
  async findAll(filter: Record<string, any> = {}): Promise<PCIAuditLog[]> {
    try {
      const collection = await this.getCollection();
      const documents = await collection.find(filter).toArray();
      return documents.map(doc => this.mapToPCIAuditLog(doc));
    } catch (error) {
      this.log.error({ error, filter }, 'Error finding PCI audit logs');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoPCIAuditLogRepository',
          action: 'findAll',
        },
        extra: { filter },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PCIAuditLogRepository:findOne' }) // Cache 5 minutes
  async findOne(filter: Record<string, any>): Promise<PCIAuditLog | null> {
    try {
      const collection = await this.getCollection();
      const document = await collection.findOne(filter);
      return document ? this.mapToPCIAuditLog(document) : null;
    } catch (error) {
      this.log.error({ error, filter }, 'Error finding PCI audit log');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoPCIAuditLogRepository',
          action: 'findOne',
        },
        extra: { filter },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PCIAuditLogRepository:count' }) // Cache 5 minutes
  async count(filter: Record<string, any> = {}): Promise<number> {
    try {
      const collection = await this.getCollection();
      return await collection.countDocuments(filter);
    } catch (error) {
      this.log.error({ error, filter }, 'Error counting PCI audit logs');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoPCIAuditLogRepository',
          action: 'count',
        },
        extra: { filter },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PCIAuditLogRepository:exists' }) // Cache 5 minutes
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({
        $or: [{ _id: new ObjectId(id) }, { id }],
      });
      return count > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error checking PCI audit log existence');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoPCIAuditLogRepository',
          action: 'exists',
        },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @InvalidateCache('PCIAuditLogRepository')
  async update(
    id: string,
    data: Partial<PCIAuditLog>,
  ): Promise<PCIAuditLog | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Record<string, any> = {
        ...data,
        updatedAt: new Date(),
      };

      // Exclure les champs qui ne doivent pas être mis à jour
      delete updateData['id'];
      delete updateData['_id'];

      const result = await collection.findOneAndUpdate(
        { $or: [{ _id: new ObjectId(id) }, { id }] },
        { $set: updateData },
        { returnDocument: 'after' },
      );

      if (!result) {
        return null;
      }

      return this.mapToPCIAuditLog(result);
    } catch (error) {
      this.log.error({ error, id, data }, 'Error updating PCI audit log');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoPCIAuditLogRepository',
          action: 'update',
        },
        extra: { id, data },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @InvalidateCache('PCIAuditLogRepository')
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({
        $or: [{ _id: new ObjectId(id) }, { id }],
      });

      return result.deletedCount > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error deleting PCI audit log');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoPCIAuditLogRepository',
          action: 'delete',
        },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PCIAuditLogRepository:findWithPagination' }) // Cache 5 minutes
  async findWithPagination(
    filter: Record<string, any> = {},
    options: PaginationOptions = { limit: 50, page: 1 },
  ): Promise<PaginatedFindResult<PCIAuditLog>> {
    try {
      const collection = await this.getCollection();
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const page = options.page || Math.floor(offset / limit) + 1;

      // Compter le total
      const total = await collection.countDocuments(filter);

      // Récupérer les documents avec pagination
      const sort = options.sort || { timestamp: -1 };
      const documents = await collection
        .find(filter)
        .sort(sort as Record<string, 1 | -1>)
        .skip(offset)
        .limit(limit)
        .toArray();

      const data = documents.map(doc => this.mapToPCIAuditLog(doc));

      return {
        data,
        total,
        pagination: {
          page,
          limit,
          pages: Math.ceil(total / limit),
          offset,
          total,
          hasNext: offset + limit < total,
          hasPrev: offset > 0,
        },
      };
    } catch (error) {
      this.log.error(
        { error, filter, options },
        'Error finding PCI audit logs with pagination',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'MongoPCIAuditLogRepository',
          action: 'findWithPagination',
        },
        extra: { filter, options },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'PCIAuditLogRepository:searchPCIAuditLogs' }) // Cache 5 minutes
  async searchPCIAuditLogs(
    query: PCIAuditLogQuery,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<PCIAuditLog>> {
    try {
      const mongoQuery: Record<string, any> = {};

      if (query.userId) {
        mongoQuery['userId'] = query.userId;
      }

      if (query.transactionId) {
        mongoQuery['transactionId'] = query.transactionId;
      }

      if (query.event) {
        mongoQuery['event'] = query.event;
      }

      if (query.severity) {
        mongoQuery['severity'] = query.severity;
      }

      if (query.complianceStatus) {
        mongoQuery['complianceStatus'] = query.complianceStatus;
      }

      // Filtres de date
      if (query.dateFrom || query.dateTo) {
        mongoQuery['timestamp'] = {};
        if (query.dateFrom) {
          mongoQuery['timestamp'].$gte = query.dateFrom;
        }
        if (query.dateTo) {
          mongoQuery['timestamp'].$lte = query.dateTo;
        }
      }

      const limit = query.limit || options?.limit || 50;
      const offset = query.offset || options?.offset || 0;
      const page = options?.page || Math.floor(offset / limit) + 1;
      const paginationOptions: PaginationOptions = {
        limit,
        page,
        offset,
        sort: options?.sort || { timestamp: -1 },
      };

      return this.findWithPagination(mongoQuery, paginationOptions);
    } catch (error) {
      this.log.error({ error, query }, 'Error searching PCI audit logs');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoPCIAuditLogRepository',
          action: 'searchPCIAuditLogs',
        },
        extra: { query },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(600, { prefix: 'PCIAuditLogRepository:getPCIStats' }) // Cache 10 minutes
  async getPCIStats(period: 'day' | 'week' | 'month'): Promise<{
    totalLogs: number;
    logsByEvent: Record<string, number>;
    logsBySeverity: Record<string, number>;
    logsByComplianceStatus: Record<string, number>;
    averageComplianceScore: number;
    criticalIssues: number;
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

      // Logs par événement
      const eventPipeline = [
        { $match: query },
        {
          $group: {
            _id: '$event',
            count: { $sum: 1 },
          },
        },
      ];
      const eventResults = await collection.aggregate(eventPipeline).toArray();
      const logsByEvent: Record<string, number> = {};
      eventResults.forEach((item: any) => {
        if (item && item._id !== undefined && item.count !== undefined) {
          logsByEvent[item._id || 'UNKNOWN'] = item.count;
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
        if (item && item._id !== undefined && item.count !== undefined) {
          logsBySeverity[item._id || 'UNKNOWN'] = item.count;
        }
      });

      // Logs par statut de conformité
      const compliancePipeline = [
        { $match: query },
        {
          $group: {
            _id: '$complianceStatus',
            count: { $sum: 1 },
          },
        },
      ];
      const complianceResults = await collection
        .aggregate(compliancePipeline)
        .toArray();
      const logsByComplianceStatus: Record<string, number> = {};
      complianceResults.forEach((item: any) => {
        if (item && item._id !== undefined && item.count !== undefined) {
          logsByComplianceStatus[item._id || 'UNKNOWN'] = item.count;
        }
      });

      // Calculer le score de conformité moyen
      // COMPLIANT = 100, NON_COMPLIANT = 0, REVIEW_REQUIRED = 50
      const complianceScorePipeline = [
        { $match: query },
        {
          $project: {
            score: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ['$complianceStatus', 'COMPLIANT'] },
                    then: 100,
                  },
                  {
                    case: { $eq: ['$complianceStatus', 'NON_COMPLIANT'] },
                    then: 0,
                  },
                  {
                    case: { $eq: ['$complianceStatus', 'REVIEW_REQUIRED'] },
                    then: 50,
                  },
                ],
                default: 50,
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$score' },
          },
        },
      ];
      const scoreResult = await collection
        .aggregate(complianceScorePipeline)
        .toArray();
      const averageComplianceScore =
        scoreResult[0] && scoreResult[0]['avgScore'] !== undefined
          ? Math.round(scoreResult[0]['avgScore'] * 100) / 100
          : 0;

      // Compter les issues critiques
      const criticalIssues = await collection.countDocuments({
        ...query,
        severity: 'CRITICAL',
      });

      return {
        totalLogs,
        logsByEvent,
        logsBySeverity,
        logsByComplianceStatus,
        averageComplianceScore,
        criticalIssues,
      };
    } catch (error) {
      this.log.error({ error, period }, 'Error getting PCI stats');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoPCIAuditLogRepository',
          action: 'getPCIStats',
        },
        extra: { period },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('PCIAuditLogRepository')
  async deleteExpiredLogs(): Promise<number> {
    try {
      const collection = await this.getCollection();
      // Supprimer les logs de plus de 1 an (rétention PCI-DSS recommandée)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const result = await collection.deleteMany({
        timestamp: { $lt: oneYearAgo },
      });

      this.log.info(
        { deletedCount: result.deletedCount },
        'Expired PCI audit logs deleted',
      );

      return result.deletedCount;
    } catch (error) {
      this.log.error({ error }, 'Error deleting expired PCI audit logs');
      Sentry.captureException(error, {
        tags: {
          component: 'MongoPCIAuditLogRepository',
          action: 'deleteExpiredLogs',
        },
      });
      throw error;
    }
  }

  /**
   * Mapper un document MongoDB vers un objet PCIAuditLog
   */
  private mapToPCIAuditLog(doc: any): PCIAuditLog {
    const docId = doc.id || doc._id?.toString() || '';
    const timestamp = doc.timestamp ? new Date(doc.timestamp) : new Date();
    const createdAt = doc.createdAt ? new Date(doc.createdAt) : timestamp;
    const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : timestamp;
    return {
      _id: docId,
      id: docId,
      timestamp,
      event: doc.event || '',
      userId: doc.userId || undefined,
      transactionId: doc.transactionId || undefined,
      ipAddress: doc.ipAddress || 'unknown',
      userAgent: doc.userAgent || 'unknown',
      severity: doc.severity || 'LOW',
      details: doc.details || {},
      complianceStatus: doc.complianceStatus || 'REVIEW_REQUIRED',
      createdAt,
      updatedAt,
    };
  }
}
