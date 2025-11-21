/**
 * Schémas de validation Zod pour les devis
 * Utilisés dans les routes API pour valider les entrées
 */

import { z } from 'zod';

/**
 * Schéma pour les informations de contact
 */
const ContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional(),
});

/**
 * Schéma pour la localisation
 */
const LocationSchema = z.object({
  city: z.string().min(1, 'City is required').max(100),
  country: z.string().min(2, 'Country is required').max(100),
});

/**
 * Schéma pour les informations étudiant (EDUCATION)
 */
const StudentInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  dateOfBirth: z.string().date().optional().or(z.date().optional()),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  nationality: z.string().max(100).optional(),
});

/**
 * Schéma pour les informations académiques (EDUCATION)
 */
const AcademicInfoSchema = z.object({
  currentLevel: z.string().max(100).optional(),
  desiredProgram: z.string().max(200).optional(),
  academicYear: z.string().max(50).optional(),
  previousEducation: z.string().max(500).optional(),
});

/**
 * Schéma pour créer un devis
 */
export const CreateQuoteSchema = z
  .object({
    type: z.enum(['BTP', 'EDUCATION'], {
      errorMap: () => ({ message: 'Quote type must be either "BTP" or "EDUCATION"' }),
    }),
    // Champs communs
    budget: z.number().positive('Budget must be positive').optional(),
    timeline: z.string().max(200).optional(),
    location: LocationSchema.optional(),
    contact: ContactSchema,
    description: z.string().max(2000).optional(),
    urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    // Champs spécifiques BTP
    projectType: z.string().max(100).optional(),
    area: z.number().positive().optional(),
    features: z.array(z.string()).optional(),
    providerId: z.string().min(1).optional(),
    // Champs spécifiques EDUCATION
    studentType: z.enum(['SELF', 'CHILD', 'DEPENDENT']).optional(),
    studentInfo: StudentInfoSchema.optional(),
    academicInfo: AcademicInfoSchema.optional(),
    schoolId: z.string().min(1).optional(),
    preferences: z
      .object({
        language: z.string().max(10).optional(),
        schedule: z.string().max(200).optional(),
        budget: z.number().positive().optional(),
        urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
      })
      .optional(),
    questions: z.string().max(1000).optional(),
  })
  .refine(
    data => {
      // Pour BTP, projectType ou area doit être fourni
      if (data.type === 'BTP') {
        return data.projectType || data.area;
      }
      // Pour EDUCATION, studentInfo doit être fourni
      if (data.type === 'EDUCATION') {
        return data.studentInfo;
      }
      return true;
    },
    {
      message: 'Required fields are missing for the selected quote type',
    },
  );

/**
 * Schéma pour mettre à jour un devis
 */
export const UpdateQuoteSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
  costEstimate: z.number().positive().optional(),
  budget: z.number().positive().optional(),
  timeline: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof UpdateQuoteSchema>;

