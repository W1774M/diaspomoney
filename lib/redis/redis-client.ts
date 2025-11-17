/**
 * Redis Client - DiaspoMoney
 * Client Redis pour cache, sessions et rate limiting
 * Implémente les design patterns :
 * - Singleton Pattern (via getRedisClient)
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 */

import { childLogger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import Redis, { RedisOptions } from 'ioredis';

const log = childLogger({ component: 'RedisClient' });

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
  keepAlive?: number;
  family?: number;
}

export class RedisClient {
  private client: Redis;
  // private _isConnected: boolean = false;

  constructor(config: RedisConfig) {
    // ioredis only accepts actual RedisOptions – see https://github.com/luin/ioredis/blob/master/API.md
    // Remove unsupported options and duplicates, and handle events separately.
    const options: RedisOptions = {
      host: config.host,
      port: config.port,
      password: config.password ?? '',
      db: config.db ?? 0,
      maxRetriesPerRequest: config.maxRetriesPerRequest ?? 3,
      lazyConnect: config.lazyConnect ?? true,
      keepAlive: config.keepAlive ?? 30000,
      family: config.family ?? 4,
      enableReadyCheck: true,
    };

    this.client = new Redis(options);

    // Hook up events
    this.client.on('error', (error: unknown) => {
      log.error({ error }, 'Redis error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', event: 'error' },
      });
    });

    this.client.on('connect', () => {
      log.info('Redis connected');
    });

    this.client.on('close', () => {
      log.warn('Redis disconnected');
    });
  }

  /**
   * Se connecter à Redis
   */
  async connect(): Promise<void> {
    try {
      // ioredis automatically connects unless lazyConnect is true
      await this.client.connect?.();
      log.info('Redis connection established');
    } catch (error) {
      log.error({ error }, 'Redis connection failed');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'connect' },
      });
      throw error;
    }
  }

  /**
   * Vérifier la connexion
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      const isAlive = result === 'PONG';
      log.debug({ isAlive }, 'Redis ping');
      return isAlive;
    } catch (error) {
      log.error({ error }, 'Redis ping failed');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'ping' },
      });
      return false;
    }
  }

  /**
   * Obtenir une valeur
   */
  async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      log.debug({ key, hasValue: !!value }, 'Redis get');
      return value;
    } catch (error) {
      log.error({ error, key }, 'Redis get error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'get' },
        extra: { key },
      });
      return null;
    }
  }

  /**
   * Définir une valeur
   */
  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl !== undefined && ttl !== null) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      log.debug({ key, ttl }, 'Redis set');
      return true;
    } catch (error) {
      log.error({ error, key, ttl }, 'Redis set error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'set' },
        extra: { key },
      });
      return false;
    }
  }

  /**
   * Supprimer une clé
   */
  async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      const deleted = result > 0;
      log.debug({ key, deleted }, 'Redis del');
      return deleted;
    } catch (error) {
      log.error({ error, key }, 'Redis del error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'del' },
        extra: { key },
      });
      return false;
    }
  }

  /**
   * Vérifier l'existence d'une clé
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      const exists = result === 1;
      log.debug({ key, exists }, 'Redis exists');
      return exists;
    } catch (error) {
      log.error({ error, key }, 'Redis exists error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'exists' },
        extra: { key },
      });
      return false;
    }
  }

  /**
   * Définir un TTL
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      const set = result === 1;
      log.debug({ key, seconds, set }, 'Redis expire');
      return set;
    } catch (error) {
      log.error({ error, key, seconds }, 'Redis expire error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'expire' },
        extra: { key, seconds },
      });
      return false;
    }
  }

  /**
   * Obtenir le TTL restant
   */
  async ttl(key: string): Promise<number> {
    try {
      const ttl = await this.client.ttl(key);
      log.debug({ key, ttl }, 'Redis ttl');
      return ttl;
    } catch (error) {
      log.error({ error, key }, 'Redis ttl error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'ttl' },
        extra: { key },
      });
      return -1;
    }
  }

  /**
   * Incrémenter une valeur
   */
  async incr(key: string): Promise<number> {
    try {
      const value = await this.client.incr(key);
      log.debug({ key, value }, 'Redis incr');
      return value;
    } catch (error) {
      log.error({ error, key }, 'Redis incr error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'incr' },
        extra: { key },
      });
      return 0;
    }
  }

  /**
   * Incrémenter avec expiration
   */
  async incrWithExpiry(key: string, ttl: number): Promise<number> {
    try {
      // Atomically increment and set expiry using pipeline
      const pipeline = this.client.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, ttl);
      const results = await pipeline.exec();
      // The first command in the pipeline is incr
      const value =
        typeof results?.[0]?.[1] === 'number' ? (results[0][1] as number) : 0;
      log.debug({ key, value, ttl }, 'Redis incrWithExpiry');
      return value;
    } catch (error) {
      log.error({ error, key, ttl }, 'Redis incrWithExpiry error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'incrWithExpiry' },
        extra: { key, ttl },
      });
      return 0;
    }
  }

  /**
   * Rate limiting
   */
  async rateLimit(
    key: string,
    limit: number,
    window: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const current = await this.incrWithExpiry(key, window);
      const remaining = Math.max(0, limit - current);
      const resetTime = Date.now() + window * 1000;

      const result = {
        allowed: current <= limit,
        remaining,
        resetTime,
      };
      log.debug({ key, limit, window, ...result }, 'Redis rateLimit');
      return result;
    } catch (error) {
      log.error({ error, key, limit, window }, 'Redis rateLimit error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'rateLimit' },
        extra: { key, limit, window },
      });
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now(),
      };
    }
  }

  /**
   * Cache avec TTL
   */
  async cache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    try {
      // Essayer de récupérer du cache
      const cached = await this.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      // Exécuter la fonction et mettre en cache
      const result = await fetcher();
      await this.set(key, JSON.stringify(result), ttl);
      log.debug({ key, ttl }, 'Redis cache set');
      return result;
    } catch (error) {
      log.error({ error, key }, 'Redis cache error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'cache' },
        extra: { key },
      });
      // En cas d'erreur, exécuter la fonction sans cache
      return await fetcher();
    }
  }

  /**
   * Session management
   */
  async setSession(
    sessionId: string,
    data: any,
    ttl: number = 86400
  ): Promise<boolean> {
    try {
      const key = `session:${sessionId}`;
      const result = await this.set(key, JSON.stringify(data), ttl);
      log.debug({ sessionId, ttl }, 'Redis setSession');
      return result;
    } catch (error) {
      log.error({ error, sessionId }, 'Redis setSession error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'setSession' },
        extra: { sessionId },
      });
      return false;
    }
  }

  async getSession(sessionId: string): Promise<any | null> {
    try {
      const key = `session:${sessionId}`;
      const data = await this.get(key);
      const session = data ? JSON.parse(data) : null;
      log.debug({ sessionId, hasSession: !!session }, 'Redis getSession');
      return session;
    } catch (error) {
      log.error({ error, sessionId }, 'Redis getSession error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'getSession' },
        extra: { sessionId },
      });
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const key = `session:${sessionId}`;
      const result = await this.del(key);
      log.debug({ sessionId, deleted: result }, 'Redis deleteSession');
      return result;
    } catch (error) {
      log.error({ error, sessionId }, 'Redis deleteSession error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'deleteSession' },
        extra: { sessionId },
      });
      return false;
    }
  }

  /**
   * Blacklist de tokens JWT
   */
  async blacklistToken(token: string, expiresIn: number): Promise<boolean> {
    try {
      const key = `blacklist:${token}`;
      const result = await this.set(key, '1', expiresIn);
      log.debug(
        { token: token.slice(0, 10) + '...', expiresIn },
        'Redis blacklistToken'
      );
      return result;
    } catch (error) {
      log.error(
        { error, token: token.slice(0, 10) + '...' },
        'Redis blacklistToken error'
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'blacklistToken' },
      });
      return false;
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const key = `blacklist:${token}`;
      const isBlacklisted = await this.exists(key);
      log.debug(
        { token: token.slice(0, 10) + '...', isBlacklisted },
        'Redis isTokenBlacklisted'
      );
      return isBlacklisted;
    } catch (error) {
      log.error(
        { error, token: token.slice(0, 10) + '...' },
        'Redis isTokenBlacklisted error'
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'isTokenBlacklisted' },
      });
      return false;
    }
  }

  /**
   * Fermer la connexion
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      log.info('Redis disconnected');
    } catch (error) {
      log.error({ error }, 'Redis disconnect error');
      Sentry.captureException(error as Error, {
        tags: { component: 'RedisClient', action: 'disconnect' },
      });
    }
  }

  /**
   * Obtenir le client Redis
   */
  getClient(): Redis {
    return this.client;
  }
}

// Configuration Redis
const redisConfig: RedisConfig = {
  host: process.env['REDIS_HOST'] || 'localhost',
  port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
  password: process.env['REDIS_PASSWORD'] || '',
  db: parseInt(process.env['REDIS_DB'] || '0', 10),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
};

// Instance singleton
let redisInstance: RedisClient | null = null;

export const getRedisClient = (): RedisClient => {
  if (!redisInstance) {
    redisInstance = new RedisClient(redisConfig);
  }
  return redisInstance;
};

// Export de l'instance par défaut
export const redis = getRedisClient();
