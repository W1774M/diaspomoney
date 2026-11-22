import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PRESENCE_COUNTRIES,
  flagUrl,
  inCountryLabel,
  PresenceCountryCreateSchema,
  PresenceCountryUpdateSchema,
  presenceBadgeLabel,
  type PresenceCountry,
} from '../../lib/presence-countries';

const cameroun: PresenceCountry = {
  id: '1',
  iso: 'CM',
  name: 'Cameroun',
  preposition: 'au',
  status: 'present',
  order: 1,
};

describe('presence-countries', () => {
  it('construit les libellés des badges', () => {
    expect(inCountryLabel(cameroun)).toBe('au Cameroun');
    expect(presenceBadgeLabel(cameroun)).toBe('Présent au Cameroun');
    expect(
      presenceBadgeLabel({ ...cameroun, name: 'Côte d’Ivoire', preposition: 'en', status: 'coming_soon' }),
    ).toBe('Bientôt en Côte d’Ivoire');
  });

  it('construit l’URL du drapeau en majuscules', () => {
    expect(flagUrl('cm')).toBe('/api/flags/CM');
  });

  it('reprend la liste historique par défaut', () => {
    expect(DEFAULT_PRESENCE_COUNTRIES.map((c) => c.iso)).toEqual(['CM', 'CG', 'CI', 'SN', 'CD', 'RW']);
    expect(DEFAULT_PRESENCE_COUNTRIES.filter((c) => c.status === 'present').map((c) => c.iso)).toEqual([
      'CM',
      'CG',
    ]);
  });

  it('valide et normalise un nouveau pays', () => {
    const parsed = PresenceCountryCreateSchema.parse({
      iso: ' sn ',
      name: 'Sénégal',
      preposition: 'au',
      status: 'coming_soon',
    });
    expect(parsed.iso).toBe('SN');
  });

  it('refuse un code ISO invalide ou un statut inconnu', () => {
    expect(
      PresenceCountryCreateSchema.safeParse({ iso: 'CMR', name: 'Cameroun', preposition: 'au', status: 'present' })
        .success,
    ).toBe(false);
    expect(PresenceCountryUpdateSchema.safeParse({ status: 'ouvert' }).success).toBe(false);
    expect(PresenceCountryUpdateSchema.safeParse({ status: 'present' }).success).toBe(true);
  });
});
