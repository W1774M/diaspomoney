/**
 * Schémas de validation Zod pour les options de service
 */

import { z } from 'zod';
// SPECIALITY_TYPES is not used in this schema file but may be used in future validations

/**
 * Schéma pour créer une option de service
 * Note: La catégorie n'est pas requise car une option peut être associée à plusieurs services de catégories différentes
 */
export const CreateServiceOptionSchema = z.object({
  category: z.string().optional(), // Optionnel car une option peut être multi-catégories
  label: z.string().min(1, 'Le libellé est requis').max(200, 'Le libellé est trop long'),
  description: z.string().min(1, 'La description est requise').max(1000, 'La description est trop longue'),
  price: z.number().min(0, 'Le prix doit être positif'),
  optional: z.boolean().default(true),
  isActive: z.boolean().default(true),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Schéma pour mettre à jour une option de service
 */
export const UpdateServiceOptionSchema = z.object({
  category: z.string().min(1).optional(),
  label: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  price: z.number().min(0).optional(),
  optional: z.boolean().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni pour la mise à jour',
});

/**
 * Schéma pour associer une option à un service
 */
export const AssociateServiceOptionSchema = z.object({
  serviceId: z.string().min(1, 'L\'ID du service est requis'),
  optionId: z.string().min(1, 'L\'ID de l\'option est requis'),
  isDefault: z.boolean().default(false),
  order: z.number().int().min(0).optional(),
});

/**
 * Schéma pour dissocier une option d'un service
 */
export const DissociateServiceOptionSchema = z.object({
  serviceId: z.string().min(1, 'L\'ID du service est requis'),
  optionId: z.string().min(1, 'L\'ID de l\'option est requis'),
});

