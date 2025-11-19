/**
 * Types et interfaces pour KYC (Know Your Customer)
 */

import { BaseEntity } from './index';

/**
 * Type de document KYC
 */
export type KYCDocumentType =
  | 'ID_CARD'
  | 'PASSPORT'
  | 'DRIVER_LICENSE'
  | 'UTILITY_BILL'
  | 'BANK_STATEMENT';

/**
 * Statut d'un document KYC
 */
export type KYCDocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Statut KYC global
 */
export type KYCStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

/**
 * Document KYC
 */
export interface KYCDocument {
  type: KYCDocumentType;
  fileUrl: string;
  status: KYCDocumentStatus;
  uploadedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

/**
 * Données KYC complètes
 */
export interface KYCData extends BaseEntity {
  userId: string;
  documents: KYCDocument[];
  status: KYCStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

/**
 * Filtres pour la recherche KYC
 */
export interface KYCFilters {
  userId?: string;
  status?: KYCStatus;
  documentType?: KYCDocumentType;
  documentStatus?: KYCDocumentStatus;
}
