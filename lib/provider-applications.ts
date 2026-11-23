/**
 * Candidatures « Devenir prestataire » (formulaire de la roadmap, page d'accueil).
 * Stockées dans la collection Mongo `roadmap_provider_interest`.
 * Module partagé client/serveur : types, libellés et schémas de validation.
 */
import { z } from 'zod';

export const PROVIDER_APPLICATIONS_COLLECTION = 'roadmap_provider_interest';

export const PROVIDER_APPLICATION_STATUSES = ['new', 'contacted', 'accepted', 'rejected'] as const;
export type ProviderApplicationStatus = (typeof PROVIDER_APPLICATION_STATUSES)[number];

export const PROVIDER_APPLICATION_STATUS_LABELS: Record<ProviderApplicationStatus, string> = {
  new: 'Nouvelle',
  contacted: 'Contactée',
  accepted: 'Acceptée',
  rejected: 'Refusée',
};

export interface ProviderApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: ProviderApplicationStatus;
  note: string;
  submittedAt: string | null;
  updatedAt: string | null;
}

export const ProviderApplicationUpdateSchema = z
  .object({
    status: z.enum(PROVIDER_APPLICATION_STATUSES).optional(),
    note: z.string().trim().max(2000).optional(),
  })
  .refine((data) => data.status !== undefined || data.note !== undefined, {
    message: 'Rien à modifier',
  });

export type ProviderApplicationUpdate = z.infer<typeof ProviderApplicationUpdateSchema>;

/** Les documents antérieurs à la gestion du statut n'en ont pas : ils sont « nouveaux ». */
export function normalizeApplicationStatus(value: unknown): ProviderApplicationStatus {
  return PROVIDER_APPLICATION_STATUSES.includes(value as ProviderApplicationStatus)
    ? (value as ProviderApplicationStatus)
    : 'new';
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function toProviderApplication(doc: Record<string, unknown>): ProviderApplication {
  return {
    id: String(doc['_id']),
    name: String(doc['name'] ?? ''),
    email: String(doc['email'] ?? ''),
    phone: String(doc['phone'] ?? ''),
    status: normalizeApplicationStatus(doc['status']),
    note: typeof doc['note'] === 'string' ? doc['note'] : '',
    submittedAt: toIso(doc['submittedAt'] ?? doc['createdAt']),
    updatedAt: toIso(doc['updatedAt']),
  };
}
