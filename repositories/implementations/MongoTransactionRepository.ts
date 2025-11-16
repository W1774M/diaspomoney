/**
 * Implémentation MongoDB du repository transaction
 *
 * Implémente les design patterns :
 * - Repository Pattern
 * - Logger Pattern (structured logging avec childLogger)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Error Handling Pattern (Sentry)
 */

import { TransactionQueryBuilder } from '@/builders';
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
  ITransactionRepository,
  Transaction,
  TransactionFilters,
  TransactionStatus,
} from '../interfaces/ITransactionRepository';

export class MongoTransactionRepository implements ITransactionRepository {
  private readonly collectionName = 'transactions';
  private readonly log = childLogger({
    component: 'MongoTransactionRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TransactionRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<Transaction | null> {
    try {
      const collection = await this.getCollection();
      const transaction = await collection.findOne({ _id: new ObjectId(id) });
      const result = transaction ? this.mapToTransaction(transaction) : null;
      if (result) {
        this.log.debug({ transactionId: id }, 'Transaction found');
      } else {
        this.log.debug({ transactionId: id }, 'Transaction not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, transactionId: id }, 'Error in findById');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TransactionRepository:findAll' }) // Cache 5 minutes
  async findAll(filters?: Record<string, any>): Promise<Transaction[]> {
    try {
      const collection = await this.getCollection();
      const transactions = await collection.find(filters || {}).toArray();
      const result = transactions.map(t => this.mapToTransaction(t));
      this.log.debug({ count: result.length, filters }, 'Transactions found');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TransactionRepository:findOne' }) // Cache 5 minutes
  async findOne(filters: Record<string, any>): Promise<Transaction | null> {
    try {
      const collection = await this.getCollection();
      const transaction = await collection.findOne(filters);
      const result = transaction ? this.mapToTransaction(transaction) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('TransactionRepository:*') // Invalider le cache après création
  async create(data: Partial<Transaction>): Promise<Transaction> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const transactionData: OptionalId<Document> = {
        ...data,
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(transactionData);
      const transaction = await collection.findOne({ _id: result.insertedId });
      if (!transaction) {
        throw new Error('Failed to create transaction');
      }
      const mapped = this.mapToTransaction(transaction);
      this.log.info(
        { transactionId: mapped.id, payerId: mapped.payerId },
        'Transaction created successfully'
      );
      return mapped;
    } catch (error) {
      this.log.error({ error, data }, 'Error in create');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('TransactionRepository:*') // Invalider le cache après mise à jour
  async update(
    id: string,
    data: Partial<Transaction>
  ): Promise<Transaction | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<Transaction> = {
        ...data,
        updatedAt: new Date(),
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      const mapped = result?.['value']
        ? this.mapToTransaction(result['value'])
        : null;
      if (mapped) {
        this.log.info(
          { transactionId: id },
          'Transaction updated successfully'
        );
      } else {
        this.log.warn(
          { transactionId: id },
          'Transaction not found for update'
        );
      }
      return mapped;
    } catch (error) {
      this.log.error({ error, transactionId: id, data }, 'Error in update');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('TransactionRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      const deleted = Boolean(result.deletedCount && result.deletedCount > 0);
      if (deleted) {
        this.log.info(
          { transactionId: id },
          'Transaction deleted successfully'
        );
      } else {
        this.log.warn(
          { transactionId: id },
          'Transaction not found for deletion'
        );
      }
      return deleted;
    } catch (error) {
      this.log.error({ error, transactionId: id }, 'Error in delete');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TransactionRepository:count' }) // Cache 5 minutes
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
  @Cacheable(300, { prefix: 'TransactionRepository:exists' }) // Cache 5 minutes
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      const result = count > 0;
      this.log.debug(
        { transactionId: id, exists: result },
        'Exists check completed'
      );
      return result;
    } catch (error) {
      this.log.error({ error, transactionId: id }, 'Error in exists');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TransactionRepository:findWithPagination' }) // Cache 5 minutes
  async findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>> {
    try {
      const collection = await this.getCollection();
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const page = options?.page ?? Math.floor(offset / limit) + 1;
      const sort = options?.sort || { createdAt: -1 };

      const query = filters || {};
      const total = await collection.countDocuments(query);
      const transactions = await collection
        .find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .toArray();

      const result = {
        data: transactions.map(t => this.mapToTransaction(t)),
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
      this.log.debug(
        { count: result.data.length, total, page, limit, filters },
        'findWithPagination completed'
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
  @Cacheable(300, { prefix: 'TransactionRepository:findByPayer' }) // Cache 5 minutes
  async findByPayer(
    payerId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>> {
    return this.findWithPagination({ payerId }, options);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TransactionRepository:findByBeneficiary' }) // Cache 5 minutes
  async findByBeneficiary(
    beneficiaryId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>> {
    return this.findWithPagination({ beneficiaryId }, options);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TransactionRepository:findByStatus' }) // Cache 5 minutes
  async findByStatus(
    status: Transaction['status'],
    options?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>> {
    return this.findWithPagination({ status }, options);
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('TransactionRepository:*') // Invalider le cache après mise à jour du statut
  async updateStatus(
    transactionId: string,
    status: Transaction['status']
  ): Promise<boolean> {
    try {
      const result = await this.update(transactionId, {
        status,
      } as Partial<Transaction>);
      const updated = result !== null;
      if (updated) {
        this.log.info(
          { transactionId, status },
          'Transaction status updated successfully'
        );
      } else {
        this.log.warn(
          { transactionId, status },
          'Transaction not found for status update'
        );
      }
      return updated;
    } catch (error) {
      this.log.error({ error, transactionId, status }, 'Error in updateStatus');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TransactionRepository:findByPaymentIntentId' }) // Cache 5 minutes
  async findByPaymentIntentId(
    paymentIntentId: string
  ): Promise<Transaction | null> {
    try {
      const result = await this.findOne({ paymentIntentId });
      this.log.debug(
        { paymentIntentId, found: !!result },
        'findByPaymentIntentId completed'
      );
      return result;
    } catch (error) {
      this.log.error(
        { error, paymentIntentId },
        'Error in findByPaymentIntentId'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('TransactionRepository:*') // Invalider le cache après mise à jour
  async updateWithMetadata(
    transactionId: string,
    data: {
      status?: TransactionStatus;
      completedAt?: Date;
      failedAt?: Date;
      failureReason?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Transaction | null> {
    try {
      const existingTransaction = await this.findById(transactionId);
      const updateData: Partial<Transaction> = {
        ...(data.status && { status: data.status }),
        ...(data.completedAt && { completedAt: data.completedAt }),
        ...(data.failedAt && { failedAt: data.failedAt }),
        ...(data.failureReason && { failureReason: data.failureReason }),
        ...(data.metadata && {
          metadata: {
            ...(existingTransaction?.metadata || {}),
            ...data.metadata,
          },
        }),
      };
      const result = await this.update(transactionId, updateData);
      if (result) {
        this.log.info(
          { transactionId, updatedFields: Object.keys(data) },
          'Transaction metadata updated successfully'
        );
      }
      return result;
    } catch (error) {
      this.log.error(
        { error, transactionId, data },
        'Error in updateWithMetadata'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, {
    prefix: 'TransactionRepository:findTransactionsWithFilters',
  }) // Cache 5 minutes
  async findTransactionsWithFilters(
    filters: TransactionFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>> {
    try {
      // Utiliser TransactionQueryBuilder pour construire la requête
      const queryBuilder = this.buildTransactionQuery(filters, options);
      const query = queryBuilder.build();

      const result = await this.findWithPagination(
        query.filters,
        query.pagination
      );
      this.log.debug(
        { count: result.data.length, total: result.total, filters },
        'findTransactionsWithFilters completed'
      );
      return result;
    } catch (error) {
      this.log.error(
        { error, filters, options },
        'Error in findTransactionsWithFilters'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Construire une requête transaction avec TransactionQueryBuilder
   */
  private buildTransactionQuery(
    filters: TransactionFilters,
    options?: PaginationOptions
  ): TransactionQueryBuilder {
    const builder = new TransactionQueryBuilder();

    // Appliquer les filtres
    if (filters.payerId) {
      builder.byPayer(filters.payerId);
    }
    if (filters.beneficiaryId) {
      builder.byBeneficiary(filters.beneficiaryId);
    }
    if (filters.status) {
      builder.byStatus(filters.status);
    }
    if (filters.paymentMethod) {
      builder.byPaymentMethod(filters.paymentMethod);
    }
    if (filters.paymentProvider) {
      builder.byPaymentProvider(filters.paymentProvider);
    }
    if (filters.serviceType) {
      builder.byServiceType(filters.serviceType);
    }
    if (filters.serviceId) {
      builder.where('serviceId', filters.serviceId);
    }
    if (filters.currency) {
      builder.byCurrency(filters.currency);
    }
    if (filters.dateFrom || filters.dateTo) {
      if (filters.dateFrom && filters.dateTo) {
        builder.createdBetween(filters.dateFrom, filters.dateTo);
      } else if (filters.dateFrom) {
        builder.createdAfter(filters.dateFrom);
      } else if (filters.dateTo) {
        builder.createdBefore(filters.dateTo);
      }
    }
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      if (filters.minAmount !== undefined && filters.maxAmount !== undefined) {
        builder.amountBetween(filters.minAmount, filters.maxAmount);
      } else if (filters.minAmount !== undefined) {
        builder.minAmount(filters.minAmount);
      } else if (filters.maxAmount !== undefined) {
        builder.maxAmount(filters.maxAmount);
      }
    }

    // Appliquer la pagination
    if (options) {
      if (options.limit) {
        builder.limit(options.limit);
      }
      if (options.offset) {
        builder.offset(options.offset);
      }
      if (options.page && options.limit) {
        builder.page(options.page, options.limit);
      }
      if (options.sort) {
        Object.entries(options.sort).forEach(([field, direction]) => {
          builder.orderBy(field, direction === 1 ? 'asc' : 'desc');
        });
      }
    }

    return builder;
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TransactionRepository:calculateTotalByUser' }) // Cache 5 minutes
  async calculateTotalByUser(
    userId: string,
    filters?: TransactionFilters
  ): Promise<number> {
    try {
      const collection = await this.getCollection();
      const query: Record<string, any> = {
        $or: [{ payerId: userId }, { beneficiaryId: userId }],
      };

      // Appliquer les filtres additionnels
      if (filters) {
        if (filters.status) {
          query['status'] = filters.status;
        }
        if (filters.currency) {
          query['currency'] = filters.currency;
        }
      }

      const pipeline = [
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ];

      const result = await collection.aggregate(pipeline).toArray();
      const total = result[0]?.['total'] || 0;
      this.log.debug(
        { userId, total, filters },
        'calculateTotalByUser completed'
      );
      return total;
    } catch (error) {
      this.log.error(
        { error, userId, filters },
        'Error in calculateTotalByUser'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mapper un document MongoDB vers un objet Transaction
   */
  private mapToTransaction(doc: any): Transaction {
    return {
      id: doc._id?.toString() || doc.id,
      _id: doc._id?.toString(),
      payerId: doc.payerId,
      beneficiaryId: doc.beneficiaryId,
      amount: doc.amount,
      currency: doc.currency,
      exchangeRate: doc.exchangeRate,
      fees: doc.fees || 0,
      totalAmount: doc.totalAmount || doc.amount,
      serviceType: doc.serviceType,
      serviceId: doc.serviceId,
      description: doc.description,
      status: doc.status,
      paymentMethod: doc.paymentMethod,
      paymentProvider: doc.paymentProvider,
      paymentIntentId: doc.paymentIntentId,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      completedAt: doc.completedAt,
      failedAt: doc.failedAt,
      failureReason: doc.failureReason,
    };
  }
}
