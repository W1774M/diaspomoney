/**
 * Interface du repository pour KYC
 */

import type { KYCData, KYCFilters } from '@/types/kyc';
import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';

export interface IKYCRepository extends IPaginatedRepository<KYCData> {
  /**
   * Trouver le KYC d'un utilisateur
   */
  findByUserId(userId: string): Promise<KYCData | null>;

  /**
   * Trouver les KYC avec filtres avancés
   */
  findKYCWithFilters(
    filters: KYCFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<KYCData>>;

  /**
   * Mettre à jour le statut KYC
   */
  updateStatus(
    kycId: string,
    status: KYCData['status'],
    reviewedAt?: Date,
    rejectionReason?: string
  ): Promise<KYCData | null>;

  /**
   * Mettre à jour le statut d'un document
   */
  updateDocumentStatus(
    kycId: string,
    documentIndex: number,
    status: KYCData['documents'][0]['status'],
    reviewedAt?: Date,
    rejectionReason?: string
  ): Promise<KYCData | null>;
}
