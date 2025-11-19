/**
 * Schémas de validation pour les utilisateurs
 */

import { z } from 'zod';

/**
 * Schéma pour créer un utilisateur
 * Accepte soit name, soit firstName/lastName
 */
export const CreateUserSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    name: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional(),
    country: z.string().optional(),
    roles: z.array(z.string()).optional(),
    status: z.string().optional(),
    specialty: z.string().optional(),
    recommended: z.boolean().optional(),
    clientNotes: z.string().optional(),
    preferences: z
      .object({
        language: z.string().optional(),
        timezone: z.string().optional(),
        notifications: z.boolean().optional(),
      })
      .optional(),
  })
  .refine(
    data => {
      // Soit name est fourni, soit firstName ET lastName sont fournis
      return (
        (data.name && data.name.trim().length > 0) ||
        (data.firstName && data.firstName.trim().length > 0 && data.lastName && data.lastName.trim().length > 0)
      );
    },
    {
      message: 'Soit le nom complet (name), soit le prénom et le nom (firstName et lastName) doivent être fournis',
    },
  );

/**
 * Schéma pour mettre à jour un utilisateur (tous les champs sont optionnels)
 */
export const UpdateUserSchema = z.object({
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  countryOfResidence: z.string().optional(),
  targetCountry: z.string().optional(),
  targetCity: z.string().optional(),
  monthlyBudget: z.string().optional(),
  marketingConsent: z.boolean().optional(),
  kycConsent: z.boolean().optional(),
  specialty: z.string().optional(),
  preferences: z.object({
    language: z.string().optional(),
    timezone: z.string().optional(),
    notifications: z.boolean().optional(),
  }).optional(),
  providerInfo: z.any().optional(),
  roles: z.array(z.string()).optional(),
  country: z.string().optional(),
});

/**
 * Schéma pour les filtres d'utilisateurs (query params)
 */
export const UserFiltersSchema = z.object({
  role: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
});
