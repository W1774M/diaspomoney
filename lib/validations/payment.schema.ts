/**
 * Schémas de validation Zod pour les paiements
 * Utilisés dans les routes API pour valider les entrées
 */

import { z } from 'zod';

// Constantes locales
const DEFAULT_SERVICE_ID = 'default';
const DEFAULT_CURRENCY = 'EUR';

/**
 * Schéma pour créer un paiement
 */
export const CreatePaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default(DEFAULT_CURRENCY),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  payerId: z.string().min(1).optional(),
  beneficiaryId: z.string().min(1).optional(),
  serviceType: z.enum(['HEALTH', 'BTP', 'EDUCATION'], {
    errorMap: () => ({ message: 'Service type must be one of: HEALTH, BTP, EDUCATION' }),
  }),
  serviceId: z.string().min(1).default(DEFAULT_SERVICE_ID),
  description: z.string().min(1).max(500).optional(),
  createInvoice: z.boolean().optional(),
  sendNotification: z.boolean().optional(),
  metadata: z.record(z.string()).optional(),
});

/**
 * Type TypeScript dérivé du schéma
 */
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

