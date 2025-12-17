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
import { BOOKING_STATUSES } from '@/lib/constants';
import { mongoClient } from '@/lib/mongodb';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import type {
  Booking,
  BookingFilters,
  IBookingRepository,
} from '../interfaces/IBookingRepository';
import type {
  PaginatedFindResult,
  PaginationOptions,
} from '@/lib/types';

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

  /**
   * Générer un numéro de réservation unique
   * Format: RES-YYYY-NNNN (ex: RES-2025-0001)
   */
  private async generateReservationNumber(): Promise<string> {
    try {
      const collection = await this.getCollection();
      const year = new Date().getFullYear();
      const prefix = `RES-${year}-`;

      // Trouver le dernier numéro de l'année
      const lastBooking = await collection.findOne(
        { reservationNumber: { $regex: `^${prefix}` } },
        { sort: { reservationNumber: -1 } },
      );

      let sequence = 1;
      if (lastBooking && lastBooking['reservationNumber']) {
        const lastNumber = lastBooking['reservationNumber'].replace(prefix, '');
        const parsed = parseInt(lastNumber, 10);
        if (!isNaN(parsed)) {
          sequence = parsed + 1;
        }
      }

      return `${prefix}${sequence.toString().padStart(4, '0')}`;
    } catch (error) {
      this.log.error({ error }, 'Error in generateReservationNumber');
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoBookingRepository',
          action: 'generateReservationNumber',
        },
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
      
      // Générer un numéro de réservation si non fourni
      if (!data.reservationNumber) {
        data.reservationNumber = await this.generateReservationNumber();
      }
      
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
      
      // Vérifier si le document a été trouvé et mis à jour
      if (!result || !result['value']) {
        this.log.warn({ id, data }, 'Document not found during update');
        return null;
      }
      
      try {
        const mapped = this.mapToBooking(result['value']);
        return mapped;
      } catch (mappingError) {
        this.log.error(
          { error: mappingError, id, rawDocument: result['value'] },
          'Error mapping booking document',
        );
        // Si le mapping échoue, on retourne null plutôt que de lancer une erreur
        // pour permettre au service de gérer l'erreur de manière appropriée
        return null;
      }
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
  ): Promise<PaginatedFindResult<Booking>> {
    try {
      const collection = await this.getCollection();
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const page = options?.page ?? Math.floor(offset / limit) + 1;
      const sort = options?.sort || { createdAt: -1 };

      const query = filters || {};
      
      // Vérifier si on trie par metadata.totalAmount (montant stocké comme string)
      const sortKeys = Object.keys(sort);
      const isSortingByAmount = sortKeys.includes('metadata.totalAmount');
      
      let bookings: any[];
      let total: number;

      const isSortingByCompletionRate = sort['metadata.currentStep'] !== undefined;

      if (isSortingByAmount) {
        // Utiliser un pipeline d'agrégation pour convertir le montant en nombre avant de trier
        const sortDirection = sort['metadata.totalAmount'] === 1 ? 1 : -1;
        
        const pipeline: any[] = [
          { $match: query },
          {
            $addFields: {
              // Convertir metadata.totalAmount en nombre
              // Gérer les cas où c'est une string (avec ou sans espaces, caractères non numériques)
              // ou un nombre
              numericAmount: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: [{ $type: '$metadata.totalAmount' }, 'string'] },
                      then: {
                        $toDouble: {
                          $ifNull: [
                            {
                              $replaceAll: {
                                input: {
                                  $replaceAll: {
                                    input: {
                                      $replaceAll: {
                                        input: { $ifNull: ['$metadata.totalAmount', '0'] },
                                        find: ' ',
                                        replacement: '',
                                      },
                                    },
                                    find: '€',
                                    replacement: '',
                                  },
                                },
                                find: ',',
                                replacement: '.',
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                    {
                      case: { $eq: [{ $type: '$metadata.totalAmount' }, 'number'] },
                      then: { $ifNull: ['$metadata.totalAmount', 0] },
                    },
                    {
                      case: { $eq: [{ $type: '$metadata.totalAmount' }, 'double'] },
                      then: { $ifNull: ['$metadata.totalAmount', 0] },
                    },
                    {
                      case: { $eq: [{ $type: '$metadata.totalAmount' }, 'int'] },
                      then: { $ifNull: ['$metadata.totalAmount', 0] },
                    },
                  ],
                  default: 0,
                },
              },
            },
          },
          { $sort: { numericAmount: sortDirection } },
          { $skip: offset },
          { $limit: limit },
          {
            $project: {
              numericAmount: 0, // Exclure le champ temporaire du résultat
            },
          },
        ];
        
        // Compter le total
        const countPipeline = [
          { $match: query },
          { $count: 'total' },
        ];
        const countResult = await collection.aggregate(countPipeline).toArray();
        total = countResult.length > 0 && countResult[0] ? (countResult[0]['total'] as number) || 0 : 0;
        
        // Récupérer les données
        bookings = await collection.aggregate(pipeline).toArray();
      } else if (isSortingByCompletionRate) {
        // Utiliser un pipeline d'agrégation pour trier par taux de progression (currentStep)
        const sortDirection = sort['metadata.currentStep'] === 1 ? 1 : -1;
        
        const pipeline: any[] = [
          { $match: query },
          {
            $addFields: {
              // Convertir metadata.currentStep en nombre, avec 0 par défaut si absent
              completionStep: {
                $toInt: { $ifNull: ['$metadata.currentStep', 0] },
              },
            },
          },
          { $sort: { completionStep: sortDirection } },
          { $skip: offset },
          { $limit: limit },
          {
            $project: {
              completionStep: 0, // Exclure le champ temporaire du résultat
            },
          },
        ];
        
        // Compter le total
        const countPipeline = [
          { $match: query },
          { $count: 'total' },
        ];
        const countResult = await collection.aggregate(countPipeline).toArray();
        total = countResult.length > 0 && countResult[0] ? (countResult[0]['total'] as number) || 0 : 0;
        
        // Récupérer les données
        bookings = await collection.aggregate(pipeline).toArray();
      } else {
        // Tri normal pour les autres champs
        total = await collection.countDocuments(query);
        bookings = await collection
          .find(query)
          .sort(sort)
          .skip(offset)
          .limit(limit)
          .toArray();
      }

      const pages = Math.ceil(total / limit);
      return {
        data: bookings.map(b => this.mapToBooking(b)),
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
  ): Promise<PaginatedFindResult<Booking>> {
    return this.findWithPagination({ requesterId }, options);
  }

  async findByProvider(
    providerId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<Booking>> {
    return this.findWithPagination({ providerId }, options);
  }

  async findByStatus(
    status: Booking['status'],
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<Booking>> {
    return this.findWithPagination({ status }, options);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'BookingRepository:findUpcoming' }) // Cache 5 minutes
  async findUpcoming(
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<Booking>> {
    try {
      const now = new Date();
      return this.findWithPagination(
        {
          status: { $in: [BOOKING_STATUSES.PENDING, BOOKING_STATUSES.CONFIRMED] },
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
  ): Promise<PaginatedFindResult<Booking>> {
    try {
      // Utiliser BookingQueryBuilder pour construire la requête
      const queryBuilder = this.buildBookingQuery(filters, options);
      const query = queryBuilder.build();

      // S'assurer qu'un tri est toujours défini (par défaut: createdAt desc)
      const sort: Record<string, 1 | -1> = Object.keys(query.sort || {}).length > 0 
        ? query.sort 
        : { createdAt: -1 as const };

      const pagination: PaginationOptions = {
        limit: query.pagination.limit ?? 50,
        page: query.pagination.page ?? 1,
        ...(query.pagination.offset !== undefined && { offset: query.pagination.offset }),
        sort,
      };
      return this.findWithPagination(query.filters, pagination);
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
          | 'DRAFT'
          | 'PENDING'
          | 'CONFIRMED'
          | 'FINISHED'
          | 'CANCELLED',
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
    // Filtrer par statut de paiement (via metadata.paymentStatus)
    if (filters['paymentStatus']) {
      builder.byPaymentStatus(filters['paymentStatus']);
    }

    // Préserver les filtres non reconnus (comme metadata.paymentStatus déjà construit par l'API route)
    const recognizedFilters = [
      'requesterId',
      'providerId',
      'serviceId',
      'serviceType',
      'status',
      'dateFrom',
      'dateTo',
      'paymentStatus',
    ];
    Object.keys(filters).forEach(key => {
      if (!recognizedFilters.includes(key) && filters[key] !== undefined) {
        // Préserver les filtres non reconnus (comme metadata.paymentStatus déjà construit)
        // Vérifier que le filtre n'est pas déjà dans le builder
        const currentFilters = builder.getFilters();
        if (!currentFilters[key]) {
          builder.where(key, filters[key]);
        }
      }
    });

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
      } else {
        // Appliquer un tri par défaut si aucun tri n'est spécifié
        builder.orderByCreatedAt('desc');
      }
    } else {
      // Appliquer un tri par défaut si aucune option n'est fournie
      builder.orderByCreatedAt('desc');
    }

    return builder;
  }

  /**
   * Mapper un document MongoDB vers un objet Booking
   * Utilise maintenant le BookingMapper centralisé
   */
  private mapToBooking(doc: any): Booking {
    // Import dynamique pour éviter les dépendances circulaires
    const { mapBookingToResponse } = require('@/lib/mappers/booking.mapper');
    const mapped = mapBookingToResponse(doc);
    
    // Convertir les dates string en Date pour compatibilité avec l'interface Booking
    const result: Booking = {
      id: mapped.id,
      _id: mapped._id,
      reservationNumber: mapped.reservationNumber,
      requesterId: mapped.requesterId,
      providerId: mapped.providerId,
      serviceId: mapped.serviceId,
      serviceType: mapped.serviceType,
      status: mapped.status,
      timeslot: mapped.timeslot,
      consultationMode: mapped.consultationMode,
      recipient: mapped.recipient,
      metadata: mapped.metadata,
      createdAt: new Date(mapped.createdAt),
      updatedAt: new Date(mapped.updatedAt),
    };
    
    // Ajouter appointmentDate seulement s'il existe
    if (mapped.appointmentDate) {
      result.appointmentDate = new Date(mapped.appointmentDate);
    }
    
    return result;
  }
}
