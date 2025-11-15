/**
 * Implémentation MongoDB du repository booking
 */

import { BookingQueryBuilder } from '@/builders';
import { mongoClient } from '@/lib/mongodb';
import { Document, ObjectId, OptionalId } from 'mongodb';
import {
  Booking,
  BookingFilters,
  IBookingRepository,
} from '../interfaces/IBookingRepository';
import { PaginatedResult, PaginationOptions } from '../interfaces/IRepository';

export class MongoBookingRepository implements IBookingRepository {
  private readonly collectionName = 'bookings';

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  async findById(id: string): Promise<Booking | null> {
    try {
      const collection = await this.getCollection();
      const booking = await collection.findOne({ _id: new ObjectId(id) });
      return booking ? this.mapToBooking(booking) : null;
    } catch (error) {
      console.error('[MongoBookingRepository] Error in findById:', error);
      throw error;
    }
  }

  async findAll(filters?: Record<string, any>): Promise<Booking[]> {
    try {
      const collection = await this.getCollection();
      const bookings = await collection.find(filters || {}).toArray();
      return bookings.map(b => this.mapToBooking(b));
    } catch (error) {
      console.error('[MongoBookingRepository] Error in findAll:', error);
      throw error;
    }
  }

  async findOne(filters: Record<string, any>): Promise<Booking | null> {
    try {
      const collection = await this.getCollection();
      const booking = await collection.findOne(filters);
      return booking ? this.mapToBooking(booking) : null;
    } catch (error) {
      console.error('[MongoBookingRepository] Error in findOne:', error);
      throw error;
    }
  }

  async create(data: Partial<Booking>): Promise<Booking> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const bookingData: OptionalId<Document> = {
        ...data,
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(bookingData);
      const booking = await collection.findOne({ _id: result.insertedId });
      if (!booking) {
        throw new Error('Failed to create booking');
      }
      return this.mapToBooking(booking);
    } catch (error) {
      console.error('[MongoBookingRepository] Error in create:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Booking>): Promise<Booking | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<Booking> = {
        ...data,
        updatedAt: new Date(),
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      return result?.['value'] ? this.mapToBooking(result['value']) : null;
    } catch (error) {
      console.error('[MongoBookingRepository] Error in update:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return Boolean(result.deletedCount && result.deletedCount > 0);
    } catch (error) {
      console.error('[MongoBookingRepository] Error in delete:', error);
      throw error;
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      return collection.countDocuments(filters || {});
    } catch (error) {
      console.error('[MongoBookingRepository] Error in count:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      return count > 0;
    } catch (error) {
      console.error('[MongoBookingRepository] Error in exists:', error);
      throw error;
    }
  }

  async findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Booking>> {
    try {
      const collection = await this.getCollection();
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const page = options?.page ?? Math.floor(offset / limit) + 1;
      const sort = options?.sort || { createdAt: -1 };

      const query = filters || {};
      const total = await collection.countDocuments(query);
      const bookings = await collection
        .find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .toArray();

      return {
        data: bookings.map(b => this.mapToBooking(b)),
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error('[MongoBookingRepository] Error in findWithPagination:', error);
      throw error;
    }
  }

  async findByRequester(
    requesterId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Booking>> {
    return this.findWithPagination({ requesterId }, options);
  }

  async findByProvider(
    providerId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Booking>> {
    return this.findWithPagination({ providerId }, options);
  }

  async findByStatus(
    status: Booking['status'],
    options?: PaginationOptions
  ): Promise<PaginatedResult<Booking>> {
    return this.findWithPagination({ status }, options);
  }

  async findUpcoming(options?: PaginationOptions): Promise<PaginatedResult<Booking>> {
    try {
      const now = new Date();
      return this.findWithPagination(
        {
          status: { $in: ['PENDING', 'CONFIRMED'] },
          appointmentDate: { $gte: now },
        },
        options
      );
    } catch (error) {
      console.error('[MongoBookingRepository] Error in findUpcoming:', error);
      throw error;
    }
  }

  async updateStatus(
    bookingId: string,
    status: Booking['status']
  ): Promise<boolean> {
    try {
      const result = await this.update(bookingId, { status } as Partial<Booking>);
      return result !== null;
    } catch (error) {
      console.error('[MongoBookingRepository] Error in updateStatus:', error);
      throw error;
    }
  }

  async findBookingsWithFilters(
    filters: BookingFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Booking>> {
    try {
      // Utiliser BookingQueryBuilder pour construire la requête
      const queryBuilder = this.buildBookingQuery(filters, options);
      const query = queryBuilder.build();

      return this.findWithPagination(query.filters, query.pagination);
    } catch (error) {
      console.error('[MongoBookingRepository] Error in findBookingsWithFilters:', error);
      throw error;
    }
  }

  /**
   * Construire une requête booking avec BookingQueryBuilder
   */
  private buildBookingQuery(
    filters: BookingFilters,
    options?: PaginationOptions
  ): BookingQueryBuilder {
    const builder = new BookingQueryBuilder();

    // Appliquer les filtres
    if (filters.requesterId) {
      builder.byRequester(filters.requesterId);
    }
    if (filters.providerId) {
      builder.byProvider(filters.providerId);
    }
    if (filters.serviceId) {
      builder.byService(filters.serviceId);
    }
    if (filters.serviceType) {
      builder.byServiceType(filters.serviceType);
    }
    if (filters.status) {
      builder.byStatus(filters.status);
    }
    if (filters.dateFrom || filters.dateTo) {
      if (filters.dateFrom && filters.dateTo) {
        builder.betweenDates(filters.dateFrom, filters.dateTo);
      } else if (filters.dateFrom) {
        builder.whereGreaterThanOrEqual('appointmentDate', filters.dateFrom);
      } else if (filters.dateTo) {
        builder.whereLessThanOrEqual('appointmentDate', filters.dateTo);
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
   * Mapper un document MongoDB vers un objet Booking
   */
  private mapToBooking(doc: any): Booking {
    return {
      id: doc._id?.toString() || doc.id,
      _id: doc._id?.toString(),
      requesterId: doc.requesterId || doc.userId,
      providerId: doc.providerId,
      serviceId: doc.serviceId,
      serviceType: doc.serviceType || 'HEALTH',
      status: this.mapStatus(doc.status),
      appointmentDate: doc.appointmentDate || doc.date,
      timeslot: doc.timeslot,
      consultationMode: doc.consultationMode,
      recipient: doc.recipient || doc.beneficiary,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Mapper le statut depuis le format MongoDB vers le format Booking
   */
  private mapStatus(status: string): Booking['status'] {
    const statusMap: Record<string, Booking['status']> = {
      pending: 'PENDING',
      confirmed: 'CONFIRMED',
      cancelled: 'CANCELLED',
      completed: 'COMPLETED',
      no_show: 'NO_SHOW',
    };
    return statusMap[status.toLowerCase()] || 'PENDING';
  }
}

