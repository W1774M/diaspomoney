/**
 * Schémas de validation Zod pour les paiements de réservation
 * Utilisés dans les routes API pour valider les entrées
 */

import { z } from 'zod';

/**
 * Schéma pour les informations d'appointment dans les paiements
 */
const AppointmentPaymentSchema = z.object({
  _id: z.string().optional(),
  id: z.string().optional(),
  selectedService: z
    .object({
      name: z.string().min(1),
      price: z.number().positive(),
    })
    .optional(),
  provider: z
    .object({
      id: z.string().min(1),
      name: z.string().min(1),
    })
    .optional(),
  requester: z
    .object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
    })
    .optional(),
  recipient: z
    .object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().optional(),
    })
    .optional(),
  timeslot: z.string().optional(),
});

/**
 * Schéma pour les données de paiement
 */
const PaymentDataSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  cardholderName: z.string().optional(),
});

/**
 * Schéma pour confirmer un paiement de réservation
 */
export const ConfirmPaymentSchema = z.object({
  appointment: AppointmentPaymentSchema,
  paymentData: PaymentDataSchema,
});

/**
 * Schéma pour signaler une erreur de paiement de réservation
 */
export const PaymentErrorSchema = z.object({
  appointment: AppointmentPaymentSchema,
  paymentData: PaymentDataSchema,
  errorMessage: z.string().min(1, 'Error message is required'),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type ConfirmPaymentInput = z.infer<typeof ConfirmPaymentSchema>;
export type PaymentErrorInput = z.infer<typeof PaymentErrorSchema>;

