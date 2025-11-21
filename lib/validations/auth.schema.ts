/**
 * Schémas de validation Zod pour l'authentification
 * Utilisés dans les routes API pour valider les entrées
 */

import { z } from 'zod';

/**
 * Schéma pour l'inscription
 */
export const RegisterSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    phone: z.string().max(20, 'Phone number is too long').optional(),
    countryOfResidence: z.string().min(1, 'Country of residence is required').max(100),
    targetCountry: z.string().max(100).optional(),
    targetCity: z.string().max(100).optional(),
    dateOfBirth: z.string().datetime().optional().or(z.date().optional()),
    monthlyBudget: z.string().optional(),
    securityQuestion: z.string().optional(),
    securityAnswer: z.string().optional(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
    marketingConsent: z.boolean().optional().default(false),
    selectedServices: z.array(z.string()).optional(),
    oauth: z
      .object({
        provider: z.string(),
        providerAccountId: z.string(),
        accessToken: z.string().optional(),
        refreshToken: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // Soit password est fourni, soit oauth est fourni
      return data.password || data.oauth;
    },
    {
      message: 'Either password or OAuth credentials must be provided',
      path: ['password'],
    },
  )
  .refine(
    (data) => {
      // Si phone est fourni, il ne doit pas être trop long (vérification anti-erreur)
      if (data.phone && data.phone.length > 20) {
        return false;
      }
      return true;
    },
    {
      message: 'Phone number format is invalid',
      path: ['phone'],
    },
  );

/**
 * Schéma pour la réinitialisation de mot de passe
 */
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Schéma pour la demande de réinitialisation de mot de passe
 */
export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Schéma pour compléter le profil
 */
export const CompleteProfileSchema = z.object({
  phone: z.string().max(20, 'Phone number is too long').optional(),
  countryOfResidence: z.string().max(100).optional(),
  targetCountry: z.string().max(100).optional(),
  targetCity: z.string().max(100).optional(),
  monthlyBudget: z.string().optional(),
});

/**
 * Schéma pour la connexion
 */
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type CompleteProfileInput = z.infer<typeof CompleteProfileSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

