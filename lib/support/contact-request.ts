/**
 * Demande de support envoyée depuis la page publique /support.
 * Partagé entre le formulaire (validation champ par champ) et la route d'envoi.
 */
import { z } from 'zod';

export const SUPPORT_URGENCIES = {
  low: 'Normale (48 h)',
  medium: 'Urgente (24 h)',
  high: 'Critique (2 h)',
} as const;

export const SUPPORT_CATEGORIES = {
  service_tracking: 'Suivi de service',
  payment_issue: 'Problème de paiement',
  provider_quality: 'Qualité du prestataire',
  account_issue: 'Problème de compte',
  technical_issue: 'Problème technique',
  partnership: 'Devenir partenaire',
  other: 'Autre demande',
} as const;

const keys = <T extends object>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

export const SupportContactSchema = z.object({
  urgency: z.enum(keys(SUPPORT_URGENCIES), { errorMap: () => ({ message: "Choisissez un niveau d'urgence." }) }),
  category: z.enum(keys(SUPPORT_CATEGORIES), { errorMap: () => ({ message: 'Choisissez une catégorie.' }) }),
  userEmail: z
    .string({ required_error: 'Indiquez votre adresse e-mail.' })
    .trim()
    .min(1, 'Indiquez votre adresse e-mail.')
    .email('Adresse e-mail invalide, par exemple nom@exemple.fr.')
    .max(254),
  userPhone: z.string().trim().max(30).optional(),
  message: z
    .string({ required_error: 'Décrivez votre demande.' })
    .trim()
    .min(10, 'Décrivez votre demande en quelques mots (10 caractères au moins).')
    .max(5000, 'Message trop long (5 000 caractères au plus).'),
  /** Piège à robots : champ caché, toujours vide pour un humain. */
  website: z.string().optional(),
});

export type SupportContactInput = z.infer<typeof SupportContactSchema>;
export type SupportContactField = 'urgency' | 'category' | 'userEmail' | 'userPhone' | 'message';

/** Erreurs par champ (premier message de chaque champ). */
export function supportFieldErrors(error: z.ZodError): Partial<Record<SupportContactField, string>> {
  const out: Partial<Record<SupportContactField, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as SupportContactField;
    if (field && !out[field]) out[field] = issue.message;
  }
  return out;
}
