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

const ObjectIdString = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid ID format (must be MongoDB ObjectId)');

/**
 * Schéma pour créer une réclamation
 * bookingId canonique ; appointmentId accepté en fallback (ACL).
 */
export const CreateComplaintSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
    type: ComplaintTypeEnum,
    priority: ComplaintPriorityEnum,
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description too long')
      .trim(),
    provider: ObjectIdString,
    bookingId: ObjectIdString.optional(),
    appointmentId: ObjectIdString.optional(),
    // Options de la facade
    sendNotification: z.boolean().optional(),
    notifyProvider: z.boolean().optional(),
    sendEmail: z.boolean().optional(),
    recipientEmail: z.string().email('Invalid email format').optional(),
  })
  .passthrough()
  .refine((data) => !!(data.bookingId || data.appointmentId), {
    message: 'bookingId or appointmentId is required',
    path: ['bookingId'],
  });

/**
 * Type TypeScript dérivé du schéma
 */
export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>;
