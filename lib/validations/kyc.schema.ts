/**
 * Schémas de validation Zod pour KYC (Know Your Customer)
 * Utilisés dans les routes API pour valider les entrées
 */

import { z } from 'zod';

/**
 * Schéma pour le type de document KYC
 */
const KYCDocumentTypeSchema = z.enum(
  ['ID_CARD', 'PASSPORT', 'DRIVER_LICENSE', 'UTILITY_BILL', 'BANK_STATEMENT'],
  {
    errorMap: () => ({ message: 'Invalid KYC document type' }),
  },
);

/**
 * Schéma pour le statut d'un document KYC
 */
const KYCDocumentStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
  errorMap: () => ({ message: 'Invalid KYC document status' }),
});

/**
 * Schéma pour le statut KYC global
 */
const KYCStatusSchema = z.enum(['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'], {
  errorMap: () => ({ message: 'Invalid KYC status' }),
});

/**
 * Schéma pour un document KYC
 */
const KYCDocumentSchema = z.object({
  type: KYCDocumentTypeSchema,
  fileUrl: z.string().url('Invalid file URL').or(z.string().min(1)),
  status: KYCDocumentStatusSchema.default('PENDING'),
  uploadedAt: z.string().datetime().optional().or(z.date().optional()),
  reviewedAt: z.string().datetime().optional().or(z.date().optional()),
  rejectionReason: z.string().max(500).optional(),
});

/**
 * Schéma pour créer des données KYC
 */
export const CreateKYCSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  documents: z.array(KYCDocumentSchema).min(1, 'At least one document is required'),
  status: KYCStatusSchema.default('PENDING'),
  submittedAt: z.string().datetime().optional().or(z.date().optional()),
  reviewedAt: z.string().datetime().optional().or(z.date().optional()),
  rejectionReason: z.string().max(500).optional(),
});

/**
 * Schéma pour mettre à jour des données KYC
 */
export const UpdateKYCSchema = z.object({
  status: KYCStatusSchema.optional(),
  reviewedAt: z.string().datetime().optional().or(z.date().optional()),
  rejectionReason: z.string().max(500).optional(),
  documents: z.array(KYCDocumentSchema).optional(),
});

/**
 * Schéma pour ajouter un document KYC
 */
export const AddKYCDocumentSchema = z.object({
  kycId: z.string().min(1, 'KYC ID is required'),
  document: KYCDocumentSchema,
});

/**
 * Schéma pour mettre à jour un document KYC
 */
export const UpdateKYCDocumentSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  status: KYCDocumentStatusSchema.optional(),
  reviewedAt: z.string().datetime().optional().or(z.date().optional()),
  rejectionReason: z.string().max(500).optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateKYCInput = z.infer<typeof CreateKYCSchema>;
export type UpdateKYCInput = z.infer<typeof UpdateKYCSchema>;
export type AddKYCDocumentInput = z.infer<typeof AddKYCDocumentSchema>;
export type UpdateKYCDocumentInput = z.infer<typeof UpdateKYCDocumentSchema>;

