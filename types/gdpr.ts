/**
 * Types et interfaces pour GDPR Compliance
 */

/**
 * Consentement GDPR
 */
export interface GDPRConsent {
  id: string;
  userId: string;
  purpose: string;
  granted: boolean;
  grantedAt: Date;
  withdrawnAt?: Date;
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
}

/**
 * Enregistrement de traitement de données
 */
export interface DataProcessingRecord {
  id: string;
  userId: string;
  purpose: string;
  dataCategories: string[];
  legalBasis: string;
  processedAt: Date;
  processor: string;
  retentionPeriod: number;
  isAnonymized: boolean;
}

/**
 * Demande de sujet de données (Data Subject Request)
 */
export interface DataSubjectRequest {
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
}

