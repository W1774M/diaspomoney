/**
 * Cas d'usage : un CSM ajoute un prestataire à son portefeuille sans
 * connaître son identifiant (voir lib/csm/provider-proposal.ts).
 *
 * 1. Rapprochement : prestataire existant avec le même e-mail, sinon le même
 *    téléphone → rattachement au portefeuille.
 * 2. Sinon : création d'un compte prestataire PENDING (sans e-mail
 *    d'activation), rattaché au portefeuille, d'une candidature « Nouvelle »
 *    (source CSM, page admin Candidatures prestataires) et notification
 *    in-app des admins, qui valident ou contactent le prestataire.
 */

import { ObjectId } from 'mongodb';
import { DATABASE, ROLES, USER_STATUSES } from '@/lib/constants';
import { getMongoClient } from '@/lib/database/mongodb';
import { invalidateAppCache } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';
import {
  buildPlaceholderEmail,
  getProposalDisplayName,
  getProposalMissingInfo,
  normalizePhone,
  type CsmProposalRecord,
  type ProviderProposal,
} from '@/lib/csm/provider-proposal';
import { PROVIDER_APPLICATIONS_COLLECTION } from '@/lib/provider-applications';

export type ProposeProviderOutcome =
  | { status: 'linked'; providerId: string; providerName: string }
  | { status: 'created'; providerId: string; providerName: string; missingInfo: string[] }
  | { status: 'conflict'; message: string };

export interface ProposeProviderContext {
  csmId: string;
  csmName?: string;
  /** URL publique de l'application, pour le lien de la notification admin. */
  baseUrl?: string;
}

function isProvider(doc: any): boolean {
  const roles: string[] = Array.isArray(doc?.roles) ? doc.roles.map(String) : [];
  return roles.some(r => r.toUpperCase() === ROLES.PROVIDER);
}

function displayNameOf(doc: any, fallback: string): string {
  return (
    doc?.name ||
    `${doc?.firstName || ''} ${doc?.lastName || ''}`.trim() ||
    fallback
  );
}

export async function proposeProviderForCsm(
  proposal: ProviderProposal,
  ctx: ProposeProviderContext,
): Promise<ProposeProviderOutcome> {
  const client = await getMongoClient();
  const users = client.db().collection(DATABASE.COLLECTIONS.USERS);
  const providerName = getProposalDisplayName(proposal);

  // 1. Rapprochement par e-mail
  if (proposal.email) {
    const existing = await users.findOne({ email: proposal.email });
    if (existing) {
      if (!isProvider(existing)) {
        return {
          status: 'conflict',
          message:
            "Un compte non prestataire existe déjà avec cet e-mail. Contactez le support pour qu'il soit converti en prestataire.",
        };
      }
      const providerId = existing._id.toString();
      await addToPortfolio(users, ctx.csmId, providerId);
      return { status: 'linked', providerId, providerName: displayNameOf(existing, providerName) };
    }
  }

  // 2. Rapprochement par téléphone (prestataires uniquement)
  const phone = normalizePhone(proposal.phone);
  if (phone) {
    const candidates = Array.from(
      new Set([proposal.phone, phone].filter((v): v is string => !!v)),
    );
    const existing = await users.findOne({
      phone: { $in: candidates },
      roles: ROLES.PROVIDER,
    });
    if (existing) {
      const providerId = existing._id.toString();
      await addToPortfolio(users, ctx.csmId, providerId);
      return { status: 'linked', providerId, providerName: displayNameOf(existing, providerName) };
    }
  }

  // 3. Création d'un compte prestataire en attente de validation
  const missingInfo = getProposalMissingInfo(proposal);
  const now = new Date();
  const csmProposal: CsmProposalRecord = {
    csmId: ctx.csmId,
    ...(ctx.csmName ? { csmName: ctx.csmName } : {}),
    proposedAt: now,
    ...(proposal.notes ? { notes: proposal.notes } : {}),
    emailToComplete: !proposal.email,
    missingInfo,
  };

  const isInstitution = proposal.type === 'INSTITUTION';
  const firstName = isInstitution ? providerName : proposal.firstName || '';
  const lastName = isInstitution ? '' : proposal.lastName || '';

  const doc = {
    email: proposal.email || buildPlaceholderEmail(),
    name: providerName,
    firstName,
    lastName,
    ...(proposal.phone ? { phone: proposal.phone } : {}),
    roles: [ROLES.PROVIDER],
    status: USER_STATUSES.PENDING,
    isEmailVerified: false,
    emailVerified: false,
    providerInfo: {
      type: proposal.type,
      ...(proposal.category ? { category: proposal.category } : {}),
      specialties: [],
      isVerified: false,
      ...(isInstitution ? { institution: { legalName: providerName } } : {}),
      ...(proposal.city ? { professionalAddress: { city: proposal.city } } : {}),
    },
    csmProposal,
    createdAt: now,
    updatedAt: now,
  };

  const inserted = await users.insertOne(doc as any);
  const providerId = inserted.insertedId.toString();
  await addToPortfolio(users, ctx.csmId, providerId);

  // Candidature « Nouvelle » : l'admin suit la proposition (Contactée,
  // Acceptée, Refusée) dans Candidatures prestataires, comme les demandes
  // « Devenir prestataire ».
  await createApplication(client, {
    name: providerName,
    email: proposal.email || '',
    phone: proposal.phone || '',
    note: buildApplicationNote(proposal.notes, missingInfo),
    csmId: ctx.csmId,
    ...(ctx.csmName ? { csmName: ctx.csmName } : {}),
    providerUserId: providerId,
    submittedAt: now,
  });

  await notifyAdmins(users, {
    providerId,
    providerName,
    csmName: ctx.csmName || 'Un CSM',
    contact: [proposal.email, proposal.phone].filter(Boolean).join(' / '),
    missingInfo,
    baseUrl: ctx.baseUrl,
  });

  return { status: 'created', providerId, providerName, missingInfo };
}

