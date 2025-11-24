/**
 * Schémas de validation Zod pour les services
 * Utilisés dans les services pour valider les entrées
 */

import { SPECIALITY_TYPES } from '@/lib/constants';
import { z } from 'zod';

/**
 * Schéma pour créer un service
 */
export const CreateServiceSchema = z.object({
  id: z.string().min(1, 'L\'ID du service est requis'),
  category: z.enum([
    SPECIALITY_TYPES.HEALTH,
    SPECIALITY_TYPES.EDUCATION,
    SPECIALITY_TYPES.BTP,
  ] as [string, ...string[]], {
    errorMap: () => ({ message: 'La catégorie doit être HEALTH, EDUCATION ou BTP' }),
  }),
  label: z.string().min(1, 'Le libellé est requis').max(200, 'Le libellé est trop long'),
  description: z.string().min(1, 'La description est requise').max(1000, 'La description est trop longue'),
  price: z.number().min(0, 'Le prix doit être positif'),
  isActive: z.boolean().default(true),
  metadata: z.record(z.string(), z.any()).optional(),
  associatedOptions: z.array(z.string()).optional(),
});

/**
 * Schéma pour mettre à jour un service
 */
export const UpdateServiceSchema = z.object({
  category: z.enum([
    SPECIALITY_TYPES.HEALTH,
    SPECIALITY_TYPES.EDUCATION,
    SPECIALITY_TYPES.BTP,
  ] as ['HEALTH', 'EDUCATION', 'BTP']).optional(),
  label: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  price: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  associatedOptions: z.array(z.string()).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni pour la mise à jour',
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;

