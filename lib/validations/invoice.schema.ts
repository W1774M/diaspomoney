/**
 * Schémas de validation Zod pour les factures
 * Utilisés dans les routes API pour valider les entrées
 */

import { z } from 'zod';
import { PAYMENT } from '@/lib/constants';

/**
 * Schéma pour un article de facture
 */
export const InvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  total: z.number().positive('Total must be positive').optional(),
});

/**
 * Schéma pour l'adresse de facturation
 */
export const BillingAddressSchema = z.object({
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  country: z.string().length(2, 'Country must be ISO 3166-1 alpha-2 code'),
  postalCode: z.string().min(1).max(20),
}).optional();

/**
 * Schéma pour créer une facture
 */
export const CreateInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  transactionId: z.string().optional(),
  bookingId: z.string().optional(),
  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
  currency: z.string().length(3, 'Currency must be 3 characters').default(PAYMENT.DEFAULT_CURRENCY),
  tax: z.number().nonnegative('Tax cannot be negative').optional(),
  dueDate: z.string().datetime().optional().or(z.date().optional()),
  billingAddress: BillingAddressSchema,
  providerId: z.string().optional(),
  issueDate: z.string().datetime().optional().or(z.date().optional()),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.any()).optional(),
  // Options de la facade
  sendEmail: z.boolean().optional(),
  sendNotification: z.boolean().optional(),
  recipientEmail: z.string().email('Invalid email format').optional(),
});

/**
 * Type TypeScript dérivé du schéma
 */
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;

