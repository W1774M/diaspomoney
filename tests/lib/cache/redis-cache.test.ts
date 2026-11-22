// @vitest-environment node
import * as Sentry from '@sentry/nextjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Faux ioredis : `status` et les événements pilotent la disponibilité du cache.
const h = vi.hoisted(() => ({ instance: null as any }));
vi.mock('ioredis', async () => {
  const { EventEmitter } = await import('node:events');
  class FakeRedis extends EventEmitter {
    status = 'wait';
    options: any;
    connect = vi.fn(async () => undefined);
    get = vi.fn(async () => null as string | null);
    setex = vi.fn(async () => 'OK');
    del = vi.fn(async () => 1);
    keys = vi.fn(async () => [] as string[]);
    constructor(options: any) {
      super();
      this.options = options;
      h.instance = this;
    }
  }
  return { default: FakeRedis };
});

type CacheModule = typeof import('@/lib/cache/redis');
let mod: CacheModule;
let raw: any;

async function load() {
  vi.resetModules();
  mod = await import('@/lib/cache/redis');
  raw = h.instance;
}
/** Cache activé (hors test et hors build) et connexion prête. */
function enable() {
  vi.stubEnv('CACHE_REDIS_ENABLED', 'true');
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PHASE', '');
}
function connect() {
  raw.emit('connect');
  raw.status = 'ready';
  raw.emit('ready');
}
const err = (code?: string) => Object.assign(new Error(code ?? 'boom'), code ? { code } : {});

beforeEach(async () => {
  vi.clearAllMocks();
  await load();
});
afterEach(() => vi.unstubAllEnvs());

describe('cache Redis : activation', () => {
  it('configure ioredis sans file d’attente hors ligne, avec reprise progressive', () => {
    expect(raw.options).toMatchObject({ lazyConnect: true, enableOfflineQueue: false, maxRetriesPerRequest: 3, connectTimeout: 10000 });
    expect(raw.options.retryStrategy(1)).toBe(50);
    expect(raw.options.retryStrategy(100)).toBe(2000);
  });

  it('est désactivé par défaut, en test et pendant le build : aucune connexion, aucune commande', async () => {
    const tries = [
      {},
      { CACHE_REDIS_ENABLED: 'true' }, // NODE_ENV=test
      { CACHE_REDIS_ENABLED: 'true', NODE_ENV: 'production', NEXT_PHASE: 'phase-production-build' },
      { CACHE_REDIS_ENABLED: '1', NODE_ENV: 'production' },
    ];
    for (const env of tries) {
      vi.unstubAllEnvs();
      for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
      expect(mod.isCacheEnabled()).toBe(false);
      raw.status = 'ready';
      raw.emit('ready');
      expect(mod.isRedisConnected()).toBe(false);
      expect(await mod.cache.get('k')).toBeNull();
      await mod.cache.set('k', 1);
      await mod.cache.clear();
      await mod.invalidateAppCache();
    }
    expect(raw.connect).not.toHaveBeenCalled();
    expect(raw.get).not.toHaveBeenCalled();
    expect(raw.setex).not.toHaveBeenCalled();
    expect(raw.keys).not.toHaveBeenCalled();
  });

  it('activé, ouvre la connexion au premier usage puis sert le cache une fois prêt', async () => {
    enable();
    expect(mod.isCacheEnabled()).toBe(true);
    expect(await mod.cache.get('k')).toBeNull(); // premier appel : connexion lancée, pas attendue
    expect(raw.connect).toHaveBeenCalledTimes(1);
    expect(raw.get).not.toHaveBeenCalled();

    raw.status = 'connecting';
    expect(mod.isRedisConnected()).toBe(false);
    connect();
    expect(mod.isRedisConnected()).toBe(true);
    raw.get.mockResolvedValueOnce('{"a":1}');
    expect(await mod.cache.get('k')).toEqual({ a: 1 });
    expect(raw.connect).toHaveBeenCalledTimes(1);
  });

  it('survit à un échec de connexion', async () => {
    enable();
    raw.connect.mockRejectedValueOnce(err('ECONNREFUSED'));
    expect(await mod.cache.get('k')).toBeNull();
    await Promise.resolve();
  });

  it('suit les événements de connexion', () => {
    enable();
    connect();
    expect(mod.isRedisConnected()).toBe(true);
    raw.emit('reconnecting', 100);
    raw.emit('close');
    expect(mod.isRedisConnected()).toBe(false);
    connect();
    raw.emit('error', err('ECONNRESET'));
    expect(mod.isRedisConnected()).toBe(false);
  });

  it('limite les remontées Sentry des erreurs de connexion répétées', () => {
    vi.useFakeTimers({ now: 0, toFake: ['Date'] });
    for (let i = 0; i < 8; i++) raw.emit('error', err('ECONNREFUSED'));
    // ECONNREFUSED : seulement les 3 premières ; au-delà de 5, plus aucun log.
    expect(Sentry.captureException).toHaveBeenCalledTimes(3);
    expect(vi.mocked(Sentry.captureException).mock.calls[0]![1]).toMatchObject({ level: 'error', tags: { code: 'ECONNREFUSED' } });
    expect(vi.mocked(Sentry.captureException).mock.calls[1]![1]).toMatchObject({ level: 'warning' });

    vi.setSystemTime(61_000); // plus d'une minute après : on reprend
    raw.emit('error', err('ECONNREFUSED'));
    expect(Sentry.captureException).toHaveBeenCalledTimes(4);

    raw.emit('error', err('NOAUTH')); // autre code : toujours remonté
    raw.emit('error', new Error('sans code'));
    expect(Sentry.captureException).toHaveBeenCalledTimes(6);
    expect(vi.mocked(Sentry.captureException).mock.calls[5]![1]).toMatchObject({ tags: { code: 'UNKNOWN' } });
    vi.useRealTimers();
  });
});

