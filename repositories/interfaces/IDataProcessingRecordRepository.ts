/**
 * Interface du repository pour les enregistrements de traitement de données GDPR
 */

import type { DataProcessingRecord } from '@/lib/types';
import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';

export interface DataProcessingRecordQuery {
  userId?: string;
  purpose?: string;
  legalBasis?: string;
  processor?: string;
  isAnonymized?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IDataProcessingRecordRepository
  extends IPaginatedRepository<DataProcessingRecord> {
  /**
   * Rechercher des enregistrements avec filtres avancés
   */
  searchRecords(
    query: DataProcessingRecordQuery,
    options?: PaginationOptions
  ): Promise<PaginatedResult<DataProcessingRecord>>;

  /**
   * Trouver les enregistrements d'un utilisateur
   */
  findByUserId(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<DataProcessingRecord>>;
}
