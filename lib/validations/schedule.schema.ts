/**
 * Validation Zod pour les plannings coss (schedules).
 */

import { z } from 'zod';

const timeRegex = /^(([0-1][0-9]|2[0-3]):[0-5][0-9]|24:00)$/;

export const ScheduleTimeRangeSchema = z
  .object({
    start: z.string().regex(timeRegex, 'Format invalide (HH:mm)'),
    end: z.string().regex(timeRegex, 'Format invalide (HH:mm)'),
  })
  .refine(data => data.start < data.end, {
    message: "L'heure de début doit précéder l'heure de fin",
    path: ['end'],
  });

export const ScheduleWeeklyRuleSchema = z.object({
  days: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'Au moins un jour requis')
    .max(7),
  start: z.string().regex(timeRegex, 'Format invalide (HH:mm)'),
  end: z.string().regex(timeRegex, 'Format invalide (HH:mm)'),
}).refine(data => data.start < data.end, {
  message: "L'heure de début doit précéder l'heure de fin",
  path: ['end'],
});

export const ScheduleOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date YYYY-MM-DD'),
  ranges: z.array(ScheduleTimeRangeSchema).max(20),
});

export const UpsertProviderScheduleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timeZone: z.string().min(1).max(64).optional(),
  isDefault: z.boolean().optional(),
  rules: z.array(ScheduleWeeklyRuleSchema).max(50).default([]),
  overrides: z.array(ScheduleOverrideSchema).max(366).optional(),
});

export type UpsertProviderScheduleData = z.infer<typeof UpsertProviderScheduleSchema>;
