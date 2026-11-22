// @vitest-environment node
import * as Sentry from '@sentry/nextjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Faux ioredis : `status` et les événements pilotent la disponibilité du cache.
const h = vi.hoisted(() => ({ instance: null as any }));
vi.mock('ioredis', async () => {
  const { EventEmitter } = await import('node:events');
  class FakeRedis extends EventEmitter {
    status = 'wait';
    options: any;
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

describe('cache Redis : disponibilité', () => {
  it('configure ioredis sans file d’attente hors ligne, avec reprise progressive', () => {
    expect(raw.options).toMatchObject({ lazyConnect: true, enableOfflineQueue: false, maxRetriesPerRequest: 3, connectTimeout: 10000 });
    expect(raw.options.retryStrategy(1)).toBe(50);
    expect(raw.options.retryStrategy(100)).toBe(2000);
  });

  it('n’envoie aucune commande tant que Redis n’est pas prêt', async () => {
    // Aucune connexion n'est ouverte explicitement : avec lazyConnect, le statut reste « wait ».
    expect(mod.isRedisConnected()).toBe(false);
    expect(await mod.cache.get('k')).toBeNull();
    await mod.cache.set('k', 1);
    await mod.cache.del('k');
    await mod.cache.clear();
    expect(await mod.cache.users.get('k')).toBeNull();
    await mod.cache.users.set('k', 1);
    await mod.cache.users.del('k');
    expect(raw.get).not.toHaveBeenCalled();
    expect(raw.setex).not.toHaveBeenCalled();
    expect(raw.keys).not.toHaveBeenCalled();
  });

  it('suit les événements de connexion', () => {
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
  ['users', 'users:', 300],
  ['services', 'services:', 3600],
  ['stats', 'stats:', 1800],
  ['appointments', 'appointments:', 900],
] as const;

describe.each(namespaces)('cache.%s', (name, prefix, defaultTtl) => {
  beforeEach(connect);
  const ns = () => mod.cache[name];

  it('écrit (TTL par défaut ou donné), lit et supprime avec le préfixe', async () => {
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
});

describe('cache générique', () => {
  beforeEach(connect);

  it('écrit, lit et supprime sans préfixe', async () => {
    await mod.cache.set('k', [1]);
    expect(raw.setex).toHaveBeenCalledWith('k', 3600, '[1]');
    raw.get.mockResolvedValueOnce('[1]');
    expect(await mod.cache.get('k')).toEqual([1]);
    expect(await mod.cache.get('absente')).toBeNull();
    await mod.cache.del('k');
    expect(raw.del).toHaveBeenCalledWith('k');
  });

  it('vide les clés correspondant à un motif', async () => {
    await mod.cache.clear('rien:*');
    expect(raw.del).not.toHaveBeenCalled();
    raw.keys.mockResolvedValueOnce(['a', 'b']);
    await mod.cache.clear();
    expect(raw.keys).toHaveBeenLastCalledWith('*');
    expect(raw.del).toHaveBeenCalledWith('a', 'b');
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

  it.each(['stats', 'services', 'appointments'] as const)('ne lit pas %s tant que Redis est indisponible', async (name) => {
    raw.emit('close');
    expect(await mod.cache[name].get('k')).toBeNull();
    await mod.cache[name].set('k', 1);
    await mod.cache[name].del('k');
    expect(raw.get).not.toHaveBeenCalled();
  });
});
