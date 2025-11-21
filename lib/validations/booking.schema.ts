/**
 * Schémas de validation Zod pour les réservations/bookings
 * Utilisés dans les routes API pour valider les entrées
 */

import { z } from 'zod';

// Constantes locales
const DEFAULT_SERVICE_ID = 'default';
const DEFAULT_CURRENCY = 'EUR';

/**
 * Schéma pour le destinataire d'une réservation
 */
const RecipientSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().min(1).max(20),
}).optional();

/**
 * Schéma pour le paiement d'une réservation
 */
const BookingPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default(DEFAULT_CURRENCY),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  createInvoice: z.boolean().optional(),
}).optional();

/**
 * Schéma pour créer une réservation
 */
export const CreateBookingSchema = z.object({
  requesterId: z.string().min(1, 'Requester ID is required'),
  providerId: z.string().min(1, 'Provider ID is required'),
  serviceId: z.string().min(1).default(DEFAULT_SERVICE_ID),
  serviceType: z.enum(['HEALTH', 'BTP', 'EDUCATION'], {
    errorMap: () => ({ message: 'Service type must be one of: HEALTH, BTP, EDUCATION' }),
  }),
  appointmentDate: z.string().datetime().optional().or(z.date().optional()),
  timeslot: z.string().max(50).optional(),
  consultationMode: z.enum(['IN_PERSON', 'TELEMEDICINE', 'HYBRID']).optional(),
  recipient: RecipientSchema,
  payment: BookingPaymentSchema,
  metadata: z.record(z.string()).optional(),
});

/**
 * Schéma pour mettre à jour une réservation
 */
export const UpdateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'], {
    errorMap: () => ({ message: 'Invalid booking status' }),
  }).optional(),
  appointmentDate: z.string().datetime().optional().or(z.date().optional()),
  timeslot: z.string().max(50).optional(),
  consultationMode: z.enum(['IN_PERSON', 'TELEMEDICINE', 'HYBRID']).optional(),
  recipient: RecipientSchema,
  metadata: z.record(z.string()).optional(),
});

/**
 * Type TypeScript dérivé du schéma
 */
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;

