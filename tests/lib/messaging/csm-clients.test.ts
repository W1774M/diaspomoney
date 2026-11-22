import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ distinct: vi.fn(), collection: vi.fn() }));

vi.mock('@/lib/database/mongodb', () => ({
  getMongoClient: vi.fn(async () => ({
    db: () => ({
      collection: (name: string) => {
        h.collection(name);
        return { distinct: h.distinct };
      },
    }),
  })),
}));

import { getCsmClientIds, withCsmClients } from '@/lib/messaging/csm-clients';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getCsmClientIds', () => {
  it('renvoie les demandeurs des commandes auprès des prestataires du portefeuille', async () => {
    h.distinct.mockResolvedValueOnce(['c1', { toString: () => 'c2' }, null]);
    expect(await getCsmClientIds(['p1', 'p2'])).toEqual(['c1', 'c2']);
    expect(h.collection).toHaveBeenCalledWith('bookings');
    expect(h.distinct).toHaveBeenCalledWith('requesterId', {
      providerId: { $in: ['p1', 'p2'] },
    });
  });

  it('ne fait aucune requête si le portefeuille est vide', async () => {
    expect(await getCsmClientIds([])).toEqual([]);
    expect(await getCsmClientIds(undefined)).toEqual([]);
    expect(h.distinct).not.toHaveBeenCalled();
  });
});

describe('withCsmClients', () => {
  it('laisse les non-CSM inchangés, sans requête', async () => {
    const party = { id: 'c1', roles: ['CUSTOMER'] };
    expect(await withCsmClients(party)).toBe(party);
    expect(h.distinct).not.toHaveBeenCalled();
  });

  it('ajoute csmClientIds à un CSM et met le résultat en cache', async () => {
    h.distinct.mockResolvedValue(['c1']);
    const cache = new Map<string, Promise<string[]>>();
    const csm = { id: 'csm1', roles: ['CSM'], csmPortfolioProviderIds: ['p1'] };

    expect(await withCsmClients(csm, cache)).toMatchObject({ csmClientIds: ['c1'] });
    expect(await withCsmClients(csm, cache)).toMatchObject({ csmClientIds: ['c1'] });
    expect(h.distinct).toHaveBeenCalledTimes(1);
  });
});