const namespaces = [
  ['users', 'cache:users:', 300],
  ['services', 'cache:services:', 3600],
  ['stats', 'cache:stats:', 1800],
  ['appointments', 'cache:appointments:', 900],
] as const;

describe.each(namespaces)('cache.%s', (name, prefix, defaultTtl) => {
  beforeEach(() => {
    enable();
    connect();
  });
  const ns = () => mod.cache[name];

  it('écrit (TTL par défaut ou donné), lit et supprime sous « cache: »', async () => {
    await ns().set('k', { a: 1 });
    expect(raw.setex).toHaveBeenCalledWith(`${prefix}k`, defaultTtl, '{"a":1}');
    await ns().set('k', 'x', 5);
    expect(raw.setex).toHaveBeenLastCalledWith(`${prefix}k`, 5, '"x"');

    raw.get.mockResolvedValueOnce('{"a":1}');
    expect(await ns().get('k')).toEqual({ a: 1 });
    expect(raw.get).toHaveBeenCalledWith(`${prefix}k`);
    expect(await ns().get('absente')).toBeNull();

    await ns().del('k');
    expect(raw.del).toHaveBeenCalledWith(`${prefix}k`);
  });

  it('ne plante jamais sur une erreur Redis', async () => {
    for (const code of ['ECONNREFUSED', 'ENOTFOUND', undefined]) {
      raw.setex.mockRejectedValueOnce(err(code));
      raw.get.mockRejectedValueOnce(err(code));
      raw.del.mockRejectedValueOnce(err(code));
      await expect(ns().set('k', 1)).resolves.toBeUndefined();
      await expect(ns().get('k')).resolves.toBeNull();
      await expect(ns().del('k')).resolves.toBeUndefined();
    }
  });

  it('ne fait rien tant que Redis est indisponible', async () => {
    raw.emit('close');
    expect(await ns().get('k')).toBeNull();
    await ns().set('k', 1);
    await ns().del('k');
    expect(raw.get).not.toHaveBeenCalled();
    expect(raw.setex).not.toHaveBeenCalled();
    expect(raw.del).not.toHaveBeenCalled();
  });
});

