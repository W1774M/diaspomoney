/**
 * Mode consultation du support (« voir en tant que ») : règles pures, sans base de données,
 * utilisables par le proxy comme par les callbacks NextAuth.
 *
 * Un admin consulte le compte d'un utilisateur, en lecture seule et pour une durée limitée.
 * Pendant ce temps, la session présente l'utilisateur consulté à toute l'application ;
 * le proxy refuse toute requête qui pourrait modifier quelque chose.
 */

/** Durée maximale d'une consultation. */
export const IMPERSONATION_TTL_MS = 30 * 60 * 1000;

/** Longueur minimale du motif (ex. « ticket 123 »). */
export const IMPERSONATION_REASON_MIN_LENGTH = 5;

/** Rôles autorisés à consulter un compte. */
export const SUPPORT_ROLES: readonly string[] = ['ADMIN', 'SUPERADMIN'];

/** État porté par le jeton de session pendant une consultation. */
export interface ImpersonationState {
  ticketId: string;
  adminId: string;
  adminName: string;
  targetId: string;
  targetEmail: string;
  targetName: string;
  targetRoles: string[];
  reason: string;
  /** Fin de la consultation (ms depuis l'epoch). */
  expiresAt: number;
}

/** Ce que voit le navigateur (session.impersonation). */
export interface ImpersonationInfo {
  adminName: string;
  targetId: string;
  targetName: string;
  reason: string;
  expiresAt: number;
}

export function isSupportAgent(roles: readonly string[] | undefined): boolean {
  return (roles ?? []).some((role) => SUPPORT_ROLES.includes(role));
}

/** Un compte d'administration ne peut jamais être consulté (pas d'élévation de droits). */
export function canBeImpersonated(roles: readonly string[] | undefined): boolean {
  return !isSupportAgent(roles);
}

export function isImpersonationActive(state: unknown, now = Date.now()): state is ImpersonationState {
  if (!state || typeof state !== 'object') return false;
  const s = state as Partial<ImpersonationState>;
  return (
    typeof s.expiresAt === 'number' &&
    s.expiresAt > now &&
    typeof s.targetId === 'string' &&
    s.targetId.length > 0 &&
    typeof s.adminId === 'string' &&
    s.adminId.length > 0
  );
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Requêtes d'écriture qui restent permises pendant une consultation : celles de NextAuth
 * pour mettre fin à la consultation (mise à jour de session), se déconnecter et journaliser.
 * Les autres routes /api/auth/* (inscription, mot de passe…) restent bloquées.
 */
const WRITE_ALLOWLIST = new Set(['/api/auth/session', '/api/auth/signout', '/api/auth/_log']);

/** La requête est-elle permise en mode consultation (lecture seule) ? */
export function isAllowedDuringImpersonation(method: string, pathname: string): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return true;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return WRITE_ALLOWLIST.has(path);
}

export const IMPERSONATION_READ_ONLY_MESSAGE =
  "Mode consultation du support : cette action est désactivée. Quittez la consultation pour agir.";

/** La session (résultat de auth()) est-elle une consultation du support ? */
export function isImpersonatedSession(session: unknown): boolean {
  const info = (session as { impersonation?: { expiresAt?: unknown } } | null)?.impersonation;
  return Boolean(info && typeof info.expiresAt === 'number' && info.expiresAt > Date.now());
}

export function toImpersonationInfo(state: ImpersonationState): ImpersonationInfo {
  return {
    adminName: state.adminName,
    targetId: state.targetId,
    targetName: state.targetName,
    reason: state.reason,
    expiresAt: state.expiresAt,
  };
}
