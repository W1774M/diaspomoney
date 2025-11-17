/**
 * Implémentation MongoDB du repository invoice
 * Implémente les design patterns :
 * - Repository Pattern
 * - Dependency Injection
 * - Logger Pattern (structured logging avec childLogger)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Error Handling Pattern (Sentry)
 */

import { InvoiceQueryBuilder } from '@/builders';
import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import { mongoClient } from '@/lib/mongodb';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import type {
  IInvoiceRepository,
  Invoice,
  InvoiceFilters,
} from '../interfaces/IInvoiceRepository';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';

export class MongoInvoiceRepository implements IInvoiceRepository {
  private readonly collectionName = 'invoices';
  private readonly log = childLogger({
    component: 'MongoInvoiceRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'InvoiceRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<Invoice | null> {
    try {
      const collection = await this.getCollection();
      const invoice = await collection.findOne({ _id: new ObjectId(id) });
      const result = invoice ? this.mapToInvoice(invoice) : null;
      if (result) {
        this.log.debug({ invoiceId: id }, 'Invoice found');
      } else {
        this.log.debug({ invoiceId: id }, 'Invoice not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, id }, 'Error in findById');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoInvoiceRepository', action: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'InvoiceRepository:findAll' }) // Cache 5 minutes
  async findAll(filters?: Record<string, any>): Promise<Invoice[]> {
    try {
      const collection = await this.getCollection();
      const invoices = await collection.find(filters || {}).toArray();
      const result = invoices.map(i => this.mapToInvoice(i));
      this.log.debug({ count: result.length, filters }, 'Invoices found');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoInvoiceRepository', action: 'findAll' },
        extra: { filters },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'InvoiceRepository:findOne' }) // Cache 5 minutes
  async findOne(filters: Record<string, any>): Promise<Invoice | null> {
    try {
      const collection = await this.getCollection();
      const invoice = await collection.findOne(filters);
      const result = invoice ? this.mapToInvoice(invoice) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoInvoiceRepository', action: 'findOne' },
        extra: { filters },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('InvoiceRepository:*') // Invalider le cache après création
  async create(data: Partial<Invoice>): Promise<Invoice> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      // Générer un numéro de facture si non fourni
      if (!data.invoiceNumber) {
        data.invoiceNumber = await this.generateInvoiceNumber();
      }

      const invoiceData: OptionalId<Document> = {
        ...data,
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(invoiceData);
      const invoice = await collection.findOne({ _id: result.insertedId });
      if (!invoice) {
        throw new Error('Failed to create invoice');
      }
      const mappedInvoice = this.mapToInvoice(invoice);
      this.log.info(
        {
          invoiceId: mappedInvoice.id,
          invoiceNumber: mappedInvoice.invoiceNumber,
        },
        'Invoice created successfully'
      );
      return mappedInvoice;
    } catch (error) {
      this.log.error({ error }, 'Error in create');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoInvoiceRepository', action: 'create' },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('InvoiceRepository:*') // Invalider le cache après mise à jour
  async update(id: string, data: Partial<Invoice>): Promise<Invoice | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<Invoice> = {
        ...data,
        updatedAt: new Date(),
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      return result?.['value'] ? this.mapToInvoice(result['value']) : null;
    } catch (error) {
      this.log.error({ error, id, data }, 'Error in update');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoInvoiceRepository', action: 'update' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('InvoiceRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return Boolean(result.deletedCount && result.deletedCount > 0);
    } catch (error) {
      this.log.error({ error, id }, 'Error in delete');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoInvoiceRepository', action: 'delete' },
        extra: { id },
      });
      throw error;
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      return collection.countDocuments(filters || {});
    } catch (error) {
      this.log.error({ error, filters }, 'Error in count');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoInvoiceRepository', action: 'count' },
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
        tags: { component: 'MongoInvoiceRepository', action: 'exists' },
        extra: { id },
      });
      throw error;
    }
  }

  async findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Invoice>> {
    try {
      const collection = await this.getCollection();
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const page = options?.page ?? Math.floor(offset / limit) + 1;
      const sort = options?.sort || { createdAt: -1 };

      const query = filters || {};
      const total = await collection.countDocuments(query);
      const invoices = await collection
        .find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .toArray();

      return {
        data: invoices.map(i => this.mapToInvoice(i)),
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
          component: 'MongoInvoiceRepository',
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
  ): Promise<PaginatedResult<Invoice>> {
    return this.findWithPagination({ userId }, options);
  }

  async findByStatus(
    status: Invoice['status'],
    options?: PaginationOptions
  ): Promise<PaginatedResult<Invoice>> {
    return this.findWithPagination({ status }, options);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'InvoiceRepository:findOverdue' }) // Cache 5 minutes
  async findOverdue(
    options?: PaginationOptions
  ): Promise<PaginatedResult<Invoice>> {
    try {
      const now = new Date();
      return this.findWithPagination(
        {
          status: { $in: ['PENDING', 'SENT'] },
          dueDate: { $lt: now },
        },
        options
      );
    } catch (error) {
      this.log.error({ error }, 'Error in findOverdue');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoInvoiceRepository', action: 'findOverdue' },
      });
      throw error;
    }
  }

  async generateInvoiceNumber(): Promise<string> {
    try {
      const collection = await this.getCollection();
      const year = new Date().getFullYear();
      const prefix = `INV-${year}-`;

      // Trouver le dernier numéro de facture de l'année
      const lastInvoice = await collection.findOne(
        { invoiceNumber: { $regex: `^${prefix}` } },
        { sort: { invoiceNumber: -1 } }
      );

      let sequence = 1;
      if (lastInvoice?.['invoiceNumber']) {
        const lastSequence = parseInt(
          lastInvoice['invoiceNumber'].replace(prefix, ''),
          10
        );
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }

      return `${prefix}${sequence.toString().padStart(6, '0')}`;
    } catch (error) {
      this.log.error({ error }, 'Error in generateInvoiceNumber');
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoInvoiceRepository',
          action: 'generateInvoiceNumber',
        },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('InvoiceRepository:*') // Invalider le cache après changement de statut
  async updateStatus(
    invoiceId: string,
    status: Invoice['status']
  ): Promise<boolean> {
    try {
      const result = await this.update(invoiceId, {
        status,
      } as Partial<Invoice>);
      return result !== null;
    } catch (error) {
      this.log.error({ error, invoiceId, status }, 'Error in updateStatus');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoInvoiceRepository', action: 'updateStatus' },
        extra: { invoiceId, status },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('InvoiceRepository:*') // Invalider le cache après paiement
  async markAsPaid(invoiceId: string, paidAt: Date): Promise<boolean> {
    try {
      const result = await this.update(invoiceId, {
        status: 'PAID',
        paidAt,
      } as Partial<Invoice>);
      return result !== null;
    } catch (error) {
      this.log.error({ error, invoiceId, paidAt }, 'Error in markAsPaid');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoInvoiceRepository', action: 'markAsPaid' },
        extra: { invoiceId },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'InvoiceRepository:findInvoicesWithFilters' }) // Cache 5 minutes
  async findInvoicesWithFilters(
    filters: InvoiceFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Invoice>> {
    try {
      // Utiliser InvoiceQueryBuilder pour construire la requête
      const queryBuilder = this.buildInvoiceQuery(filters, options);
      const query = queryBuilder.build();

      return this.findWithPagination(query.filters, query.pagination);
    } catch (error) {
      this.log.error(
        { error, filters, options },
        'Error in findInvoicesWithFilters'
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoInvoiceRepository',
          action: 'findInvoicesWithFilters',
        },
        extra: { filters, options },
      });
      throw error;
    }
  }

  /**
   * Construire une requête invoice avec InvoiceQueryBuilder
   */
  private buildInvoiceQuery(
    filters: InvoiceFilters,
    options?: PaginationOptions
  ): InvoiceQueryBuilder {
    const builder = new InvoiceQueryBuilder();

    // Appliquer les filtres
    if (filters.userId) {
      builder.byUser(filters.userId);
    }
    if (filters.transactionId) {
      builder.byTransaction(filters.transactionId);
    }
    if (filters.bookingId) {
      builder.byBooking(filters.bookingId);
    }
    if (filters.status) {
      builder.byStatus(filters.status);
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

  /**
   * Mapper un document MongoDB vers un objet Invoice
   */
  private mapToInvoice(doc: any): Invoice {
    return {
      id: doc._id?.toString() || doc.id,
      _id: doc._id?.toString(),
      invoiceNumber: doc.invoiceNumber,
      userId: doc.userId || doc.customerId,
      transactionId: doc.transactionId,
      bookingId: doc.bookingId,
      amount: doc.amount,
      currency: doc.currency || 'EUR',
      tax: doc.tax || 0,
      totalAmount: doc.totalAmount || doc.amount + (doc.tax || 0),
      status: this.mapStatus(doc.status),
      dueDate: doc.dueDate,
      paidAt: doc.paidAt || doc.paymentDate,
      items: doc.items || [],
      billingAddress: doc.billingAddress,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Mapper le statut depuis le format MongoDB vers le format Invoice
   */
  private mapStatus(status: string): Invoice['status'] {
    const statusMap: Record<string, Invoice['status']> = {
      draft: 'DRAFT',
      sent: 'PENDING',
      pending: 'PENDING',
      paid: 'PAID',
      overdue: 'OVERDUE',
      cancelled: 'CANCELLED',
    };
    return statusMap[status.toLowerCase()] || 'DRAFT';
  }
}
