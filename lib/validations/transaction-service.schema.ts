/**
 * Schémas de validation Zod pour le service de transactions
 * Utilisés dans les services pour valider les entrées
 */

import { z } from 'zod';

/**
 * Schéma pour créer une transaction (service layer)
 * Note: payerId est ajouté dans le service, pas dans le schéma API
 */
export const CreateTransactionServiceSchema = z.object({
  payerId: z.string().min(1, 'Payer ID is required'),
  beneficiaryId: z.string().min(1, 'Beneficiary ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  serviceType: z.enum(['HEALTH', 'BTP', 'EDUCATION'], {
    errorMap: () => ({ message: 'Service type must be one of: HEALTH, BTP, EDUCATION' }),
  }),
  serviceId: z.string().min(1, 'Service ID is required'),
  description: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateTransactionServiceInput = z.infer<typeof CreateTransactionServiceSchema>;

