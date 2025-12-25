/**
 * Schémas de validation Zod pour les packs
 */

import { SPECIALITY_TYPES } from '@/lib/constants';
import { z } from 'zod';

export const CreatePackSchema = z.object({
  // id optionnel : généré depuis le label si absent
  id: z.string().min(1).max(120).optional(),
  label: z.string().min(3, 'Le nom du pack est requis').max(120),
  description: z.string().max(1000).optional(),
  category: z.enum(
    [SPECIALITY_TYPES.HEALTH, SPECIALITY_TYPES.EDUCATION, SPECIALITY_TYPES.BTP] as [
      string,
      ...string[],
    ],
    {
      errorMap: () => ({
        message: 'La catégorie doit être HEALTH, EDUCATION ou BTP',
      }),
    },
  ),
  serviceIds: z.array(z.string().min(1)).min(1, 'Sélectionnez au moins un service'),
  isActive: z.boolean().default(true),
});

export const UpdatePackSchema = z
  .object({
    label: z.string().min(3).max(120).optional(),
    description: z.string().max(1000).optional(),
    category: z
      .enum([SPECIALITY_TYPES.HEALTH, SPECIALITY_TYPES.EDUCATION, SPECIALITY_TYPES.BTP] as [
        'HEALTH',
        'EDUCATION',
        'BTP',
      ])
      .optional(),
    serviceIds: z.array(z.string().min(1)).min(1).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit être fourni pour la mise à jour',
  });

export type CreatePackInput = z.infer<typeof CreatePackSchema>;
export type UpdatePackInput = z.infer<typeof UpdatePackSchema>;


