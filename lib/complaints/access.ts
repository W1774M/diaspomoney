/**
 * Règles d'accès aux réclamations, partagées entre la page et l'API.
 *
 * - CUSTOMER / PROVIDER : leurs propres réclamations
 * - CSM : réclamations des prestataires de son portefeuille (filtré côté API)
 * - ADMIN / SUPERADMIN : toutes les réclamations
 */
import { ROLES } from '@/lib/constants';

export const COMPLAINTS_ALLOWED_ROLES = [
  ROLES.CUSTOMER,
  ROLES.PROVIDER,
  ROLES.CSM,
  ROLES.ADMIN,
  ROLES.SUPERADMIN,
] as const;

export type ComplaintsScope = 'all' | 'csm-portfolio' | 'own';

export function isComplaintsAdmin(roles: readonly string[] = []): boolean {
  return roles.includes(ROLES.ADMIN) || roles.includes(ROLES.SUPERADMIN);
}

export function canAccessComplaints(roles: readonly string[] = []): boolean {
  return COMPLAINTS_ALLOWED_ROLES.some(role => roles.includes(role));
}

/** Périmètre de lecture : l'admin prime sur le CSM (un admin peut aussi être CSM). */
export function getComplaintsScope(roles: readonly string[] = []): ComplaintsScope {
  if (isComplaintsAdmin(roles)) return 'all';
  if (roles.includes(ROLES.CSM)) return 'csm-portfolio';
  return 'own';
}
