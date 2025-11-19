/**
 * Schémas de validation pour les providers
 */

import { z } from 'zod';

/**
 * Schéma pour créer un provider
 */
export const CreateProviderSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  specialities: z.array(z.string()).min(1, 'At least one speciality is required'),
  category: z.string().optional(),
  city: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  services: z.array(z.string()).optional(),
});

/**
 * Schéma pour les filtres de providers (query params)
 */
export const ProviderFiltersSchema = z.object({
  role: z.string().default('PROVIDER').optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  specialty: z.string().optional(),
  service: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
});

