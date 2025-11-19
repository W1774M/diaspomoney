/**
 * Interface du repository pour les ordonnances/prescriptions
 */

import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';

export interface Prescription {
  id: string;
  _id?: string;
  appointmentId: string;
  medications: Medication[];
  instructions: string;
  validUntil: Date;
  issuedAt: Date;
  issuedBy: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

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
