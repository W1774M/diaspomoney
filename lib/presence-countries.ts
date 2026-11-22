/**
 * Pays affichés dans les badges de la page d'accueil (« Présent au Cameroun »,
 * « Bientôt en Côte d’Ivoire »…). Gérés par l'admin depuis /dashboard/presence-countries.
 * Ce module ne dépend d'aucun code serveur : il est utilisable côté client.
 */
import { z } from 'zod';

export const PRESENCE_STATUSES = ['present', 'coming_soon'] as const;
export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

/** Préposition devant le nom du pays : « au Cameroun », « en RDC », « aux Comores ». */
export const COUNTRY_PREPOSITIONS = ['au', 'en', 'aux', 'à'] as const;
export type CountryPreposition = (typeof COUNTRY_PREPOSITIONS)[number];

export interface PresenceCountry {
  id: string;
  /** Code ISO 3166-1 alpha-2 en majuscules (ex. « CM »). */
  iso: string;
  name: string;
  preposition: CountryPreposition;
  status: PresenceStatus;
  /** Ordre d'affichage croissant. */
  order: number;
}

export type PresenceCountryInput = Omit<PresenceCountry, 'id'>;

/** Liste initiale, importée en base au premier accès. */
export const DEFAULT_PRESENCE_COUNTRIES: PresenceCountryInput[] = [
  { iso: 'CM', name: 'Cameroun', preposition: 'au', status: 'present', order: 1 },
  { iso: 'CG', name: 'Congo', preposition: 'au', status: 'present', order: 2 },
  { iso: 'CI', name: 'Côte d’Ivoire', preposition: 'en', status: 'coming_soon', order: 3 },
  { iso: 'SN', name: 'Sénégal', preposition: 'au', status: 'coming_soon', order: 4 },
  { iso: 'CD', name: 'RDC', preposition: 'en', status: 'coming_soon', order: 5 },
  { iso: 'RW', name: 'Rwanda', preposition: 'au', status: 'coming_soon', order: 6 },
];

/** « au Cameroun », « en Côte d’Ivoire ». */
export function inCountryLabel(country: Pick<PresenceCountry, 'name' | 'preposition'>): string {
  return `${country.preposition} ${country.name}`;
}

/** Libellé du badge : « Présent au Cameroun » ou « Bientôt en Côte d’Ivoire ». */
export function presenceBadgeLabel(country: PresenceCountry): string {
  const prefix = country.status === 'present' ? 'Présent' : 'Bientôt';
  return `${prefix} ${inCountryLabel(country)}`;
}

/** URL du drapeau SVG (servi par /api/flags/[iso]). */
export function flagUrl(iso: string): string {
  return `/api/flags/${encodeURIComponent(iso.toUpperCase())}`;
}

export const PresenceCountryCreateSchema = z.object({
  iso: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, 'Code ISO à 2 lettres attendu')
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(60),
  preposition: z.enum(COUNTRY_PREPOSITIONS),
  status: z.enum(PRESENCE_STATUSES),
  order: z.number().int().min(0).max(999).optional(),
});

export const PresenceCountryUpdateSchema = PresenceCountryCreateSchema.partial();
