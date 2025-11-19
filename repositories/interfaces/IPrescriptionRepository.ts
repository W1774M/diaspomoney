/**
 * Interface du repository pour les ordonnances/prescriptions
 */

import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';
import type { Prescription, Medication } from '@/lib/types';

// Re-export pour compatibilité
export type { Prescription, Medication };

export interface PrescriptionFilters {
  appointmentId?: string;
  issuedBy?: string;
  validUntilFrom?: Date;
  validUntilTo?: Date;
  issuedAtFrom?: Date;
  issuedAtTo?: Date;
  [key: string]: any;
}

export interface IPrescriptionRepository
  extends IPaginatedRepository<Prescription, string> {
  /**
   * Trouver des ordonnances par appointment
   */
  findByAppointment(
    appointmentId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prescription>>;

  /**
   * Trouver des ordonnances par médecin
   */
  findByIssuer(
    issuedBy: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prescription>>;

  /**
   * Trouver des ordonnances valides (non expirées)
   */
  findValid(
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prescription>>;

  /**
   * Trouver des ordonnances expirées
   */
  findExpired(
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prescription>>;

  /**
   * Trouver des ordonnances avec filtres avancés
   */
  findPrescriptionsWithFilters(
    filters: PrescriptionFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Prescription>>;
}
