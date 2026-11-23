/**
 * Proposition d'un prestataire par un CSM - DiaspoMoney
 *
 * Un CSM ne connaît pas forcément l'identifiant d'un prestataire, et peut
 * vouloir ajouter un prestataire qui n'a pas encore de compte. Il saisit ce
 * qu'il sait : un nom, et au moins un e-mail ou un téléphone.
 *
 * - Prestataire existant (même e-mail, ou même téléphone) : rattaché au
 *   portefeuille du CSM.
 * - Sinon : un compte prestataire est créé au statut PENDING, sans e-mail
 *   d'activation. Les admins sont notifiés ; ils valident (renvoi du lien
 *   d'activation) ou prennent contact si les données sont insuffisantes.
 * - Sans e-mail, le compte reçoit une adresse technique non routable
 *   (domaine réservé .invalid, RFC 2606) que l'admin doit remplacer avant
 *   d'envoyer l'activation.
 */

import { z } from 'zod';

export const PLACEHOLDER_EMAIL_DOMAIN = 'a-completer.invalid';

/** Adresse technique d'un compte proposé sans e-mail. */
export function buildPlaceholderEmail(seed: string = randomSeed()): string {
  const slug = seed.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24) || randomSeed();
  return `prestataire-${slug}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return (
    typeof email === 'string' &&
    email.trim().toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`)
  );
}

function randomSeed(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return (uuid || `${Date.now()}${Math.random()}`).replace(/[^a-z0-9]/gi, '');
}

/** Téléphone normalisé pour la comparaison (chiffres et + initial). */
export function normalizePhone(phone: string | null | undefined): string {
  if (typeof phone !== 'string') return '';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform(v => (v ? v : undefined));

export const ProviderProposalSchema = z
  .object({
    type: z.enum(['INDIVIDUAL', 'INSTITUTION']).default('INDIVIDUAL'),
    firstName: optionalText(100),
    lastName: optionalText(100),
    companyName: optionalText(200),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .transform(v => (v ? v : undefined))
      .refine(v => v === undefined || z.string().email().safeParse(v).success, {
        message: 'Adresse e-mail invalide',
      })
      .refine(v => !isPlaceholderEmail(v), {
        message: 'Adresse e-mail invalide',
      }),
    phone: optionalText(40).refine(
      v => v === undefined || normalizePhone(v).replace('+', '').length >= 6,
      { message: 'Numéro de téléphone invalide' },
    ),
    category: z.enum(['HEALTH', 'BTP', 'EDUCATION']).optional(),
    city: optionalText(120),
    notes: optionalText(2000),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'INSTITUTION') {
      if (!data.companyName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['companyName'],
          message: "Le nom de l'établissement est obligatoire",
        });
      }
    } else if (!data.firstName && !data.lastName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lastName'],
        message: 'Le nom du prestataire est obligatoire',
      });
    }
    if (!data.email && !data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Indiquez au moins un e-mail ou un téléphone',
      });
    }
  });

export type ProviderProposal = z.infer<typeof ProviderProposalSchema>;

/** Nom affiché du prestataire proposé. */
export function getProposalDisplayName(p: ProviderProposal): string {
  if (p.type === 'INSTITUTION' && p.companyName) return p.companyName;
  return [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
}

/** Informations manquantes, listées pour l'admin. */
export function getProposalMissingInfo(p: ProviderProposal): string[] {
  const missing: string[] = [];
  if (!p.email) missing.push('e-mail');
  if (!p.phone) missing.push('téléphone');
  if (!p.category) missing.push('catégorie');
  if (!p.city) missing.push('ville');
  if (p.type === 'INDIVIDUAL' && (!p.firstName || !p.lastName)) {
    missing.push(!p.firstName ? 'prénom' : 'nom');
  }
  return missing;
}

/** Trace de la proposition, stockée sur le compte (champ csmProposal). */
export interface CsmProposalRecord {
  csmId: string;
  csmName?: string;
  proposedAt: Date;
  notes?: string;
  emailToComplete: boolean;
  missingInfo: string[];
}
