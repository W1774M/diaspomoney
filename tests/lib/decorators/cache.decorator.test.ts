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

describe('@Cacheable : jamais de secret dans le cache', () => {
  class Utilisateurs {
    @Cacheable(60, { prefix: 'Utilisateurs:trouver' })
    async trouver(id: string) {
      return { id, email: 'a@test.fr', password: '$2b$12$hash', profil: { nom: 'Awa' } };
    }
    @Cacheable(60, { prefix: 'Utilisateurs:liste' })
    async liste() {
      return [{ id: 'u1', securite: { twoFactorSecret: 'JBSWY3DP' } }];
    }
    @Cacheable(60, { prefix: 'Utilisateurs:profil' })
    async profil(id: string) {
      return { id, email: 'a@test.fr', password: undefined, refreshToken: '' };
    }
  }

  it('renvoie le résultat sans le stocker s’il contient un secret, même imbriqué', async () => {
    const u = new Utilisateurs();
    expect(await u.trouver('u1')).toMatchObject({ password: '$2b$12$hash' });
    expect(await u.liste()).toHaveLength(1);
    expect(h.set).not.toHaveBeenCalled();
  });

  it('met en cache un résultat dont les champs secrets sont vides', async () => {
    await new Utilisateurs().profil('u1');
    expect(h.set).toHaveBeenCalledWith('Utilisateurs:profil:["u1"]', expect.objectContaining({ id: 'u1' }), 60);
  });
});

describe('containsSecret', () => {
  it('détecte les champs secrets connus, bornés en profondeur', async () => {
    const { containsSecret } = await import('@/lib/decorators/cache.decorator');
    expect(containsSecret({ twoFactorBackupCodes: ['a'] })).toBe(true);
    expect(containsSecret([[{ passwordResetToken: 't' }]])).toBe(true);
    expect(containsSecret({ email: 'a', nested: { ok: 1 } })).toBe(false);
    expect(containsSecret(null)).toBe(false);
    expect(containsSecret('password')).toBe(false);
    let deep: Record<string, unknown> = { password: 'x' };
    for (let i = 0; i < 8; i++) deep = { n: deep };
    expect(containsSecret(deep)).toBe(false);
  });
});
