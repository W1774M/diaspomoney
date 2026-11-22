/**
 * Politique de la messagerie interne - DiaspoMoney
 *
 * La messagerie interne ne contient que des échanges entre personnes.
 * Les notifications système (connexion, paiement, rendez-vous…) restent dans
 * le centre de notifications et ne sont jamais des conversations.
 *
 * Paires de rôles autorisées (dans les deux sens) :
 * - client / bénéficiaire ↔ prestataire
 * - client ↔ bénéficiaire
 * - client / bénéficiaire / prestataire ↔ support (ADMIN, SUPERADMIN)
 * - CSM ↔ prestataires de son portefeuille (csmPortfolioProviderIds) et
 *   ses clients / bénéficiaires, c'est-à-dire les demandeurs de commandes
 *   auprès de ces prestataires (csmClientIds, voir csm-clients.ts) ;
 *   vérifié par canPartiesMessage
 * - équipe interne (ADMIN, SUPERADMIN, CSM) entre elle
 *
 * Non autorisé : client ↔ client, prestataire ↔ prestataire,
 * bénéficiaire ↔ bénéficiaire (sauf si l'un des deux a aussi un autre rôle).
 */

export type MessagingRole =
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'CSM'
  | 'PROVIDER'
  | 'CUSTOMER'
  | 'BENEFICIARY';

const STAFF_ROLES: readonly MessagingRole[] = ['ADMIN', 'SUPERADMIN', 'CSM'];

const ALLOWED_PAIRS: ReadonlyArray<readonly [MessagingRole, MessagingRole]> = [
  // Client / bénéficiaire ↔ prestataire
  ['CUSTOMER', 'PROVIDER'],
  ['BENEFICIARY', 'PROVIDER'],
  // Client ↔ bénéficiaire
  ['CUSTOMER', 'BENEFICIARY'],
  // Support (admin) ↔ tous les utilisateurs
  ['CUSTOMER', 'ADMIN'],
  ['CUSTOMER', 'SUPERADMIN'],
  ['BENEFICIARY', 'ADMIN'],
  ['BENEFICIARY', 'SUPERADMIN'],
  ['PROVIDER', 'ADMIN'],
  ['PROVIDER', 'SUPERADMIN'],
  // CSM ↔ ses clients (prestataires du portefeuille, clients des commandes)
  ['CSM', 'PROVIDER'],
  ['CSM', 'CUSTOMER'],
  ['CSM', 'BENEFICIARY'],
  // Équipe interne
  ['ADMIN', 'ADMIN'],
  ['ADMIN', 'SUPERADMIN'],
  ['SUPERADMIN', 'SUPERADMIN'],
  ['CSM', 'ADMIN'],
  ['CSM', 'SUPERADMIN'],
  ['CSM', 'CSM'],
];

const KNOWN_ROLES = new Set<string>([
  'SUPERADMIN',
  'ADMIN',
  'CSM',
  'PROVIDER',
  'CUSTOMER',
  'BENEFICIARY',
]);

/** Normalise une liste de rôles (casse, valeurs inconnues ignorées). */
export function normalizeMessagingRoles(
  roles: ReadonlyArray<string | null | undefined> | null | undefined,
): MessagingRole[] {
  if (!Array.isArray(roles)) return [];
  return roles
    .map(r => (typeof r === 'string' ? r.trim().toUpperCase() : ''))
    .filter((r): r is MessagingRole => KNOWN_ROLES.has(r));
}

