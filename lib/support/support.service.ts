/**
 * Support d'un compte utilisateur par l'administration : fiche, actions ciblées et
 * consultation en lecture seule (« voir en tant que »). Chaque action est journalisée
 * (journal d'audit, ressource SUPPORT) avec son auteur et son motif.
 */
import { ApiError } from '@/lib/api/error-handler';
import { issuePasswordReset } from '@/lib/auth/password-reset';
import { invalidateAppCache } from '@/lib/cache/redis';
import { USER_STATUSES } from '@/lib/constants';
import { unwrapFindOne } from '@/lib/database/find-one-result';
import { childLogger } from '@/lib/logger';
import { mongoClient } from '@/lib/mongodb';
import { auditLogging } from '@/lib/security/audit-logging';
import { getUserRepository } from '@/repositories';
import { ObjectId } from 'mongodb';

import {
  IMPERSONATION_REASON_MIN_LENGTH,
  IMPERSONATION_TTL_MS,
  canBeImpersonated,
  isSupportAgent,
  type ImpersonationState,
} from './impersonation-policy';

const log = childLogger({ component: 'SupportService' });

export const SUPPORT_RESOURCE = 'SUPPORT';
const TICKETS = 'support_impersonations';

export type SupportAction = 'suspend' | 'reactivate' | 'send-password-reset';
export const SUPPORT_ACTIONS: readonly SupportAction[] = ['suspend', 'reactivate', 'send-password-reset'];

export interface SupportAgent {
  id: string;
  name: string;
}

