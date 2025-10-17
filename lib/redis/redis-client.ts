/**
 * Redis Client - DiaspoMoney
 * Client Redis pour cache, sessions et rate limiting
 */

import * as Sentry from '@sentry/nextjs';
import Redis, { RedisOptions } from 'ioredis';

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
      console.error('❌ Redis Error:', error);
      Sentry.captureException(error);
    });

    this.client.on('connect', () => {
      console.log('✅ Redis Connected');
    });

    this.client.on('close', () => {
      console.log('⚠️ Redis Disconnected');
    });
  }

  /**
   * Se connecter à Redis
   */
  async connect(): Promise<void> {
    try {
      // ioredis automatically connects unless lazyConnect is true
      await this.client.connect?.();
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Vérifier la connexion
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('❌ Redis ping failed:', error);
      Sentry.captureException(error);
      return false;
    }
  }

  /**
   * Obtenir une valeur
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('❌ Redis get error:', error);
      Sentry.captureException(error);
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
      return true;
    } catch (error) {
      console.error('❌ Redis set error:', error);
      Sentry.captureException(error);
      return false;
    }
  }

  /**
   * Supprimer une clé
   */
  async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error('❌ Redis del error:', error);
      Sentry.captureException(error);
      return false;
    }
  }

  /**
   * Vérifier l'existence d'une clé
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('❌ Redis exists error:', error);
      Sentry.captureException(error);
      return false;
    }
  }

  /**
   * Définir un TTL
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error('❌ Redis expire error:', error);
      Sentry.captureException(error);
      return false;
    }
  }

  /**
   * Obtenir le TTL restant
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('❌ Redis ttl error:', error);
      Sentry.captureException(error);
      return -1;
    }
  }

  /**
   * Incrémenter une valeur
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error('❌ Redis incr error:', error);
      Sentry.captureException(error);
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
      return typeof results?.[0]?.[1] === 'number'
        ? (results[0][1] as number)
        : 0;
    } catch (error) {
      console.error('❌ Redis incrWithExpiry error:', error);
      Sentry.captureException(error);
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

      return {
        allowed: current <= limit,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error('❌ Redis rateLimit error:', error);
      Sentry.captureException(error);
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
      return result;
    } catch (error) {
      console.error('❌ Redis cache error:', error);
      Sentry.captureException(error);
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
      return await this.set(key, JSON.stringify(data), ttl);
    } catch (error) {
      console.error('❌ Redis setSession error:', error);
      Sentry.captureException(error);
      return false;
    }
  }

  async getSession(sessionId: string): Promise<any | null> {
    try {
      const key = `session:${sessionId}`;
      const data = await this.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Redis getSession error:', error);
      Sentry.captureException(error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const key = `session:${sessionId}`;
      return await this.del(key);
    } catch (error) {
      console.error('❌ Redis deleteSession error:', error);
      Sentry.captureException(error);
      return false;
    }
  }

  /**
   * Blacklist de tokens JWT
   */
  async blacklistToken(token: string, expiresIn: number): Promise<boolean> {
    try {
      const key = `blacklist:${token}`;
      return await this.set(key, '1', expiresIn);
    } catch (error) {
      console.error('❌ Redis blacklistToken error:', error);
      Sentry.captureException(error);
      return false;
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const key = `blacklist:${token}`;
      return await this.exists(key);
    } catch (error) {
      console.error('❌ Redis isTokenBlacklisted error:', error);
      Sentry.captureException(error);
      return false;
    }
  }

  /**
   * Fermer la connexion
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      console.log('✅ Redis disconnected');
    } catch (error) {
      console.error('❌ Redis disconnect error:', error);
      Sentry.captureException(error);
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
