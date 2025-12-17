/**
 * Schémas de validation Zod pour les réservations de service
 * Utilise les constantes centralisées
 */

import { z } from 'zod';
import { SPECIALITY_TYPES, BOOKING_STATUSES, PAYMENT } from '@/lib/constants';

const DEFAULT_CURRENCY = PAYMENT.DEFAULT_CURRENCY;

/**
 * Schéma pour créer une réservation
 */
export const CreateBookingSchema = z.object({
  requesterId: z.string().min(1, 'L\'ID du demandeur est requis'),
  providerId: z.string().min(1, 'L\'ID du prestataire est requis'),
  serviceId: z.string().optional(),
  serviceType: z.enum([
    SPECIALITY_TYPES.HEALTH,
    SPECIALITY_TYPES.BTP,
    SPECIALITY_TYPES.EDUCATION,
    SPECIALITY_TYPES.LEGAL,
    SPECIALITY_TYPES.FINANCE,
    SPECIALITY_TYPES.TECHNOLOGY,
  ]),
  appointmentDate: z.union([z.string(), z.date()]).optional(),
  timeslot: z.string().optional(),
  consultationMode: z.enum(['IN_PERSON', 'TELEMEDICINE', 'HYBRID']).optional(),
  recipient: z.union([
    z.string(),
    z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
  ]).optional(),
  payment: z.object({
    amount: z.number().positive(),
    currency: z.string().default(DEFAULT_CURRENCY),
    paymentMethodId: z.string().optional(),
    createInvoice: z.boolean().optional().default(true),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Schéma pour mettre à jour une réservation
 */
export const UpdateBookingSchema = z.object({
  status: z.enum([
    BOOKING_STATUSES.PENDING,
    BOOKING_STATUSES.CONFIRMED,
    BOOKING_STATUSES.CANCELLED,
  ]).optional(),
  appointmentDate: z.union([z.string(), z.date()]).optional(),
  timeslot: z.string().optional(),
  consultationMode: z.enum(['IN_PERSON', 'TELEMEDICINE', 'HYBRID']).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;
