/**
 * Schémas de validation Zod pour les règles de disponibilité
 */

import { z } from 'zod';

export const AvailabilityTimeSlotSchema = z.object({
  id: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format invalide (HH:mm)'),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format invalide (HH:mm)'),
  isActive: z.boolean().default(true),
  start: z.string().optional(),
  end: z.string().optional(),
}).refine(
  (data) => {
    const start = data.startTime || data.start || '';
    const end = data.endTime || data.end || '';
    if (!start || !end) return true;
    return start < end;
  },
  {
    message: "L'heure de début doit précéder l'heure de fin",
    path: ['endTime'],
  },
);

export const CreateAvailabilityRuleSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  type: z.enum(['weekly', 'monthly', 'custom']),
  isActive: z.boolean().optional().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  timeSlots: z.array(AvailabilityTimeSlotSchema).default([]),
  timezone: z.string().optional().default('UTC'),
}).refine(
  (data) => {
    if (data.type === 'weekly') return true;
    return !!(data.startDate && data.endDate);
  },
  {
    message: 'Les dates de début et de fin sont requises pour les plannings mensuels et personnalisés',
    path: ['startDate'],
  },
).refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    return data.startDate <= data.endDate;
  },
  {
    message: 'La date de début doit précéder la date de fin',
    path: ['endDate'],
  },
);

export const UpdateAvailabilityRuleSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').optional(),
  type: z.enum(['weekly', 'monthly', 'custom']).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  timeSlots: z.array(AvailabilityTimeSlotSchema).optional(),
  timezone: z.string().optional(),
}).refine(
  (data) => {
    // Only validate if type, startDate, and endDate are provided
    if (data.type && data.type !== 'weekly') {
      return !!(data.startDate && data.endDate);
    }
    return true;
  },
  {
    message: 'Les dates de début et de fin sont requises pour les plannings mensuels et personnalisés',
    path: ['startDate'],
  },
).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: 'La date de début doit précéder la date de fin',
    path: ['endDate'],
  },
);

export type CreateAvailabilityRuleData = z.infer<typeof CreateAvailabilityRuleSchema>;
export type UpdateAvailabilityRuleData = z.infer<typeof UpdateAvailabilityRuleSchema>;
export type AvailabilityTimeSlotData = z.infer<typeof AvailabilityTimeSlotSchema>;

