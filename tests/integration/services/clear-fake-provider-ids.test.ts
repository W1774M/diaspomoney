/**
 * Nettoyage des réservations au prestataire fictif, sur la base de test : dry-run sans
 * écriture, puis passage en « non attribuée » avec l'ancienne valeur gardée, idempotent.
 */
import { ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';

import { mongoClient } from '@/lib/mongodb';
import { clearFakeProviderIds } from '@/services/booking/clear-fake-provider-ids';

const bookings = async () => (await mongoClient).db().collection('bookings');

describe('clearFakeProviderIds', () => {
  it('ne touche qu’aux providerId qui ne sont pas des prestataires', async () => {
    const real = new ObjectId().toString();
    const col = await bookings();
    await col.insertMany([
      { ref: 'reel', providerId: real, metadata: { a: 1 } },
      { ref: 'objectid', providerId: new ObjectId() },
      { ref: 'vide', providerId: '' },
      { ref: 'absent' },
      { ref: 'service-1', providerId: 'consultation-medical', metadata: { a: 1 } },
      { ref: 'service-2', providerId: 'consultation-medical' },
      { ref: 'brouillon', providerId: 'admin-draft' },
    ]);
    const snapshot = async () => Object.fromEntries((await col.find({}).toArray()).map((d) => [d['ref'], d]));
    const before = await snapshot();

    // Dry-run : rapport, aucune écriture
    expect(await clearFakeProviderIds()).toEqual({
      apply: false, found: 3, cleared: 0, byValue: { 'consultation-medical': 2, 'admin-draft': 1 },
    });
    expect(await snapshot()).toEqual(before);

    // Écriture
    expect(await clearFakeProviderIds({ apply: true })).toMatchObject({ apply: true, found: 3, cleared: 3 });
    const after = await snapshot();
    expect(after['service-1']).toMatchObject({ providerId: '', metadata: { a: 1, clearedProviderId: 'consultation-medical' } });
    expect(after['service-2']?.['providerId']).toBe('');
    expect(after['brouillon']).toMatchObject({ providerId: '', metadata: { clearedProviderId: 'admin-draft' } });
    for (const ref of ['reel', 'objectid', 'vide', 'absent']) expect(after[ref]).toEqual(before[ref]);

    // Idempotent
    expect(await clearFakeProviderIds({ apply: true })).toMatchObject({ found: 0, cleared: 0 });
  });
});
