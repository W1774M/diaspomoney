// @vitest-environment node
import * as Sentry from '@sentry/nextjs';
import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Faux ioredis : chaque commande est un vi.fn() réglable test par test.
const h = vi.hoisted(() => ({ instances: [] as any[] }));
vi.mock('ioredis', async () => {
  const { EventEmitter: EE } = await import('node:events');
  class FakeRedis extends EE {
    options: unknown;
    connect = vi.fn(async () => undefined);
    ping = vi.fn(async () => 'PONG');
    get = vi.fn(async () => null as string | null);
    set = vi.fn(async () => 'OK');
    setex = vi.fn(async () => 'OK');
    del = vi.fn(async () => 1);
    exists = vi.fn(async () => 1);
    expire = vi.fn(async () => 1);
    ttl = vi.fn(async () => 42);
    incr = vi.fn(async () => 7);
    quit = vi.fn(async () => 'OK');
    pipelineResult: unknown = [[null, 3], [null, 1]];
    pipelineCalls: string[] = [];
    pipeline = vi.fn(() => {
      const p = {
        incr: (k: string) => (this.pipelineCalls.push(`incr ${k}`), p),
        expire: (k: string, s: number) => (this.pipelineCalls.push(`expire ${k} ${s}`), p),
        exec: vi.fn(async () => {
          if (this.pipelineResult instanceof Error) throw this.pipelineResult;
          return this.pipelineResult;
        }),
      };
      return p;
    });
    constructor(options: unknown) {
      super();
      this.options = options;
      h.instances.push(this);
    }
  }
  return { default: FakeRedis };
});

import { getRedisClient, redis, RedisClient } from '@/lib/redis/redis-client';

const boom = () => Promise.reject(new Error('redis HS'));
let client: RedisClient;
let raw: any;

beforeEach(() => {
  vi.clearAllMocks();
  client = new RedisClient({ host: 'h', port: 1234 });
  raw = client.getClient();
});

describe('RedisClient : construction et connexion', () => {
  it('applique les valeurs par défaut', () => {
    expect(raw.options).toEqual({
      host: 'h', port: 1234, password: '', db: 0, maxRetriesPerRequest: 3, lazyConnect: true, keepAlive: 30000, family: 4, enableReadyCheck: true,
    });
    const custom = new RedisClient({ host: 'x', port: 1, password: 'p', db: 2, maxRetriesPerRequest: 1, lazyConnect: false, keepAlive: 5, family: 6 });
    expect(custom.getClient()).toMatchObject({ options: { password: 'p', db: 2, maxRetriesPerRequest: 1, lazyConnect: false, keepAlive: 5, family: 6 } });
  });

  it('remonte les erreurs de connexion à Sentry', () => {
    (raw as EventEmitter).emit('error', new Error('ECONNREFUSED'));
    (raw as EventEmitter).emit('connect');
    (raw as EventEmitter).emit('close');
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), { tags: { component: 'RedisClient', event: 'error' } });
  });

  it('connecte, teste et ferme la connexion', async () => {
    await client.connect();
    expect(raw.connect).toHaveBeenCalled();
    raw.connect.mockImplementationOnce(boom);
    await expect(client.connect()).rejects.toThrow('redis HS');

    expect(await client.ping()).toBe(true);
    raw.ping.mockResolvedValueOnce('NOPE');
    expect(await client.ping()).toBe(false);
    raw.ping.mockImplementationOnce(boom);
    expect(await client.ping()).toBe(false);

    await client.disconnect();
    raw.quit.mockImplementationOnce(boom);
    await expect(client.disconnect()).resolves.toBeUndefined();
    expect(raw.quit).toHaveBeenCalledTimes(2);
  });

  it('partage une instance unique', () => {
    expect(getRedisClient()).toBe(getRedisClient());
    expect(redis).toBe(getRedisClient());
  });
});

describe('RedisClient : commandes', () => {
  it('lit, écrit (avec ou sans TTL) et supprime', async () => {
    raw.get.mockResolvedValueOnce('v');
    expect(await client.get('k')).toBe('v');
    expect(await client.set('k', 'v')).toBe(true);
    expect(raw.set).toHaveBeenCalledWith('k', 'v');
    expect(await client.set('k', 'v', 60)).toBe(true);
    expect(raw.setex).toHaveBeenCalledWith('k', 60, 'v');
    expect(await client.del('k')).toBe(true);
    raw.del.mockResolvedValueOnce(0);
    expect(await client.del('absente')).toBe(false);
  });

  it('existence, expiration, TTL et compteur', async () => {
    expect(await client.exists('k')).toBe(true);
    raw.exists.mockResolvedValueOnce(0);
    expect(await client.exists('k')).toBe(false);
    expect(await client.expire('k', 10)).toBe(true);
    raw.expire.mockResolvedValueOnce(0);
    expect(await client.expire('k', 10)).toBe(false);
    expect(await client.ttl('k')).toBe(42);
    expect(await client.incr('k')).toBe(7);
  });

  it('incrémente et fixe l’expiration dans un même pipeline', async () => {
    expect(await client.incrWithExpiry('k', 30)).toBe(3);
    expect(raw.pipelineCalls).toEqual(['incr k', 'expire k 30']);
    raw.pipelineResult = [[new Error('WRONGTYPE'), null]];
    expect(await client.incrWithExpiry('k', 30)).toBe(0);
    raw.pipelineResult = null;
    expect(await client.incrWithExpiry('k', 30)).toBe(0);
  });

  it.each([
    ['get', () => client.get('k'), null],
    ['set', () => client.set('k', 'v'), false],
    ['del', () => client.del('k'), false],
    ['exists', () => client.exists('k'), false],
    ['expire', () => client.expire('k', 1), false],
    ['ttl', () => client.ttl('k'), -1],
    ['incr', () => client.incr('k'), 0],
  ] as const)('%s : renvoie une valeur neutre si Redis est en panne', async (cmd, run, neutral) => {
    raw[cmd === 'set' ? 'set' : cmd].mockImplementationOnce(boom);
    expect(await run()).toBe(neutral);
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ tags: { component: 'RedisClient', action: cmd } }));
  });

  it('incrWithExpiry : 0 si le pipeline échoue', async () => {
    raw.pipelineResult = new Error('redis HS');
    expect(await client.incrWithExpiry('k', 1)).toBe(0);
  });
});