export interface RequestContext {
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

interface UserLike {
  id?: string;
  _id?: unknown;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  roles?: unknown[];
  status?: string;
  emailVerified?: unknown;
  createdAt?: unknown;
}

const userIdOf = (u: UserLike, fallback: string) => (u._id ? String(u._id) : (u.id ?? fallback));
const displayName = (u: UserLike) =>
  u.name?.trim() || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Utilisateur';
const rolesOf = (u: UserLike) => (u.roles ?? []).map(String);

async function db() {
  return (await mongoClient).db();
}

async function audit(
  action: string,
  agent: SupportAgent,
  targetId: string,
  details: Record<string, unknown>,
  ctx: RequestContext,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM',
) {
  await auditLogging.createAuditLog(
    action,
    SUPPORT_RESOURCE,
    { ...details, adminName: agent.name },
    {
      userId: agent.id,
      resourceId: targetId,
      method: 'SUPPORT',
      ...(ctx.ipAddress ? { ipAddress: ctx.ipAddress } : {}),
      ...(ctx.userAgent ? { userAgent: ctx.userAgent } : {}),
      severity,
      category: action.startsWith('SUPPORT_IMPERSONATION') ? 'DATA_ACCESS' : 'DATA_MODIFICATION',
    },
  );
}

function normalizeReason(reason: unknown): string {
  const text = typeof reason === 'string' ? reason.trim() : '';
  if (text.length < IMPERSONATION_REASON_MIN_LENGTH) {
    throw new ApiError(400, `Indiquez un motif (au moins ${IMPERSONATION_REASON_MIN_LENGTH} caractères, ex. « ticket 123 »).`, 'REASON_REQUIRED');
  }
  return text.slice(0, 500);
}

/** L'utilisateur connecté est-il un agent du support ? Rôles relus en base (pas de cache). */
export async function requireSupportAgent(userId: string | undefined): Promise<SupportAgent> {
  if (!userId) throw new ApiError(401, 'Non autorisé', 'UNAUTHORIZED');
  const user = (await getUserRepository().findById(userId)) as UserLike | null;
  if (!user || !isSupportAgent(rolesOf(user))) {
    throw new ApiError(403, 'Accès réservé au support (administrateurs).', 'FORBIDDEN');
  }
  return { id: userIdOf(user, userId), name: displayName(user) };
}

async function loadTarget(targetId: string): Promise<UserLike & { id: string }> {
  const user = ObjectId.isValid(targetId) ? ((await getUserRepository().findById(targetId)) as UserLike | null) : null;
  if (!user) throw new ApiError(404, 'Utilisateur introuvable', 'NOT_FOUND');
  return { ...user, id: userIdOf(user, targetId) };
}

/** Fiche support : état du compte, volumes, et dernières interventions du support. */
export async function getSupportSummary(targetId: string) {
  const user = await loadTarget(targetId);
  const database = await db();
  const [bookingsAsCustomer, bookingsAsProvider, transactions, invoices, history] = await Promise.all([
    database.collection('bookings').countDocuments({ requesterId: user.id }),
    database.collection('bookings').countDocuments({ providerId: user.id }),
    database.collection('transactions').countDocuments({ $or: [{ payerId: user.id }, { beneficiaryId: user.id }] }),
    database.collection('invoices').countDocuments({ userId: user.id }),
    database
      .collection('audit_logs')
      .find({ resource: SUPPORT_RESOURCE, resourceId: user.id })
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray(),
  ]);

  return {
    user: {
      id: user.id,
      name: displayName(user),
      email: user.email ?? '',
      roles: rolesOf(user),
      status: user.status ?? USER_STATUSES.PENDING,
      emailVerified: Boolean(user.emailVerified),
      createdAt: user.createdAt ?? null,
    },
    counts: { bookingsAsCustomer, bookingsAsProvider, transactions, invoices },
    canImpersonate: canBeImpersonated(rolesOf(user)) && user.status !== USER_STATUSES.SUSPENDED,
    history: history.map((entry) => ({
      id: String(entry['id'] ?? entry._id),
      action: String(entry['action']),
      at: entry['timestamp'] instanceof Date ? entry['timestamp'].toISOString() : String(entry['timestamp']),
      adminName: String(entry['details']?.adminName ?? ''),
      reason: String(entry['details']?.reason ?? ''),
    })),
  };
}

/** Action ciblée du support sur un compte. */
export async function runSupportAction(
  agent: SupportAgent,
  targetId: string,
  action: unknown,
  reasonInput: unknown,
  ctx: RequestContext & { baseUrl: string },
): Promise<{ message: string; status?: string }> {
  if (typeof action !== 'string' || !SUPPORT_ACTIONS.includes(action as SupportAction)) {
    throw new ApiError(400, 'Action inconnue', 'UNKNOWN_ACTION');
  }
  const reason = normalizeReason(reasonInput);
  const target = await loadTarget(targetId);
  if (target.id === agent.id) {
    throw new ApiError(400, 'Impossible d’agir sur votre propre compte depuis le support.', 'SELF_ACTION');
  }
  if (!canBeImpersonated(rolesOf(target)) && action !== 'send-password-reset') {
    throw new ApiError(403, 'Un compte administrateur ne se gère pas depuis le support.', 'TARGET_PROTECTED');
  }

  switch (action as SupportAction) {
    case 'suspend':
    case 'reactivate': {
      const status = action === 'suspend' ? USER_STATUSES.SUSPENDED : USER_STATUSES.ACTIVE;
      if (target.status === status) {
        throw new ApiError(409, action === 'suspend' ? 'Le compte est déjà suspendu.' : 'Le compte est déjà actif.', 'NO_CHANGE');
      }
      if (action === 'reactivate' && target.status === USER_STATUSES.PENDING) {
        throw new ApiError(409, 'Compte jamais activé : renvoyez plutôt le lien d’activation.', 'PENDING_ACCOUNT');
      }
      await getUserRepository().update(target.id, { status } as never);
      await invalidateAppCache('UserRepository');
      await audit(
        action === 'suspend' ? 'SUPPORT_ACCOUNT_SUSPENDED' : 'SUPPORT_ACCOUNT_REACTIVATED',
        agent,
        target.id,
        { reason, previousStatus: target.status ?? null, status },
        ctx,
        action === 'suspend' ? 'HIGH' : 'MEDIUM',
      );
      return { message: action === 'suspend' ? 'Compte suspendu.' : 'Compte réactivé.', status };
    }
    case 'send-password-reset': {
      if (!target.email) throw new ApiError(400, 'Ce compte n’a pas d’adresse e-mail.', 'NO_EMAIL');
      const sent = await issuePasswordReset(
        { id: target.id, email: target.email, name: target.name, firstName: target.firstName, lastName: target.lastName },
        ctx.baseUrl,
      );
      await audit('SUPPORT_PASSWORD_RESET_SENT', agent, target.id, { reason, emailSent: sent }, ctx);
      return {
        message: sent
          ? 'Lien de réinitialisation envoyé à l’utilisateur.'
          : 'Lien créé, mais l’e-mail n’a pas pu partir (service d’envoi indisponible).',
      };
    }
  }
}

/**
 * Prépare une consultation : crée un ticket à usage unique, valable IMPERSONATION_TTL_MS.
 * Le navigateur de l'admin l'échange ensuite contre une session de consultation
 * (mise à jour de session NextAuth, voir redeemImpersonationTicket).
 */
export async function createImpersonationTicket(
  agent: SupportAgent,
  targetId: string,
  reasonInput: unknown,
  ctx: RequestContext,
): Promise<{ ticketId: string; expiresAt: string }> {
  const reason = normalizeReason(reasonInput);
  const target = await loadTarget(targetId);
  if (target.id === agent.id) throw new ApiError(400, 'Vous ne pouvez pas consulter votre propre compte.', 'SELF_ACTION');
  if (!canBeImpersonated(rolesOf(target))) {
    throw new ApiError(403, 'Un compte administrateur ne peut pas être consulté.', 'TARGET_PROTECTED');
  }
  if (target.status === USER_STATUSES.SUSPENDED) {
    throw new ApiError(409, 'Compte suspendu : réactivez-le avant de le consulter.', 'TARGET_SUSPENDED');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + IMPERSONATION_TTL_MS);
  const { insertedId } = await (await db()).collection(TICKETS).insertOne({
    adminId: agent.id,
    adminName: agent.name,
    targetId: target.id,
    reason,
    createdAt: now,
    expiresAt,
    redeemedAt: null,
    endedAt: null,
  });
  await audit('SUPPORT_IMPERSONATION_REQUESTED', agent, target.id, { reason, ticketId: String(insertedId) }, ctx);
  return { ticketId: String(insertedId), expiresAt: expiresAt.toISOString() };
}

/**
 * Échange un ticket contre l'état de consultation porté par le jeton de session.
 * Le ticket doit appartenir à cet admin, ne jamais avoir servi et ne pas être expiré ;
 * les droits de l'admin et de la cible sont revérifiés. Renvoie null sinon.
 */
export async function redeemImpersonationTicket(ticketId: unknown, adminId: string): Promise<ImpersonationState | null> {
  if (typeof ticketId !== 'string' || !ObjectId.isValid(ticketId) || !adminId) return null;
  const now = new Date();
  const ticket = unwrapFindOne(
    await (await db()).collection(TICKETS).findOneAndUpdate(
      { _id: new ObjectId(ticketId), adminId, redeemedAt: null, endedAt: null, expiresAt: { $gt: now } },
      { $set: { redeemedAt: now } },
      { returnDocument: 'after' },
    ),
  );
  if (!ticket) {
    log.warn({ adminId }, 'Ticket de consultation refusé (inconnu, déjà utilisé ou expiré)');
    return null;
  }

  let agent: SupportAgent;
  let target: UserLike & { id: string };
  try {
    agent = await requireSupportAgent(adminId);
    target = await loadTarget(String(ticket['targetId']));
  } catch {
    return null;
  }
  if (!canBeImpersonated(rolesOf(target)) || target.status === USER_STATUSES.SUSPENDED) return null;

  const reason = String(ticket['reason'] ?? '');
  await audit('SUPPORT_IMPERSONATION_STARTED', agent, target.id, { reason, ticketId }, {});
  return {
    ticketId,
    adminId: agent.id,
    adminName: agent.name,
    targetId: target.id,
    targetEmail: target.email ?? '',
    targetName: displayName(target),
    targetRoles: rolesOf(target),
    reason,
    expiresAt: (ticket['expiresAt'] as Date).getTime(),
  };
}

/** Clôt une consultation (une seule fois, même si appelée plusieurs fois). */
export async function endImpersonation(state: ImpersonationState, cause: 'manual' | 'expired'): Promise<void> {
  if (!ObjectId.isValid(state.ticketId)) return;
  const { modifiedCount } = await (await db())
    .collection(TICKETS)
    .updateOne({ _id: new ObjectId(state.ticketId), endedAt: null }, { $set: { endedAt: new Date(), endCause: cause } });
  if (modifiedCount === 0) return;
  await audit(
    'SUPPORT_IMPERSONATION_ENDED',
    { id: state.adminId, name: state.adminName },
    state.targetId,
    { reason: state.reason, ticketId: state.ticketId, cause },
    {},
    'LOW',
  );
}

/**
 * À appeler dans le callback jwt de NextAuth. Démarre (update { impersonationTicket }),
 * termine (update { endImpersonation: true }) ou fait expirer une consultation.
 */
export async function applyImpersonationToToken<T extends Record<string, unknown>>(
  token: T,
  trigger: string | undefined,
  data: unknown,
): Promise<T> {
  const current = token['impersonation'] as ImpersonationState | undefined;
  if (current && !(typeof current.expiresAt === 'number' && current.expiresAt > Date.now())) {
    delete token['impersonation'];
    await endImpersonation(current, 'expired').catch((error) => log.warn({ error }, 'Clôture de consultation expirée impossible'));
  }

  if (trigger !== 'update' || !data || typeof data !== 'object') return token;
  const request = data as { impersonationTicket?: unknown; endImpersonation?: unknown };

  if (request.endImpersonation === true && token['impersonation']) {
    const active = token['impersonation'] as ImpersonationState;
    delete token['impersonation'];
    await endImpersonation(active, 'manual').catch((error) => log.warn({ error }, 'Clôture de consultation impossible'));
  } else if (request.impersonationTicket !== undefined && !token['impersonation'] && token['userId']) {
    const state = await redeemImpersonationTicket(request.impersonationTicket, String(token['userId']));
    if (state) (token as Record<string, unknown>)['impersonation'] = state;
  }
  return token;
}
