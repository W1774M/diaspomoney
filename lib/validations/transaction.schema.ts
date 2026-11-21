/**
 * Schémas de validation Zod pour les transactions
 * Utilisés dans les routes API pour valider les entrées
 */

import { z } from 'zod';

/**
 * Schéma pour créer une transaction
 */
export const CreateTransactionSchema = z.object({
  beneficiaryId: z.string().min(1, 'Beneficiary ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  serviceType: z.enum(['HEALTH', 'BTP', 'EDUCATION'], {
    errorMap: () => ({ message: 'Service type must be one of: HEALTH, BTP, EDUCATION' }),
  }),
  serviceId: z.string().min(1, 'Service ID is required'),
  description: z.string().min(1, 'Description is required').max(500),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Type TypeScript dérivé du schéma
 */
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

