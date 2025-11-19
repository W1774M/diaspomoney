/**
 * BookingQueryBuilder - Builder spécialisé pour les requêtes booking
 * Étend QueryBuilder avec des méthodes spécifiques aux réservations
 */

import { BOOKING_STATUSES } from '@/lib/constants';
import { QueryBuilder } from './QueryBuilder';

export class BookingQueryBuilder extends QueryBuilder {
  /**
   * Filtrer par requester
   */
  byRequester(requesterId: string): this {
    return this.where('requesterId', requesterId);
  }

  /**
   * Filtrer par provider
   */
  byProvider(providerId: string): this {
    return this.where('providerId', providerId);
  }

  /**
   * Filtrer par service
   */
  byService(serviceId: string): this {
    return this.where('serviceId', serviceId);
  }

  /**
   * Filtrer par type de service
   */
  byServiceType(serviceType: 'HEALTH' | 'BTP' | 'EDUCATION'): this {
    return this.where('serviceType', serviceType);
  }

  /**
   * Filtrer par statut
   */
  byStatus(status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'): this {
    return this.where('status', status);
  }

  /**
   * Filtrer les réservations en attente
   */
  pending(): this {
    return this.where('status', BOOKING_STATUSES.PENDING);
  }

  /**
   * Filtrer les réservations confirmées
   */
  confirmed(): this {
    return this.where('status', BOOKING_STATUSES.CONFIRMED);
  }

  /**
   * Filtrer les réservations complétées
   */
  completed(): this {
    return this.where('status', BOOKING_STATUSES.COMPLETED);
  }

  /**
   * Filtrer les réservations annulées
   */
  cancelled(): this {
    return this.where('status', BOOKING_STATUSES.CANCELLED);
  }

  /**
   * Filtrer par mode de consultation
   */
  byConsultationMode(mode: 'video' | 'cabinet'): this {
    return this.where('consultationMode', mode);
  }

  /**
   * Filtrer les réservations à venir
   */
  upcoming(): this {
    const now = new Date();
    return this.whereGreaterThanOrEqual('appointmentDate', now)
      .whereIn('status', [BOOKING_STATUSES.PENDING, BOOKING_STATUSES.CONFIRMED]);
  }

  /**
   * Filtrer les réservations passées
   */
  past(): this {
    const now = new Date();
    return this.whereLessThan('appointmentDate', now);
  }

  /**
   * Filtrer les réservations pour une date spécifique
   */
  onDate(date: Date): this {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.whereGreaterThanOrEqual('appointmentDate', startOfDay)
      .whereLessThanOrEqual('appointmentDate', endOfDay);
  }

  /**
   * Filtrer les réservations entre deux dates
   */
  betweenDates(startDate: Date, endDate: Date): this {
    return this.whereGreaterThanOrEqual('appointmentDate', startDate)
      .whereLessThanOrEqual('appointmentDate', endDate);
  }

  /**
   * Trier par date de rendez-vous
   */
  orderByAppointmentDate(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('appointmentDate', direction);
  }

  /**
   * Trier par date de création
   */
  orderByCreatedAt(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('createdAt', direction);
  }
}