function buildApplicationNote(notes: string | undefined, missingInfo: string[]): string {
  const lines: string[] = [];
  if (notes) lines.push(`Note du CSM : ${notes}`);
  if (missingInfo.length > 0) lines.push(`À compléter : ${missingInfo.join(', ')}`);
  return lines.join('\n');
}

async function createApplication(
  client: any,
  application: {
    name: string;
    email: string;
    phone: string;
    note: string;
    csmId: string;
    csmName?: string;
    providerUserId: string;
    submittedAt: Date;
  },
) {
  try {
    await client
      .db()
      .collection(PROVIDER_APPLICATIONS_COLLECTION)
      .insertOne({
        ...application,
        status: 'new',
        source: 'csm',
        createdAt: application.submittedAt,
        updatedAt: application.submittedAt,
      });
  } catch (error) {
    // Le compte et le rattachement restent : l'admin le retrouve dans
    // Prestataires > En attente et via la notification.
    logger.warn(
      { error, providerId: application.providerUserId },
      'Failed to create provider application for CSM proposal',
    );
  }
}

async function addToPortfolio(users: any, csmId: string, providerId: string) {
  await users.updateOne(
    { _id: new ObjectId(csmId) },
    { $addToSet: { csmPortfolioProviderIds: providerId } },
  );
  await invalidateAppCache('UserRepository'); // écriture hors dépôt : vider le cache
}

async function notifyAdmins(
  users: any,
  info: {
    providerId: string;
    providerName: string;
    csmName: string;
    contact: string;
    missingInfo: string[];
    baseUrl?: string | undefined;
  },
) {
  try {
    const admins = await users
      .find(
        { roles: { $in: [ROLES.ADMIN, ROLES.SUPERADMIN] } },
        { projection: { _id: 1 } },
      )
      .toArray();
    if (admins.length === 0) return;

    const { notificationService } = await import(
      '@/services/notification/notification.service'
    );
    const providerUrl = `${(info.baseUrl || '').replace(/\/$/, '')}/dashboard/users/${info.providerId}`;
    const missingLine =
      info.missingInfo.length > 0
        ? `Informations manquantes : ${info.missingInfo.join(', ')}. Prenez contact avec le prestataire pour les compléter.`
        : 'Les informations principales sont renseignées : vérifiez-les puis envoyez le lien d’activation.';

    await Promise.all(
      admins.map((admin: any) =>
        notificationService.sendNotification({
          recipient: admin._id.toString(),
          type: 'CSM_PROVIDER_PROPOSED',
          template: 'admin_csm_provider_proposed',
          data: {
            providerName: info.providerName,
            csmName: info.csmName,
            contact: info.contact || 'non renseigné',
            missingLine,
            providerUrl,
          },
          channels: [{ type: 'IN_APP', enabled: true, priority: 'MEDIUM' }],
          locale: 'fr',
          priority: 'MEDIUM',
          userId: admin._id.toString(),
        } as any),
      ),
    );
  } catch (error) {
    // La proposition reste enregistrée ; les admins la retrouvent dans
    // Prestataires > En attente.
    logger.warn(
      { error, providerId: info.providerId },
      'Failed to notify admins of CSM provider proposal',
    );
  }
}
