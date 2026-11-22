// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  store: new Map<string, unknown>(),
  get: vi.fn(),
  set: vi.fn(),
  invalidateAppCache: vi.fn(async () => undefined),
}));
vi.mock('@/lib/cache/redis', () => ({
  cache: { get: h.get, set: h.set, clear: vi.fn() },
  invalidateAppCache: h.invalidateAppCache,
}));

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';

class Depot {
  lectures = 0;
  @Cacheable(120, { prefix: 'Depot:trouver' })
  async trouver(id: string) {
    this.lectures++;
    return { id, lu: this.lectures };
  }
  @InvalidateCache('Depot:*')
  async modifier(id: string) {
    return { id, modifie: true };
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  h.store.clear();
  h.get.mockImplementation(async (k: string) => h.store.get(k) ?? null);
  h.set.mockImplementation(async (k: string, v: unknown) => void h.store.set(k, v));
});

describe('@Cacheable', () => {
  it('met le résultat en cache sous « préfixe:arguments » et le resert', async () => {
    const d = new Depot();
    expect(await d.trouver('u1')).toEqual({ id: 'u1', lu: 1 });
    expect(h.set).toHaveBeenCalledWith('Depot:trouver:["u1"]', { id: 'u1', lu: 1 }, 120);
    expect(await d.trouver('u1')).toEqual({ id: 'u1', lu: 1 });
    expect(d.lectures).toBe(1);
    expect(await d.trouver('u2')).toEqual({ id: 'u2', lu: 2 });
  });

  it('appelle la méthode si le cache est indisponible ou en erreur', async () => {
    const d = new Depot();
    h.get.mockRejectedValue(new Error('redis HS'));
    h.set.mockRejectedValue(new Error('redis HS'));
    expect(await d.trouver('u1')).toEqual({ id: 'u1', lu: 1 });
    expect(await d.trouver('u1')).toMatchObject({ id: 'u1' });
  });
});

describe('@InvalidateCache', () => {
  it('invalide le cache après l’écriture, en transmettant le motif comme domaine', async () => {
    const d = new Depot();
    expect(await d.modifier('u1')).toEqual({ id: 'u1', modifie: true });
    expect(h.invalidateAppCache).toHaveBeenCalledWith('Depot:*');
  });

  it('ne fait pas échouer l’écriture si l’invalidation échoue', async () => {
    h.invalidateAppCache.mockRejectedValueOnce(new Error('redis HS'));
    await expect(new Depot().modifier('u1')).resolves.toEqual({ id: 'u1', modifie: true });
  });

  it('n’invalide rien si l’écriture échoue', async () => {
    class Echec {
      @InvalidateCache('Echec:*')
      async modifier(): Promise<void> {
        throw new Error('mongo HS');
      }
    }
    await expect(new Echec().modifier()).rejects.toThrow('mongo HS');
    expect(h.invalidateAppCache).not.toHaveBeenCalled();
  });
});
