/**
 * Interface du repository pour les demandes de sujet de données GDPR
 */

import type { DataSubjectRequest } from '@/types/gdpr';
import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';

export interface DataSubjectRequestQuery {
  userId?: string;
  type?: DataSubjectRequest['type'];
  status?: DataSubjectRequest['status'];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IDataSubjectRequestRepository
  extends IPaginatedRepository<DataSubjectRequest> {
  /**
   * Rechercher des demandes avec filtres avancés
   */
  searchRequests(
    query: DataSubjectRequestQuery,
    options?: PaginationOptions
  ): Promise<PaginatedResult<DataSubjectRequest>>;

  /**
   * Trouver les demandes d'un utilisateur
   */
  findByUserId(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<DataSubjectRequest>>;

  /**
   * Mettre à jour le statut d'une demande
   */
  updateStatus(
    requestId: string,
    status: DataSubjectRequest['status'],
    completedAt?: Date,
    data?: any
  ): Promise<DataSubjectRequest | null>;
}
