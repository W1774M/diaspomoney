/**
 * Booking Service - DiaspoMoney (Version Refactorée avec Repository Pattern)
 * 
 * Service refactoré utilisant le Repository Pattern
 */

import { Booking, getBookingRepository, PaginatedResult } from '@/repositories';
import * as Sentry from '@sentry/nextjs';

export interface BookingData {
  requesterId: string;
  providerId: string;
  serviceId: string;
  serviceType: 'HEALTH' | 'BTP' | 'EDUCATION';
  appointmentDate?: Date;
  timeslot?: string;
  consultationMode?: 'video' | 'cabinet';
  recipient?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  metadata?: Record<string, any>;
}

export interface BookingServiceFilters {
  userId?: string;
  providerId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

/**
 * BookingService refactoré utilisant le Repository Pattern
 */
export class BookingService {
  private static instance: BookingService;
  private bookingRepository = getBookingRepository();

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  /**
   * Récupérer tous les rendez-vous avec filtres
   * AVANT: Accès direct à MongoDB via getDatabase()
   * APRÈS: Utilisation du repository
   */
  async getBookings(filters: BookingServiceFilters = {}): Promise<{
    data: Booking[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      // Convertir les filtres en format BookingFilters
      const repositoryFilters: Record<string, any> = {
        requesterId: filters.userId,
        providerId: filters.providerId,
        status: filters.status as Booking['status'],
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      };

      // Utiliser le repository avec pagination
      const result = await this.bookingRepository.findBookingsWithFilters(
        repositoryFilters,
        {
          limit: filters['limit'] || 50,
          offset: filters['offset'] || 0,
        }
      );

      return {
        data: result.data,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      };
    } catch (error) {
      console.error('Erreur getBookings:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer un rendez-vous par son ID
   * AVANT: Accès direct à MongoDB
   * APRÈS: Utilisation du repository
   */
  async getBookingById(id: string): Promise<Booking> {
    try {
      const booking = await this.bookingRepository.findById(id);
      
      if (!booking) {
        throw new Error('Réservation non trouvée');
      }

      return booking;
    } catch (error) {
      console.error('Erreur getBookingById:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Créer un nouveau rendez-vous
   * AVANT: Accès direct à MongoDB
   * APRÈS: Utilisation du repository
   */
  async createBooking(data: BookingData): Promise<Booking> {
    try {
      // Validation
      if (!data.requesterId || !data.providerId || !data.serviceId) {
        throw new Error('Données de réservation incomplètes');
      }

      // Créer la réservation via le repository
      const booking = await this.bookingRepository.create({
        requesterId: data.requesterId,
        providerId: data.providerId,
        serviceId: data.serviceId,
        serviceType: data.serviceType,
        status: 'PENDING',
        appointmentDate: data.appointmentDate,
        timeslot: data.timeslot,
        consultationMode: data.consultationMode,
        recipient: data.recipient,
        metadata: data.metadata,
      } as Partial<Booking>);

      return booking;
    } catch (error) {
      console.error('Erreur createBooking:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mettre à jour un rendez-vous
   */
  async updateBooking(
    id: string,
    data: Partial<BookingData>
  ): Promise<Booking> {
    try {
      const updatedBooking = await this.bookingRepository.update(
        id,
        data as Partial<Booking>
      );

      if (!updatedBooking) {
        throw new Error('Réservation non trouvée');
      }

      return updatedBooking;
    } catch (error) {
      console.error('Erreur updateBooking:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'une réservation
   */
  async updateBookingStatus(
    id: string,
    status: Booking['status']
  ): Promise<boolean> {
    try {
      return await this.bookingRepository.updateStatus(id, status);
    } catch (error) {
      console.error('Erreur updateBookingStatus:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Supprimer un rendez-vous
   */
  async deleteBooking(id: string): Promise<boolean> {
    try {
      return await this.bookingRepository.delete(id);
    } catch (error) {
      console.error('Erreur deleteBooking:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les réservations d'un utilisateur
   */
  async getUserBookings(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PaginatedResult<Booking>> {
    try {
      return await this.bookingRepository.findByRequester(userId, options);
    } catch (error) {
      console.error('Erreur getUserBookings:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les réservations d'un provider
   */
  async getProviderBookings(
    providerId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PaginatedResult<Booking>> {
    try {
      return await this.bookingRepository.findByProvider(providerId, options);
    } catch (error) {
      console.error('Erreur getProviderBookings:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les réservations à venir
   */
  async getUpcomingBookings(
    options?: { limit?: number; offset?: number }
  ): Promise<PaginatedResult<Booking>> {
    try {
      return await this.bookingRepository.findUpcoming(options);
    } catch (error) {
      console.error('Erreur getUpcomingBookings:', error);
      Sentry.captureException(error);
      throw error;
    }
  }
}

// Export singleton
export const bookingService = BookingService.getInstance();

