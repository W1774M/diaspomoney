/**
 * Schémas de validation Zod pour ServiceBookingFacadeData
 */

import { z } from 'zod';
import { SPECIALITY_TYPES } from '@/lib/constants';

/**
 * Schéma pour ClientInfo
 */
const ClientInfoSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  phone: z.string().min(1, 'Le téléphone est requis'),
  email: z.string().email('Email invalide'),
});

/**
 * Schéma pour BeneficiaryInfo
 */
const BeneficiaryInfoSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  phone: z.string().min(1, 'Le téléphone est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  country: z.string().optional(), // Optionnel car peut être dans location.country
  location: z.object({
    address: z.string(),
    city: z.string(),
    country: z.string(),
    postalCode: z.string().optional(),
  }).optional(),
});

/**
 * Schéma pour SelectedService
 */
const SelectedServiceSchema = z.object({
  serviceId: z.string().min(1, 'L\'ID du service est requis'),
  category: z.string().min(1, 'La catégorie est requise'),
  label: z.string().min(1, 'Le label est requis'),
  description: z.string().default(''), // Permettre une description vide
  price: z.number().positive('Le prix doit être positif'),
  options: z.array(z.any()).default([]),
});

/**
 * Schéma pour ServiceOption
 * Note: La catégorie est optionnelle car une option peut être associée à plusieurs services de catégories différentes
 */
const ServiceOptionSchema = z.object({
  id: z.string(),
  category: z.string().optional(), // Optionnel car une option peut être multi-catégories
  label: z.string(),
  description: z.string().optional(),
  price: z.number(),
  optional: z.boolean().optional(),
});

/**
 * Schéma pour ServiceBookingFacadeData
 */
export const ServiceBookingFacadeDataSchema = z.object({
  serviceType: z.enum([
    SPECIALITY_TYPES.HEALTH,
    SPECIALITY_TYPES.BTP,
    SPECIALITY_TYPES.EDUCATION,
    SPECIALITY_TYPES.LEGAL,
    SPECIALITY_TYPES.FINANCE,
    SPECIALITY_TYPES.TECHNOLOGY,
  ]),
  clientInfo: ClientInfoSchema,
  beneficiaryInfo: BeneficiaryInfoSchema,
  selectedService: SelectedServiceSchema,
  additionalOptions: z.array(ServiceOptionSchema).default([]),
  paymentIntentId: z.string().min(1, 'Le paymentIntentId est requis'),
  appointmentDate: z.string().optional(),
  appointmentTime: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Type TypeScript dérivé du schéma
 */
export type ServiceBookingFacadeDataInput = z.infer<typeof ServiceBookingFacadeDataSchema>;

