/**
 * Schémas de validation Zod pour les spécialités
 * Utilisés dans les routes API pour valider les entrées
 */

import { SPECIALITY_TYPES } from '@/lib/constants';
import { z } from 'zod';

/**
 * Schéma pour créer une spécialité
 */
export const CreateSpecialitySchema = z.object({
  name: z.string().min(1, 'Speciality name is required').max(100, 'Speciality name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  type: z.enum([
    SPECIALITY_TYPES.HEALTH,
    SPECIALITY_TYPES.BTP,
    SPECIALITY_TYPES.EDUCATION,
    SPECIALITY_TYPES.LEGAL,
    SPECIALITY_TYPES.FINANCE,
    SPECIALITY_TYPES.TECHNOLOGY,
  ] as [string, ...string[]], {
    errorMap: () => ({ message: 'Invalid speciality type' }),
  }),
  category: z.string().max(50).optional(),
  icon: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Schéma pour mettre à jour une spécialité
 */
export const UpdateSpecialitySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  type: z
    .enum([
      SPECIALITY_TYPES.HEALTH,
      SPECIALITY_TYPES.BTP,
      SPECIALITY_TYPES.EDUCATION,
      SPECIALITY_TYPES.LEGAL,
      SPECIALITY_TYPES.FINANCE,
      SPECIALITY_TYPES.TECHNOLOGY,
    ] as [string, ...string[]])
    .optional(),
  category: z.string().max(50).optional(),
  icon: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateSpecialityInput = z.infer<typeof CreateSpecialitySchema>;
export type UpdateSpecialityInput = z.infer<typeof UpdateSpecialitySchema>;

