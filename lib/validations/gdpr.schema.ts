/**
 * Schémas de validation Zod pour GDPR Compliance
 * Utilisés dans les routes API pour valider les entrées
 */

import { z } from 'zod';

/**
 * Schéma pour le fondement juridique GDPR
 */
const LegalBasisSchema = z.enum(
  ['CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTERESTS', 'PUBLIC_TASK', 'LEGITIMATE_INTERESTS'],
  {
    errorMap: () => ({ message: 'Invalid legal basis' }),
  },
);

/**
 * Schéma pour créer un consentement GDPR
 */
export const CreateGDPRConsentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  purpose: z.string().min(1, 'Purpose is required').max(200),
  granted: z.boolean().default(false),
  grantedAt: z.string().datetime().optional().or(z.date().optional()),
  withdrawnAt: z.string().datetime().optional().or(z.date().optional()),
  legalBasis: LegalBasisSchema,
  dataCategories: z.array(z.string()).min(1, 'At least one data category is required'),
  retentionPeriod: z.number().int().positive('Retention period must be positive'),
  isActive: z.boolean().default(true),
});

/**
 * Schéma pour mettre à jour un consentement GDPR
 */
export const UpdateGDPRConsentSchema = z.object({
  granted: z.boolean().optional(),
  grantedAt: z.string().datetime().optional().or(z.date().optional()),
  withdrawnAt: z.string().datetime().optional().or(z.date().optional()),
  legalBasis: LegalBasisSchema.optional(),
  dataCategories: z.array(z.string()).optional(),
  retentionPeriod: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schéma pour créer un enregistrement de traitement de données
 */
export const CreateDataProcessingRecordSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  purpose: z.string().min(1, 'Purpose is required').max(200),
  dataCategories: z.array(z.string()).min(1, 'At least one data category is required'),
  legalBasis: z.string().min(1, 'Legal basis is required').max(100),
  processedAt: z.string().datetime().optional().or(z.date().optional()),
  processor: z.string().min(1, 'Processor is required').max(200),
  retentionPeriod: z.number().int().positive('Retention period must be positive'),
  isAnonymized: z.boolean().default(false),
});

/**
 * Schéma pour créer une demande d'accès aux données (Data Subject Request)
 */
export const CreateDataSubjectRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: z.enum(['ACCESS', 'RECTIFICATION', 'ERASURE', 'PORTABILITY', 'RESTRICTION', 'OBJECTION'], {
    errorMap: () => ({ message: 'Invalid request type' }),
  }),
  description: z.string().max(2000).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']).default('PENDING'),
  requestedAt: z.string().datetime().optional().or(z.date().optional()),
  completedAt: z.string().datetime().optional().or(z.date().optional()),
  rejectionReason: z.string().max(500).optional(),
});

/**
 * Schéma pour mettre à jour une demande d'accès aux données
 */
export const UpdateDataSubjectRequestSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']).optional(),
  description: z.string().max(2000).optional(),
  completedAt: z.string().datetime().optional().or(z.date().optional()),
  rejectionReason: z.string().max(500).optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateGDPRConsentInput = z.infer<typeof CreateGDPRConsentSchema>;
export type UpdateGDPRConsentInput = z.infer<typeof UpdateGDPRConsentSchema>;
export type CreateDataProcessingRecordInput = z.infer<typeof CreateDataProcessingRecordSchema>;
export type CreateDataSubjectRequestInput = z.infer<typeof CreateDataSubjectRequestSchema>;
export type UpdateDataSubjectRequestInput = z.infer<typeof UpdateDataSubjectRequestSchema>;

