/**
 * Schémas de validation Zod pour les services d'éducation
 * Utilisés dans les routes API pour valider les entrées
 */

import { CURRENCIES, EDUCATION_LEVELS } from '@/lib/constants';
import { z } from 'zod';

/**
 * Schéma pour créer un service d'éducation
 */
export const CreateEducationServiceSchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  name: z.string().min(1, 'Service name is required').max(200),
  description: z.string().max(2000).optional(),
  level: z.enum([
    EDUCATION_LEVELS.PRIMARY,
    EDUCATION_LEVELS.SECONDARY,
    EDUCATION_LEVELS.HIGH_SCHOOL,
    EDUCATION_LEVELS.BACHELOR,
    EDUCATION_LEVELS.MASTER,
    EDUCATION_LEVELS.DOCTORATE,
    EDUCATION_LEVELS.PROFESSIONAL,
  ] as [string, ...string[]], {
    errorMap: () => ({ message: 'Invalid education level' }),
  }),
  program: z.string().max(200).optional(),
  duration: z.string().max(100).optional(),
  price: z.number().positive('Price must be positive').optional(),
  currency: z
    .enum([
      CURRENCIES.EUR.code,
      CURRENCIES.USD.code,
      CURRENCIES.XOF.code,
      CURRENCIES.XAF.code,
      CURRENCIES.GBP.code,
      CURRENCIES.JPY.code,
    ] as [string, ...string[]])
    .optional()
    .default(CURRENCIES.XOF.code),
  language: z.string().max(10).optional(),
  schedule: z.string().max(200).optional(),
  location: z
    .object({
      address: z.string().max(200).optional(),
      city: z.string().max(100).optional(),
      country: z.string().max(100).optional(),
      online: z.boolean().optional(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Schéma pour mettre à jour un service d'éducation
 */
export const UpdateEducationServiceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  level: z
    .enum([
      EDUCATION_LEVELS.PRIMARY,
      EDUCATION_LEVELS.SECONDARY,
      EDUCATION_LEVELS.HIGH_SCHOOL,
      EDUCATION_LEVELS.BACHELOR,
      EDUCATION_LEVELS.MASTER,
      EDUCATION_LEVELS.DOCTORATE,
      EDUCATION_LEVELS.PROFESSIONAL,
    ] as [string, ...string[]])
    .optional(),
  program: z.string().max(200).optional(),
  duration: z.string().max(100).optional(),
  price: z.number().positive().optional(),
  currency: z
    .enum([
      CURRENCIES.EUR.code,
      CURRENCIES.USD.code,
      CURRENCIES.XOF.code,
      CURRENCIES.XAF.code,
      CURRENCIES.GBP.code,
      CURRENCIES.JPY.code,
    ] as [string, ...string[]])
    .optional(),
  language: z.string().max(10).optional(),
  schedule: z.string().max(200).optional(),
  location: z
    .object({
      address: z.string().max(200).optional(),
      city: z.string().max(100).optional(),
      country: z.string().max(100).optional(),
      online: z.boolean().optional(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateEducationServiceInput = z.infer<typeof CreateEducationServiceSchema>;
export type UpdateEducationServiceInput = z.infer<typeof UpdateEducationServiceSchema>;

