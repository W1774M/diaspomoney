/**
 * Schémas de validation Zod pour le service de factures
 * Utilisés dans les services pour valider les entrées
 */

import { z } from 'zod';
import { PAYMENT } from '@/lib/constants';

/**
 * Schéma pour les items de facture
 */
const InvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  total: z.number().positive('Total must be positive').optional(),
});

/**
 * Schéma pour l'adresse de facturation
 */
const BillingAddressSchema = z.object({
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  country: z.string().length(2, 'Country must be ISO 3166-1 alpha-2 code'),
  postalCode: z.string().min(1).max(20),
}).optional();

/**
 * Schéma pour créer une facture (service layer)
 */
export const CreateInvoiceServiceSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default(PAYMENT.DEFAULT_CURRENCY),
  tax: z.number().nonnegative('Tax cannot be negative').optional(),
  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
  billingAddress: BillingAddressSchema,
  dueDate: z.date().optional(),
  metadata: z.record(z.any()).optional(),
  transactionId: z.string().optional(),
  bookingId: z.string().optional(),
  providerId: z.string().optional(),
});

/**
 * Schéma pour mettre à jour une facture (service layer)
 */
export const UpdateInvoiceServiceSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  items: z.array(InvoiceItemSchema).optional(),
  tax: z.number().nonnegative('Tax cannot be negative').optional(),
  dueDate: z.date().optional(),
  billingAddress: BillingAddressSchema,
  metadata: z.record(z.any()).optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateInvoiceServiceInput = z.infer<typeof CreateInvoiceServiceSchema>;
export type UpdateInvoiceServiceInput = z.infer<typeof UpdateInvoiceServiceSchema>;

