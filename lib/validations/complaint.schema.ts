/**
 * Schémas de validation Zod pour les réclamations
 * Utilisés dans les routes API pour valider les entrées
 */

import { z } from 'zod';

/**
 * Types de réclamation
 */
export const ComplaintTypeEnum = z.enum(['QUALITY', 'DELAY', 'BILLING', 'COMMUNICATION']);

/**
 * Priorités de réclamation
 */
export const ComplaintPriorityEnum = z.enum(['HIGH', 'MEDIUM', 'LOW']);

/**
 * Schéma pour créer une réclamation
 */
export const CreateComplaintSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
  type: ComplaintTypeEnum,
  priority: ComplaintPriorityEnum,
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long').trim(),
  provider: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid provider ID format (must be MongoDB ObjectId)'),
  appointmentId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid appointment ID format (must be MongoDB ObjectId)'),
  // Options de la facade
  sendNotification: z.boolean().optional(),
  notifyProvider: z.boolean().optional(),
  sendEmail: z.boolean().optional(),
  recipientEmail: z.string().email('Invalid email format').optional(),
});

/**
 * Type TypeScript dérivé du schéma
 */
export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>;

