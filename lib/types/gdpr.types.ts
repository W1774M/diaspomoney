/**
 * Types et interfaces pour GDPR Compliance
 */

import { BaseEntity } from './index';

/**
 * Consentement GDPR
 */
export interface GDPRConsent extends Omit<BaseEntity, '_id'> {
  _id: string; // Requis pour BaseEntity
  id: string;
  userId: string;
  purpose: string;
  granted: boolean;
  grantedAt: Date;
  withdrawnAt?: Date | undefined;
  legalBasis:
    | 'CONSENT'
    | 'CONTRACT'
    | 'LEGAL_OBLIGATION'
    | 'VITAL_INTERESTS'
    | 'PUBLIC_TASK'
    | 'LEGITIMATE_INTERESTS';
  dataCategories: string[];
  retentionPeriod: number; // days
  isActive: boolean;
  createdAt: Date; // Requis pour BaseEntity
  updatedAt: Date; // Requis pour BaseEntity
}

/**
 * Enregistrement de traitement de données
 */
export interface DataProcessingRecord extends Omit<BaseEntity, '_id'> {
  _id: string; // Requis pour BaseEntity
  id: string;
  userId: string;
  purpose: string;
  dataCategories: string[];
  legalBasis: string;
  processedAt: Date;
  processor: string;
  retentionPeriod: number;
  isAnonymized: boolean;
  createdAt: Date; // Requis pour BaseEntity
  updatedAt: Date; // Requis pour BaseEntity
}

/**
 * Demande de sujet de données (Data Subject Request)
 */
export interface DataSubjectRequest extends Omit<BaseEntity, '_id'> {
  _id: string; // Requis pour BaseEntity
  id: string;
  userId: string;
  type:
    | 'ACCESS'
    | 'RECTIFICATION'
    | 'ERASURE'
    | 'PORTABILITY'
    | 'RESTRICTION'
    | 'OBJECTION';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  requestedAt: Date;
  completedAt?: Date | undefined;
  reason?: string | undefined;
  data?: any;
  createdAt: Date; // Requis pour BaseEntity
  updatedAt: Date; // Requis pour BaseEntity
}