describe('cache générique', () => {
  beforeEach(() => {
    enable();
    connect();
  });

  it('écrit, lit et supprime sous « cache: », sans stocker undefined', async () => {
    await mod.cache.set('UserRepository:findById:["u1"]', [1]);
    expect(raw.setex).toHaveBeenCalledWith('cache:UserRepository:findById:["u1"]', 3600, '[1]');
    await mod.cache.set('k', undefined);
    expect(raw.setex).toHaveBeenCalledTimes(1);
    raw.get.mockResolvedValueOnce('[1]');
    expect(await mod.cache.get('k')).toEqual([1]);
    expect(await mod.cache.get('absente')).toBeNull();
    await mod.cache.del('k');
    expect(raw.del).toHaveBeenCalledWith('cache:k');
  });

  it('restaure les dates relues (et seulement les dates ISO complètes)', async () => {
    const original = { createdAt: new Date('2026-11-22T10:15:00.000Z'), jour: '2026-11-22', heure: '10:15', nested: [{ at: new Date('2026-01-01T00:00:00Z') }] };
    await mod.cache.set('k', original);
    raw.get.mockResolvedValueOnce(raw.setex.mock.calls[0]![2]);
    const relu = await mod.cache.get('k');
    expect(relu.createdAt).toBeInstanceOf(Date);
    expect(relu.createdAt.getTime()).toBe(original.createdAt.getTime());
    expect(relu.nested[0].at).toBeInstanceOf(Date);
    expect(relu.jour).toBe('2026-11-22');
    expect(relu.heure).toBe('10:15');
    expect(mod.reviveDates('', '2026-11-22T10:15:00Z')).toEqual(new Date('2026-11-22T10:15:00Z'));
    expect(mod.reviveDates('', 42)).toBe(42);
  });

  it('vide seulement les clés de cache correspondant au motif', async () => {
    await mod.cache.clear('rien:*');
    expect(raw.keys).toHaveBeenCalledWith('cache:rien:*');
    expect(raw.del).not.toHaveBeenCalled();
    raw.keys.mockResolvedValueOnce(['cache:a', 'cache:b']);
    await mod.cache.clear();
    expect(raw.keys).toHaveBeenLastCalledWith('cache:*');
    expect(raw.del).toHaveBeenCalledWith('cache:a', 'cache:b');
  });

  it('ne plante jamais sur une erreur Redis', async () => {
    for (const code of ['ECONNREFUSED', undefined]) {
      raw.setex.mockRejectedValueOnce(err(code));
      raw.get.mockRejectedValueOnce(err(code));
      raw.del.mockRejectedValueOnce(err(code));
      raw.keys.mockRejectedValueOnce(err(code));
      await expect(mod.cache.set('k', 1)).resolves.toBeUndefined();
      await expect(mod.cache.get('k')).resolves.toBeNull();
      await expect(mod.cache.del('k')).resolves.toBeUndefined();
      await expect(mod.cache.clear()).resolves.toBeUndefined();
    }
  });

  it('exporte le client ioredis', () => {
    expect(mod.default).toBe(raw);
  });
});

describe('invalidateAppCache', () => {
  beforeEach(() => {
    enable();
    connect();
  });
  const patterns = () => raw.keys.mock.calls.map(([p]: [string]) => p);

  it('vide tout le cache de l’environnement après une écriture ordinaire', async () => {
    for (const scope of [undefined, 'UserRepository:*', 'BookingService:*', 'speciality:*', 'GDPRConsentRepository']) {
      raw.keys.mockClear();
      await mod.invalidateAppCache(scope);
      expect(patterns()).toEqual(['cache:*']);
    }
  });

  it('ne vide que leur domaine pour les journaux d’audit et les notifications', async () => {
    await mod.invalidateAppCache('AuditLoggingSystem:*');
    expect(patterns()).toEqual(['cache:AuditLog*', 'cache:PCIAuditLog*']);
    raw.keys.mockClear();
    await mod.invalidateAppCache('PCIAuditLogRepository');
    expect(patterns()).toEqual(['cache:AuditLog*', 'cache:PCIAuditLog*']);
    raw.keys.mockClear();
    await mod.invalidateAppCache('NotificationRepository:*');
    expect(patterns()).toEqual(['cache:Notification*']);
  });
});
