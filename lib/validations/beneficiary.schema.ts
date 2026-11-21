/**
 * Schémas de validation Zod pour les bénéficiaires
 * Utilisés dans les routes API pour valider les entrées
 */

import { z } from 'zod';

/**
 * Schéma pour créer un bénéficiaire (format API)
 */
export const CreateBeneficiaryApiSchema = z.object({
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
  ], {
    errorMap: () => ({ message: 'La relation est obligatoire' }),
  }),
  location: z.object({
    address: z.string().min(1, 'L\'adresse est requise'),
    city: z.string().min(1, 'La ville est requise'),
    country: z.string().min(2, 'Le pays est requis'),
    postalCode: z.string().optional(),
  }),
});

/**
 * Schéma pour mettre à jour un bénéficiaire (format API)
 */
export const UpdateBeneficiaryApiSchema = z.object({
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
  location: z.object({
    address: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    country: z.string().min(2).optional(),
    postalCode: z.string().optional(),
  }).optional(),
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
  location: z.object({
    address: z.string().min(1, 'L\'adresse est requise'),
    city: z.string().min(1, 'La ville est requise'),
    country: z.string().min(2, 'Le pays est requis'),
    postalCode: z.string().optional(),
  }),
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
  location: z.object({
    address: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    country: z.string().min(2).optional(),
    postalCode: z.string().optional(),
  }).optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateBeneficiaryApiInput = z.infer<typeof CreateBeneficiaryApiSchema>;
export type UpdateBeneficiaryApiInput = z.infer<typeof UpdateBeneficiaryApiSchema>;
export type CreateBeneficiaryInput = z.infer<typeof CreateBeneficiarySchema>;
export type UpdateBeneficiaryInput = z.infer<typeof UpdateBeneficiarySchema>;

