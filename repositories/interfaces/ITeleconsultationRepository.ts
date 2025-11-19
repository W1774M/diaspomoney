/**
 * Interface du repository pour les téléconsultations
 */

import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';
import type { Teleconsultation } from '@/lib/types';

// Re-export pour compatibilité
export type { Teleconsultation };

export type TeleconsultationStatus = 'WAITING' | 'ACTIVE' | 'ENDED';

export interface TeleconsultationFilters {
  appointmentId?: string;
  status?: TeleconsultationStatus;
  dateFrom?: Date;
  dateTo?: Date;
  [key: string]: any;
}

export interface ITeleconsultationRepository
  extends IPaginatedRepository<Teleconsultation, string> {
  /**
   * Trouver des téléconsultations par appointment
   */
  findByAppointment(
    appointmentId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Teleconsultation>>;

  /**
   * Trouver des téléconsultations par statut
   */
  findByStatus(
    status: TeleconsultationStatus,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Teleconsultation>>;

  /**
   * Trouver des téléconsultations actives
   */
  findActive(
    options?: PaginationOptions
  ): Promise<PaginatedResult<Teleconsultation>>;

  /**
   * Mettre à jour le statut d'une téléconsultation
   */
  updateStatus(
    teleconsultationId: string,
    status: TeleconsultationStatus
  ): Promise<boolean>;

  /**
   * Terminer une téléconsultation (met à jour le statut, endedAt et duration)
   */
  endTeleconsultation(
    teleconsultationId: string
  ): Promise<Teleconsultation | null>;

  /**
   * Trouver des téléconsultations avec filtres avancés
   */
  findTeleconsultationsWithFilters(
    filters: TeleconsultationFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Teleconsultation>>;
}
