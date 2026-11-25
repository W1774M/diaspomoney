/**
 * Nettoyage ponctuel des réservations dont le providerId n'est pas un prestataire
 * (identifiant de service de l'ancien assistant, marqueur « admin-draft », voir #102).
 * Elles passent « non attribuées » (providerId vide) pour réapparaître à l'attribution.
 *
 * L'ancienne valeur est gardée dans metadata.clearedProviderId (retour arrière possible).
 * Dry-run par défaut ; idempotent : une réservation nettoyée n'est plus sélectionnée.
 */
import { invalidateAppCache } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';
import { mongoClient } from '@/lib/mongodb';

/** providerId texte, non vide, qui n'est pas un ObjectId. */
export const FAKE_PROVIDER_FILTER = {
  providerId: { $type: 'string', $nin: [''], $not: /^[a-f\d]{24}$/i },
} as const;

export interface ClearFakeProvidersReport {
  apply: boolean;
  found: number;
  cleared: number;
  /** Répartition par ancienne valeur (ex. { 'consultation-medical': 4, 'admin-draft': 2 }). */
  byValue: Record<string, number>;
}

export async function clearFakeProviderIds({ apply = false }: { apply?: boolean } = {}): Promise<ClearFakeProvidersReport> {
  const bookings = (await mongoClient).db().collection('bookings');

  const groups = await bookings
    .aggregate<{ _id: string; count: number }>([
      { $match: FAKE_PROVIDER_FILTER },
      { $group: { _id: '$providerId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();
  const byValue = Object.fromEntries(groups.map((g) => [g._id, g.count]));
  const found = groups.reduce((sum, g) => sum + g.count, 0);

  let cleared = 0;
  if (apply && found > 0) {
    const result = await bookings.updateMany(FAKE_PROVIDER_FILTER, [
      { $set: { 'metadata.clearedProviderId': '$providerId', providerId: '', updatedAt: '$$NOW' } },
    ]);
    cleared = result.modifiedCount;
    await invalidateAppCache('BookingRepository');
  }

  logger.info({ apply, found, cleared, byValue }, 'Réservations au prestataire fictif');
  return { apply, found, cleared, byValue };
}
