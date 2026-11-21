/**
 * Schémas de validation Zod pour les services de santé
 * Utilisés dans les services pour valider les entrées
 */

import { z } from 'zod';

/**
 * Schéma pour prendre un rendez-vous
 */
export const BookAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  providerId: z.string().min(1, 'Provider ID is required'),
  serviceId: z.string().min(1, 'Service ID is required'),
  date: z.date(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  duration: z.number().positive('Duration must be positive'),
  type: z.enum(['IN_PERSON', 'TELEMEDICINE'], {
    errorMap: () => ({ message: 'Type must be either IN_PERSON or TELEMEDICINE' }),
  }),
});

/**
 * Schéma pour un médicament dans une ordonnance
 */
const MedicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
});

/**
 * Schéma pour créer une ordonnance
 */
export const CreatePrescriptionSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  medications: z.array(MedicationSchema).min(1, 'At least one medication is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  validUntil: z.date(),
  issuedBy: z.string().min(1, 'Issued by is required'),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type BookAppointmentInput = z.infer<typeof BookAppointmentSchema>;
export type CreatePrescriptionInput = z.infer<typeof CreatePrescriptionSchema>;
export type MedicationInput = z.infer<typeof MedicationSchema>;

