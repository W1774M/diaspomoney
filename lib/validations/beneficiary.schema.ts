/**
 * Schémas de validation Zod pour les bénéficiaires
 * Utilisés dans les routes API pour valider les entrées
 */

import { z } from 'zod';

/**
 * Schéma pour créer un bénéficiaire (format API)
 * Supporte à la fois "name" (legacy) et "firstName/lastName" (nouveau format)
 */
export const CreateBeneficiaryApiSchema = z.object({
  // Format legacy (compatibilité)
  name: z.string().min(1).optional(),
  // Format nouveau
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  // Champs communs
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  relationship: z.enum([
    'PARENT',
    'CHILD',
    'SPOUSE',
    'SIBLING',
    'FRIEND',
    'OTHER',
  ], {
    errorMap: () => ({ message: 'La relation est obligatoire' }),
  }),
  country: z.string().min(2, 'Le pays est requis').optional(),
}).refine(
  (data) => {
    // Au moins name OU (firstName ET lastName) doit être fourni
    return data.name || (data.firstName && data.lastName);
  },
  {
    message: 'Le nom (ou prénom et nom) est obligatoire',
  },
);

/**
 * Schéma pour mettre à jour un bénéficiaire (format API)
 */
export const UpdateBeneficiaryApiSchema = z.object({
  // Format legacy (compatibilité)
  name: z.string().min(1).optional(),
  // Format nouveau
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  // Champs communs
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  relationship: z.enum([
    'PARENT',
    'CHILD',
    'SPOUSE',
    'SIBLING',
    'FRIEND',
    'OTHER',
  ]).optional(),
  country: z.string().min(2).optional(),
});

/**
 * Schéma pour créer un bénéficiaire (format Facade)
 */
export const CreateBeneficiarySchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  relationship: z.enum([
    'PARENT',
    'CHILD',
    'SPOUSE',
    'SIBLING',
    'FRIEND',
    'OTHER',
  ]),
  country: z.string().min(2, 'Le pays est requis'),
  address: z.string().optional(),
});

/**
 * Schéma pour mettre à jour un bénéficiaire (format Facade)
 */
export const UpdateBeneficiarySchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  relationship: z.enum([
    'PARENT',
    'CHILD',
    'SPOUSE',
    'SIBLING',
    'FRIEND',
    'OTHER',
  ]).optional(),
  country: z.string().min(2).optional(),
  address: z.string().optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateBeneficiaryApiInput = z.infer<typeof CreateBeneficiaryApiSchema>;
export type UpdateBeneficiaryApiInput = z.infer<typeof UpdateBeneficiaryApiSchema>;
export type CreateBeneficiaryInput = z.infer<typeof CreateBeneficiarySchema>;
export type UpdateBeneficiaryInput = z.infer<typeof UpdateBeneficiarySchema>;

