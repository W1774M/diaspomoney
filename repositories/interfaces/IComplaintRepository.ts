/**
 * Interface du repository pour les réclamations/complaints
 */

import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';

export interface Complaint {
  id: string;
  _id: string; // Requis pour BaseEntity
  number: string;
  title: string;
  type: ComplaintType;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  createdAt: Date;
  updatedAt: Date;
  description: string;
  provider: string;
  appointmentId: string;
  userId?: string;
  [key: string]: any;
}

export type ComplaintType = 'QUALITY' | 'DELAY' | 'BILLING' | 'COMMUNICATION';
export type ComplaintPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface ComplaintFilters {
  userId?: string;
  provider?: string;
  appointmentId?: string;
  type?: ComplaintType;
  priority?: ComplaintPriority;
  status?: ComplaintStatus;
  dateFrom?: Date;
  dateTo?: Date;
  [key: string]: any;
}

export interface IComplaintRepository
  extends IPaginatedRepository<Complaint, string> {
  /**
   * Trouver des réclamations par utilisateur
   */
  findByUser(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Complaint>>;

  /**
   * Trouver des réclamations par provider
   */
  findByProvider(
    provider: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Complaint>>;

  /**
   * Trouver des réclamations par statut
   */
  findByStatus(
    status: ComplaintStatus,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Complaint>>;

  /**
   * Trouver des réclamations avec filtres avancés
   */
  findComplaintsWithFilters(
    filters: ComplaintFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Complaint>>;

  /**
   * Générer un numéro de réclamation unique
   */
  generateComplaintNumber(): Promise<string>;
}