describe('RedisClient : fonctions de haut niveau', () => {
  it('limite le débit sur une fenêtre', async () => {
    vi.useFakeTimers({ now: 1_000_000, toFake: ['Date'] });
    raw.pipelineResult = [[null, 2], [null, 1]];
    expect(await client.rateLimit('rl', 3, 60)).toEqual({ allowed: true, remaining: 1, resetTime: 1_060_000 });
    raw.pipelineResult = [[null, 4], [null, 1]];
    expect(await client.rateLimit('rl', 3, 60)).toEqual({ allowed: false, remaining: 0, resetTime: 1_060_000 });
    vi.useRealTimers();
  });

  it('rateLimit laisse passer quand Redis est en panne (le compteur vaut 0)', async () => {
    // Comportement actuel, « fail-open » : incrWithExpiry absorbe l'erreur et renvoie 0.
    raw.pipelineResult = new Error('redis HS');
    expect(await client.rateLimit('rl', 3, 60)).toMatchObject({ allowed: true, remaining: 3 });
  });

  it('met en cache le résultat d’une fonction, et la rappelle sans cache si Redis échoue', async () => {
    const fetcher = vi.fn(async () => ({ n: 1 }));
    expect(await client.cache('c', fetcher, 120)).toEqual({ n: 1 });
    expect(raw.setex).toHaveBeenCalledWith('c', 120, '{"n":1}');

    raw.get.mockResolvedValueOnce('{"n":2}');
    expect(await client.cache('c', fetcher)).toEqual({ n: 2 });
    expect(fetcher).toHaveBeenCalledTimes(1);

    raw.get.mockResolvedValueOnce('pas du json');
    expect(await client.cache('c', fetcher)).toEqual({ n: 1 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ tags: { component: 'RedisClient', action: 'cache' } }));
  });

  it('gère les sessions', async () => {
    expect(await client.setSession('s1', { u: 1 })).toBe(true);
    expect(raw.setex).toHaveBeenCalledWith('session:s1', 86400, '{"u":1}');
    raw.get.mockResolvedValueOnce('{"u":1}');
    expect(await client.getSession('s1')).toEqual({ u: 1 });
    expect(await client.getSession('absente')).toBeNull();
    raw.get.mockResolvedValueOnce('{cassé');
    expect(await client.getSession('s1')).toBeNull();
    expect(await client.deleteSession('s1')).toBe(true);
    expect(raw.del).toHaveBeenCalledWith('session:s1');
  });

  it('met des jetons sur liste noire', async () => {
    expect(await client.blacklistToken('eyJhbGciOiJIUzI1NiJ9.x.y', 900)).toBe(true);
    expect(raw.setex).toHaveBeenCalledWith('blacklist:eyJhbGciOiJIUzI1NiJ9.x.y', 900, '1');
    expect(await client.isTokenBlacklisted('eyJhbGciOiJIUzI1NiJ9.x.y')).toBe(true);
    expect(raw.exists).toHaveBeenCalledWith('blacklist:eyJhbGciOiJIUzI1NiJ9.x.y');
  });

  it('absorbe les erreurs inattendues des fonctions de session et de liste noire', async () => {
    const spySet = vi.spyOn(client, 'set').mockRejectedValue(new Error('bug'));
    const spyDel = vi.spyOn(client, 'del').mockRejectedValue(new Error('bug'));
    const spyExists = vi.spyOn(client, 'exists').mockRejectedValue(new Error('bug'));
    const spyIncr = vi.spyOn(client, 'incrWithExpiry').mockRejectedValue(new Error('bug'));
    expect(await client.setSession('s', {})).toBe(false);
    expect(await client.deleteSession('s')).toBe(false);
    expect(await client.blacklistToken('token-long-1234', 1)).toBe(false);
    expect(await client.isTokenBlacklisted('token-long-1234')).toBe(false);
    expect(await client.rateLimit('rl', 1, 1)).toMatchObject({ allowed: false, remaining: 0 });
    for (const s of [spySet, spyDel, spyExists, spyIncr]) s.mockRestore();
  });
});
