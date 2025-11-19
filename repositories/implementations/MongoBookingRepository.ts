/**
 * Implémentation MongoDB du repository booking
 * Implémente les design patterns :
 * - Repository Pattern
 * - Dependency Injection
 * - Logger Pattern (structured logging avec childLogger)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Error Handling Pattern (Sentry)
 */

import { BookingQueryBuilder } from '@/builders';
import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import { mongoClient } from '@/lib/mongodb';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import type {
  Booking,
  BookingFilters,
  IBookingRepository,
} from '../interfaces/IBookingRepository';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';

export class MongoBookingRepository implements IBookingRepository {
  private readonly collectionName = 'bookings';
  private readonly log = childLogger({
    component: 'MongoBookingRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BookingRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<Booking | null> {
    try {
      const collection = await this.getCollection();
      const booking = await collection.findOne({ _id: new ObjectId(id) });
      const result = booking ? this.mapToBooking(booking) : null;
      if (result) {
        this.log.debug({ bookingId: id }, 'Booking found');
      } else {
        this.log.debug({ bookingId: id }, 'Booking not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, id }, 'Error in findById');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoBookingRepository', action: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BookingRepository:findAll' }) // Cache 5 minutes
  async findAll(filters?: Record<string, any>): Promise<Booking[]> {
    try {
      const collection = await this.getCollection();
      const bookings = await collection.find(filters || {}).toArray();
      const result = bookings.map(b => this.mapToBooking(b));
      this.log.debug({ count: result.length, filters }, 'Bookings found');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoBookingRepository', action: 'findAll' },
        extra: { filters },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BookingRepository:findOne' }) // Cache 5 minutes
  async findOne(filters: Record<string, any>): Promise<Booking | null> {
    try {
      const collection = await this.getCollection();
      const booking = await collection.findOne(filters);
      const result = booking ? this.mapToBooking(booking) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoBookingRepository', action: 'findOne' },
        extra: { filters },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BookingRepository:*') // Invalider le cache après création
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
      const mappedBooking = this.mapToBooking(booking);
      this.log.info(
        { bookingId: mappedBooking.id, requesterId: mappedBooking.requesterId },
        'Booking created successfully',
      );
      return mappedBooking;
    } catch (error) {
      this.log.error(
        { error, requesterId: data.requesterId },
        'Error in create',
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoBookingRepository', action: 'create' },
        extra: { requesterId: data.requesterId },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BookingRepository:*') // Invalider le cache après mise à jour
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
        { returnDocument: 'after' },
      );
      return result?.['value'] ? this.mapToBooking(result['value']) : null;
    } catch (error) {
      this.log.error({ error, id, data }, 'Error in update');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoBookingRepository', action: 'update' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BookingRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return Boolean(result.deletedCount && result.deletedCount > 0);
    } catch (error) {
      this.log.error({ error, id }, 'Error in delete');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoBookingRepository', action: 'delete' },
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
        tags: { component: 'MongoBookingRepository', action: 'count' },
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
        tags: { component: 'MongoBookingRepository', action: 'exists' },
        extra: { id },
      });
      throw error;
    }
  }

  async findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions,
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
      this.log.error(
        { error, filters, options },
        'Error in findWithPagination',
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoBookingRepository',
          action: 'findWithPagination',
        },
        extra: { filters, options },
      });
      throw error;
    }
  }

  async findByRequester(
    requesterId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Booking>> {
    return this.findWithPagination({ requesterId }, options);
  }

  async findByProvider(
    providerId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Booking>> {
    return this.findWithPagination({ providerId }, options);
  }

  async findByStatus(
    status: Booking['status'],
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Booking>> {
    return this.findWithPagination({ status }, options);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BookingRepository:findUpcoming' }) // Cache 5 minutes
  async findUpcoming(
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Booking>> {
    try {
      const now = new Date();
      return this.findWithPagination(
        {
          status: { $in: ['PENDING', 'CONFIRMED'] },
          appointmentDate: { $gte: now },
        },
        options,
      );
    } catch (error) {
      this.log.error({ error }, 'Error in findUpcoming');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoBookingRepository', action: 'findUpcoming' },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BookingRepository:*') // Invalider le cache après changement de statut
  async updateStatus(
    bookingId: string,
    status: Booking['status'],
  ): Promise<boolean> {
    try {
      const result = await this.update(bookingId, {
        status,
      } as Partial<Booking>);
      return result !== null;
    } catch (error) {
      this.log.error({ error, bookingId, status }, 'Error in updateStatus');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoBookingRepository', action: 'updateStatus' },
        extra: { bookingId, status },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BookingRepository:findBookingsWithFilters' }) // Cache 5 minutes
  async findBookingsWithFilters(
    filters: BookingFilters,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Booking>> {
    try {
      // Utiliser BookingQueryBuilder pour construire la requête
      const queryBuilder = this.buildBookingQuery(filters, options);
      const query = queryBuilder.build();

      return this.findWithPagination(query.filters, query.pagination);
    } catch (error) {
      this.log.error(
        { error, filters, options },
        'Error in findBookingsWithFilters',
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoBookingRepository',
          action: 'findBookingsWithFilters',
        },
        extra: { filters, options },
      });
      throw error;
    }
  }

  /**
   * Construire une requête booking avec BookingQueryBuilder
   */
  private buildBookingQuery(
    filters: BookingFilters,
    options?: PaginationOptions,
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
      builder.byStatus(
        filters.status as
          | 'PENDING'
          | 'CONFIRMED'
          | 'COMPLETED'
          | 'CANCELLED'
          | 'NO_SHOW',
      );
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
