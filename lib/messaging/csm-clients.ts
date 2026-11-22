/**
 * Clients d'un CSM pour la messagerie interne.
 *
 * Le champ csmId des commandes n'est jamais renseigné : comme pour la liste
 * des commandes d'un CSM (/api/bookings), on dérive son périmètre de son
 * portefeuille. Ses clients sont les demandeurs (requesterId) des commandes
 * passées auprès des prestataires de son portefeuille (csmPortfolioProviderIds).
 */

import { getMongoClient } from '@/lib/database/mongodb';
import {
  normalizeMessagingRoles,
  type MessagingParty,
} from '@/lib/messaging/conversation-policy';

const BOOKINGS_COLLECTION = 'bookings';

export async function getCsmClientIds(
  portfolioProviderIds: ReadonlyArray<string | null | undefined> | null | undefined,
): Promise<string[]> {
  const providerIds = (portfolioProviderIds || [])
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
  if (providerIds.length === 0) return [];

  const client = await getMongoClient();
  const requesterIds = await client
    .db()
    .collection(BOOKINGS_COLLECTION)
    .distinct('requesterId', { providerId: { $in: providerIds } });

  return requesterIds
    .filter(id => id != null)
    .map(id => String(id));
}

/**
 * Complète une personne CSM avec la liste de ses clients (csmClientIds), pour
 * canPartiesMessage. Les autres personnes sont renvoyées telles quelles.
 * Le cache évite de recalculer la liste d'un même CSM dans une requête.
 */
export async function withCsmClients(
  party: MessagingParty,
  cache?: Map<string, Promise<string[]>>,
): Promise<MessagingParty> {
  if (!normalizeMessagingRoles(party.roles).includes('CSM')) return party;
  if (party.csmClientIds) return party;

  let pending = cache?.get(party.id);
  if (!pending) {
    pending = getCsmClientIds(party.csmPortfolioProviderIds);
    cache?.set(party.id, pending);
  }
  return { ...party, csmClientIds: await pending };
}
