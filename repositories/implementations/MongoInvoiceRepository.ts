/**
 * Implémentation MongoDB du repository invoice
 */

import { InvoiceQueryBuilder } from '@/builders';
import { mongoClient } from '@/lib/mongodb';
import { Document, ObjectId, OptionalId } from 'mongodb';
import {
  IInvoiceRepository,
  Invoice,
  InvoiceFilters,
} from '../interfaces/IInvoiceRepository';
import { PaginatedResult, PaginationOptions } from '../interfaces/IRepository';

export class MongoInvoiceRepository implements IInvoiceRepository {
  private readonly collectionName = 'invoices';

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  async findById(id: string): Promise<Invoice | null> {
    try {
      const collection = await this.getCollection();
      const invoice = await collection.findOne({ _id: new ObjectId(id) });
      return invoice ? this.mapToInvoice(invoice) : null;
    } catch (error) {
      console.error('[MongoInvoiceRepository] Error in findById:', error);
      throw error;
    }
  }

  async findAll(filters?: Record<string, any>): Promise<Invoice[]> {
    try {
      const collection = await this.getCollection();
      const invoices = await collection.find(filters || {}).toArray();
      return invoices.map(i => this.mapToInvoice(i));
    } catch (error) {
      console.error('[MongoInvoiceRepository] Error in findAll:', error);
      throw error;
    }
  }

  async findOne(filters: Record<string, any>): Promise<Invoice | null> {
    try {
      const collection = await this.getCollection();
      const invoice = await collection.findOne(filters);
      return invoice ? this.mapToInvoice(invoice) : null;
    } catch (error) {
      console.error('[MongoInvoiceRepository] Error in findOne:', error);
      throw error;
    }
  }

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
      return this.mapToInvoice(invoice);
    } catch (error) {
      console.error('[MongoInvoiceRepository] Error in create:', error);
      throw error;
    }
  }

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
      console.error('[MongoInvoiceRepository] Error in update:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return Boolean(result.deletedCount && result.deletedCount > 0);
    } catch (error) {
      console.error('[MongoInvoiceRepository] Error in delete:', error);
      throw error;
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      return collection.countDocuments(filters || {});
    } catch (error) {
      console.error('[MongoInvoiceRepository] Error in count:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      return count > 0;
    } catch (error) {
      console.error('[MongoInvoiceRepository] Error in exists:', error);
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
      console.error('[MongoInvoiceRepository] Error in findWithPagination:', error);
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

  async findOverdue(options?: PaginationOptions): Promise<PaginatedResult<Invoice>> {
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
      console.error('[MongoInvoiceRepository] Error in findOverdue:', error);
      throw error;
    }
  }

  async generateInvoiceNumber(): Promise<string> {
    try {
      const collection = await this.getCollection();
      const year = new Date().getFullYear();
      const prefix = `INV-${year}-`;
      
      // Trouver le dernier numéro de facture de l'année
      const lastInvoice = await collection
        .findOne(
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
      console.error('[MongoInvoiceRepository] Error in generateInvoiceNumber:', error);
      throw error;
    }
  }

  async updateStatus(
    invoiceId: string,
    status: Invoice['status']
  ): Promise<boolean> {
    try {
      const result = await this.update(invoiceId, { status } as Partial<Invoice>);
      return result !== null;
    } catch (error) {
      console.error('[MongoInvoiceRepository] Error in updateStatus:', error);
      throw error;
    }
  }

  async markAsPaid(invoiceId: string, paidAt: Date): Promise<boolean> {
    try {
      const result = await this.update(invoiceId, {
        status: 'PAID',
        paidAt,
      } as Partial<Invoice>);
      return result !== null;
    } catch (error) {
      console.error('[MongoInvoiceRepository] Error in markAsPaid:', error);
      throw error;
    }
  }

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
      console.error('[MongoInvoiceRepository] Error in findInvoicesWithFilters:', error);
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

