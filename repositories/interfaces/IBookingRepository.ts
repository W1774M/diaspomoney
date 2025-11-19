/**
 * Interface du repository pour les réservations/bookings
 */

import { IPaginatedRepository, PaginatedResult, PaginationOptions } from './IRepository';

export interface Booking {
  id: string;
  _id: string; // Requis pour BaseEntity
  requesterId: string;
  providerId: string;
  serviceId: string;
  serviceType: 'HEALTH' | 'BTP' | 'EDUCATION';
  status: BookingStatus;
  appointmentDate?: Date;
  timeslot?: string;
  consultationMode?: 'video' | 'cabinet';
  recipient?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'FAILED';

export interface BookingFilters {
  requesterId?: string;
  providerId?: string;
  serviceId?: string;
  serviceType?: 'HEALTH' | 'BTP' | 'EDUCATION';
  status?: BookingStatus;
  dateFrom?: Date;
  dateTo?: Date;
  [key: string]: any;
}

export interface IBookingRepository extends IPaginatedRepository<Booking, string> {
  /**
   * Trouver des réservations par requester
   */
  findByRequester(
    requesterId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Booking>>;

  /**
   * Trouver des réservations par provider
   */
  findByProvider(
    providerId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Booking>>;

  /**
   * Trouver des réservations par statut
   */
  findByStatus(
    status: BookingStatus,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Booking>>;

  /**
   * Trouver des réservations à venir
   */
  findUpcoming(options?: PaginationOptions): Promise<PaginatedResult<Booking>>;

  /**
   * Mettre à jour le statut d'une réservation
   */
  updateStatus(bookingId: string, status: BookingStatus): Promise<boolean>;

  /**
   * Trouver des réservations avec filtres avancés
   */
  findBookingsWithFilters(
    filters: BookingFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Booking>>;
}

