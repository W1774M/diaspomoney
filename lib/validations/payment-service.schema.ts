/**
 * Schémas de validation Zod pour le service de paiements
 * Utilisés dans les services pour valider les entrées
 */

import { z } from 'zod';

/**
 * Schéma pour créer un Payment Intent (service layer)
 */
export const CreatePaymentIntentServiceSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  customerId: z.string().min(1, 'Customer ID is required'),
  metadata: z.record(z.string()).optional(),
  provider: z.string().optional(),
});

/**
 * Schéma pour traiter un paiement (service layer)
 */
export const ProcessPaymentServiceSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  customerId: z.string().min(1, 'Customer ID is required'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  metadata: z.record(z.string()).optional(),
  provider: z.string().optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreatePaymentIntentServiceInput = z.infer<typeof CreatePaymentIntentServiceSchema>;
export type ProcessPaymentServiceInput = z.infer<typeof ProcessPaymentServiceSchema>;

