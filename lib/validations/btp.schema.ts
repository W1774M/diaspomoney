/**
 * Schémas de validation Zod pour les services BTP
 * Utilisés dans les routes API pour valider les entrées
 */

import { BTP_CATEGORIES, CURRENCIES } from '@/lib/constants';
import { z } from 'zod';

/**
 * Schéma pour le type de propriété
 */
const PropertyTypeSchema = z.enum(['LAND', 'HOUSE', 'APARTMENT', 'COMMERCIAL', 'INDUSTRIAL'], {
  errorMap: () => ({ message: 'Invalid property type' }),
});

/**
 * Schéma pour le statut de propriété
 */
const PropertyStatusSchema = z.enum(['FOR_SALE', 'FOR_RENT', 'SOLD', 'RENTED', 'UNDER_CONSTRUCTION'], {
  errorMap: () => ({ message: 'Invalid property status' }),
});

/**
 * Schéma pour la localisation
 */
const LocationSchema = z.object({
  address: z.string().min(1, 'Address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  country: z.string().min(2, 'Country is required').max(100),
  postalCode: z.string().max(20).optional(),
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
  neighborhood: z.string().max(100).optional(),
});

/**
 * Schéma pour créer une propriété
 */
export const CreatePropertySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  type: PropertyTypeSchema,
  status: PropertyStatusSchema,
  price: z.number().positive('Price must be positive'),
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
  pricePerSqm: z.number().positive().optional(),
  area: z.number().positive('Area must be positive'),
  rooms: z.number().int().positive().optional(),
  bedrooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  floors: z.number().int().positive().optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  location: LocationSchema,
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Schéma pour créer un projet de construction
 */
export const CreateConstructionProjectSchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(5000).optional(),
  category: z.enum([
    BTP_CATEGORIES.CONSTRUCTION,
    BTP_CATEGORIES.RENOVATION,
    BTP_CATEGORIES.PLUMBING,
    BTP_CATEGORIES.ELECTRICITY,
    BTP_CATEGORIES.ROOFING,
    BTP_CATEGORIES.PAINTING,
    BTP_CATEGORIES.FLOORING,
    BTP_CATEGORIES.CARPENTRY,
    BTP_CATEGORIES.MASONRY,
    BTP_CATEGORIES.LANDSCAPING,
  ] as [string, ...string[]], {
    errorMap: () => ({ message: 'Invalid BTP category' }),
  }),
  location: LocationSchema,
  budget: z.number().positive('Budget must be positive').optional(),
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
  startDate: z.string().datetime().optional().or(z.date().optional()),
  endDate: z.string().datetime().optional().or(z.date().optional()),
  materials: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Schéma pour mettre à jour une propriété
 */
export const UpdatePropertySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  type: PropertyTypeSchema.optional(),
  status: PropertyStatusSchema.optional(),
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
  pricePerSqm: z.number().positive().optional(),
  area: z.number().positive().optional(),
  rooms: z.number().int().positive().optional(),
  bedrooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  floors: z.number().int().positive().optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  location: LocationSchema.optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;
export type CreateConstructionProjectInput = z.infer<typeof CreateConstructionProjectSchema>;
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>;