function isPairAllowed(a: MessagingRole, b: MessagingRole): boolean {
  return ALLOWED_PAIRS.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

/**
 * Indique si deux utilisateurs (via leurs rôles) peuvent échanger dans la
 * messagerie interne. Il suffit qu'un couple de rôles soit autorisé.
 */
export function canUsersMessage(
  rolesA: ReadonlyArray<string | null | undefined> | null | undefined,
  rolesB: ReadonlyArray<string | null | undefined> | null | undefined,
): boolean {
  const a = normalizeMessagingRoles(rolesA);
  const b = normalizeMessagingRoles(rolesB);
  return a.some(ra => b.some(rb => isPairAllowed(ra, rb)));
}

/** Personne côté messagerie : identifiant, rôles et lien métier éventuel. */
export interface MessagingParty {
  id: string;
  roles?: ReadonlyArray<string | null | undefined> | null;
  /** Prestataires suivis par un CSM (champ utilisateur csmPortfolioProviderIds). */
  csmPortfolioProviderIds?: ReadonlyArray<string | null | undefined> | null;
  /**
   * Clients d'un CSM : demandeurs des commandes passées auprès des
   * prestataires de son portefeuille (voir getCsmClientIds).
   */
  csmClientIds?: ReadonlyArray<string | null | undefined> | null;
}

function includesId(
  ids: ReadonlyArray<string | null | undefined> | null | undefined,
  id: string,
): boolean {
  return (ids || []).some(x => x != null && String(x) === id);
}

function inPortfolio(csm: MessagingParty, providerId: string): boolean {
  return includesId(csm.csmPortfolioProviderIds, providerId);
}

function isCsmClient(csm: MessagingParty, clientId: string): boolean {
  return includesId(csm.csmClientIds, clientId);
}

const CSM_CLIENT_ROLES: readonly MessagingRole[] = ['CUSTOMER', 'BENEFICIARY'];

/**
 * Comme canUsersMessage, en tenant compte du lien métier du CSM :
 * - avec un prestataire : celui-ci doit être dans son portefeuille
 *   (csmPortfolioProviderIds) ;
 * - avec un client ou un bénéficiaire : celui-ci doit être l'un de ses clients
 *   (csmClientIds, calculé par l'appelant).
 * Les autres paires restent au niveau des rôles. Pour un utilisateur
 * multi-rôles, il suffit qu'un couple de rôles soit autorisé et, le cas
 * échéant, que son lien métier soit vérifié.
 */
export function canPartiesMessage(a: MessagingParty, b: MessagingParty): boolean {
  const rolesA = normalizeMessagingRoles(a.roles);
  const rolesB = normalizeMessagingRoles(b.roles);
  return rolesA.some(ra =>
    rolesB.some(rb => {
      if (!isPairAllowed(ra, rb)) return false;
      if (ra === 'CSM' && rb === 'PROVIDER') return inPortfolio(a, b.id);
      if (ra === 'PROVIDER' && rb === 'CSM') return inPortfolio(b, a.id);
      if (ra === 'CSM' && CSM_CLIENT_ROLES.includes(rb)) return isCsmClient(a, b.id);
      if (CSM_CLIENT_ROLES.includes(ra) && rb === 'CSM') return isCsmClient(b, a.id);
      return true;
    }),
  );
}

/** Rôles internes (support / équipe). */
export function isStaffRole(
  roles: ReadonlyArray<string | null | undefined> | null | undefined,
): boolean {
  return normalizeMessagingRoles(roles).some(r => STAFF_ROLES.includes(r));
}

export interface ConversationLike {
  type?: string | null;
  participants?: ReadonlyArray<unknown> | null;
}

/**
 * Une conversation de la messagerie interne est un échange entre personnes :
 * type « user » (les tickets support ont leur propre page) et au moins deux
 * participants distincts.
 */
export function isPersonToPersonConversation(conv: ConversationLike): boolean {
  if (!conv) return false;
  if (conv.type && conv.type !== 'user') return false;
  const ids = new Set(
    (conv.participants || [])
      .map(p => {
        if (!p) return '';
        if (typeof p === 'string') return p;
        const obj = p as { _id?: { toString(): string }; toString(): string };
        return obj._id ? obj._id.toString() : obj.toString();
      })
      .filter(Boolean),
  );
  return ids.size >= 2;
}
