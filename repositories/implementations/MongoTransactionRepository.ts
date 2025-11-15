/**
 * Implémentation MongoDB du repository transaction
 */

import { TransactionQueryBuilder } from '@/builders';
import { mongoClient } from '@/lib/mongodb';
import { Document, ObjectId, OptionalId } from 'mongodb';
import { PaginatedResult, PaginationOptions } from '../interfaces/IRepository';
import {
  ITransactionRepository,
  Transaction,
  TransactionFilters,
} from '../interfaces/ITransactionRepository';

export class MongoTransactionRepository implements ITransactionRepository {
  private readonly collectionName = 'transactions';

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  async findById(id: string): Promise<Transaction | null> {
    try {
      const collection = await this.getCollection();
      const transaction = await collection.findOne({ _id: new ObjectId(id) });
      return transaction ? this.mapToTransaction(transaction) : null;
    } catch (error) {
      console.error('[MongoTransactionRepository] Error in findById:', error);
      throw error;
    }
  }

  async findAll(filters?: Record<string, any>): Promise<Transaction[]> {
    try {
      const collection = await this.getCollection();
      const transactions = await collection.find(filters || {}).toArray();
      return transactions.map(t => this.mapToTransaction(t));
    } catch (error) {
      console.error('[MongoTransactionRepository] Error in findAll:', error);
      throw error;
    }
  }

  async findOne(filters: Record<string, any>): Promise<Transaction | null> {
    try {
      const collection = await this.getCollection();
      const transaction = await collection.findOne(filters);
      return transaction ? this.mapToTransaction(transaction) : null;
    } catch (error) {
      console.error('[MongoTransactionRepository] Error in findOne:', error);
      throw error;
    }
  }

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
      return this.mapToTransaction(transaction);
    } catch (error) {
      console.error('[MongoTransactionRepository] Error in create:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Transaction>): Promise<Transaction | null> {
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
      return result?.['value'] ? this.mapToTransaction(result['value']) : null;
    } catch (error) {
      console.error('[MongoTransactionRepository] Error in update:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return Boolean(result.deletedCount && result.deletedCount > 0);
    } catch (error) {
      console.error('[MongoTransactionRepository] Error in delete:', error);
      throw error;
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      return collection.countDocuments(filters || {});
    } catch (error) {
      console.error('[MongoTransactionRepository] Error in count:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      return count > 0;
    } catch (error) {
      console.error('[MongoTransactionRepository] Error in exists:', error);
      throw error;
    }
  }

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

      return {
        data: transactions.map(t => this.mapToTransaction(t)),
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error('[MongoTransactionRepository] Error in findWithPagination:', error);
      throw error;
    }
  }

  async findByPayer(
    payerId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>> {
    return this.findWithPagination({ payerId }, options);
  }

  async findByBeneficiary(
    beneficiaryId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>> {
    return this.findWithPagination({ beneficiaryId }, options);
  }

  async findByStatus(
    status: Transaction['status'],
    options?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>> {
    return this.findWithPagination({ status }, options);
  }

  async updateStatus(
    transactionId: string,
    status: Transaction['status']
  ): Promise<boolean> {
    try {
      const result = await this.update(transactionId, { status } as Partial<Transaction>);
      return result !== null;
    } catch (error) {
      console.error('[MongoTransactionRepository] Error in updateStatus:', error);
      throw error;
    }
  }

  async findTransactionsWithFilters(
    filters: TransactionFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>> {
    try {
      // Utiliser TransactionQueryBuilder pour construire la requête
      const queryBuilder = this.buildTransactionQuery(filters, options);
      const query = queryBuilder.build();

      return this.findWithPagination(query.filters, query.pagination);
    } catch (error) {
      console.error('[MongoTransactionRepository] Error in findTransactionsWithFilters:', error);
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
      return result[0]?.['total'] || 0;  // eslint-disable-line no-unused-expressions
    } catch (error) {
      console.error('[MongoTransactionRepository] Error in calculateTotalByUser:', error);
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

