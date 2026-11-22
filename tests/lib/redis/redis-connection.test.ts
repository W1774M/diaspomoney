import { describe, expect, it } from 'vitest';

import { redisConnectionFromEnv } from '@/lib/redis/redis-connection';

describe('redisConnectionFromEnv', () => {
  it('prend la base de REDIS_URL : chaque environnement a la sienne', () => {
    for (const [db, url] of [[0, 'redis://:s3cret@redis:6379/0'], [1, 'redis://:s3cret@redis:6379/1'], [2, 'redis://:s3cret@redis:6379/2']] as const) {
      expect(redisConnectionFromEnv({ REDIS_URL: url, REDIS_HOST: 'ignoré', REDIS_DB: '9' })).toEqual({ host: 'redis', port: 6379, password: 's3cret', db });
    }
  });

  it('décode le mot de passe et complète avec les variables séparées', () => {
    expect(redisConnectionFromEnv({ REDIS_URL: 'rediss://:p%40ss%2Fw@cache.test:6380', REDIS_DB: '3' })).toEqual({
      host: 'cache.test', port: 6380, password: 'p@ss/w', db: 3,
    });
    expect(redisConnectionFromEnv({ REDIS_URL: 'redis://redis', REDIS_PASSWORD: 'env' })).toEqual({ host: 'redis', port: 6379, password: 'env', db: 0 });
  });

  it('se replie sur REDIS_HOST / PORT / PASSWORD / DB sans URL exploitable', () => {
    const env = { REDIS_HOST: 'h', REDIS_PORT: '7000', REDIS_PASSWORD: 'p', REDIS_DB: '4' };
    const expected = { host: 'h', port: 7000, password: 'p', db: 4 };
    expect(redisConnectionFromEnv(env)).toEqual(expected);
    expect(redisConnectionFromEnv({ ...env, REDIS_URL: 'pas une url' })).toEqual(expected);
    expect(redisConnectionFromEnv({ ...env, REDIS_URL: 'http://h:1/2' })).toEqual(expected);
  });

  it('a des valeurs par défaut sûres', () => {
    expect(redisConnectionFromEnv({})).toEqual({ host: 'localhost', port: 6379, password: '', db: 0 });
    expect(redisConnectionFromEnv({ REDIS_PORT: 'abc', REDIS_DB: '-1' })).toEqual({ host: 'localhost', port: 6379, password: '', db: 0 });
    expect(typeof redisConnectionFromEnv().port).toBe('number');
  });
});
