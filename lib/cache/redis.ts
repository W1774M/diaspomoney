/**
 * Redis Cache Helper
 * Implémente les design patterns :
 * - Singleton Pattern (instance Redis unique)
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 * - Cache Pattern
 */

import { childLogger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import Redis from 'ioredis';

const log = childLogger({ component: 'RedisCache' });

// État de connexion Redis
let isConnected = false;
let lastErrorTime = 0;
let errorCount = 0;
const ERROR_RATE_LIMIT_MS = 60000; // 1 minute entre les logs d'erreur
const MAX_ERRORS_BEFORE_SILENCE = 5; // Arrêter de logger après 5 erreurs

// Configuration Redis
const redis = new Redis({
  host: process.env['REDIS_HOST'] || 'localhost',
  port: parseInt(process.env['REDIS_PORT'] || '6379'),
  password: process.env['REDIS_PASSWORD'] ?? '',
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableOfflineQueue: false, // Ne pas mettre en queue les commandes si déconnecté
  connectTimeout: 10000, // 10 secondes timeout
});

// Gestion des erreurs Redis avec rate limiting
redis.on('error', err => {
  const now = Date.now();
  const timeSinceLastError = now - lastErrorTime;

  errorCount++;
  lastErrorTime = now;

  // Logger seulement si on n'a pas dépassé la limite ou si c'est une nouvelle erreur après un délai
  if (
    errorCount <= MAX_ERRORS_BEFORE_SILENCE ||
    timeSinceLastError > ERROR_RATE_LIMIT_MS
  ) {
    if (errorCount > MAX_ERRORS_BEFORE_SILENCE) {
      errorCount = 1; // Reset counter après le délai
    }

    const errorCode = (err as any)?.code || 'UNKNOWN';
    log.warn(
      {
        error: err,
        code: errorCode,
        errorCount,
        host: process.env['REDIS_HOST'] || 'localhost',
        port: process.env['REDIS_PORT'] || '6379',
      },
      'Redis connection error',
    );

    // Envoyer à Sentry seulement pour les premières erreurs ou erreurs critiques
    if (errorCount <= 3 || errorCode !== 'ECONNREFUSED') {
      Sentry.captureException(err, {
        tags: {
          component: 'RedisCache',
          event: 'connection_error',
          code: errorCode,
        },
        level: errorCount <= 1 ? 'error' : 'warning',
      });
    }
  }

  isConnected = false;
});

redis.on('connect', () => {
  isConnected = true;
  errorCount = 0; // Reset error count on successful connection
  log.info(
    {
      host: process.env['REDIS_HOST'] || 'localhost',
      port: process.env['REDIS_PORT'] || '6379',
    },
    'Redis connected successfully',
  );
});

redis.on('ready', () => {
  isConnected = true;
  log.info('Redis is ready to accept commands');
});

redis.on('close', () => {
  isConnected = false;
  log.warn('Redis connection closed');
});

redis.on('reconnecting', (delay: number) => {
  log.info({ delay }, 'Redis reconnecting...');
});

// Helper pour vérifier si Redis est disponible
const isRedisAvailable = (): boolean => {
  return isConnected && redis.status === 'ready';
};

// Export helper pour vérifier le statut Redis
export const isRedisConnected = (): boolean => {
  return isRedisAvailable();
};

// Cache helper functions
export const cache = {
  // Cache des utilisateurs (5 minutes)
  users: {
    set: async (key: string, data: any, ttl: number = 300) => {
      if (!isRedisAvailable()) {
        return; // Fail silently if Redis is not available
      }
      try {
        await redis.setex(`users:${key}`, ttl, JSON.stringify(data));
        log.debug({ key, ttl }, 'Users cache set');
      } catch (error) {
        // Only log if it's not a connection error (already handled by error handler)
        const errorCode = (error as any)?.code;
        if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
          log.error({ error, key }, 'Cache users set error');
        }
      }
    },

    get: async (key: string) => {
      if (!isRedisAvailable()) {
        return null; // Fail silently if Redis is not available
      }
      try {
        const data = await redis.get(`users:${key}`);
        if (data) {
          log.debug({ key }, 'Users cache hit');
        }
        return data ? JSON.parse(data) : null;
      } catch (error) {
        // Only log if it's not a connection error
        const errorCode = (error as any)?.code;
        if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
          log.error({ error, key }, 'Cache users get error');
        }
        return null;
      }
    },

    del: async (key: string) => {
      if (!isRedisAvailable()) {
        return; // Fail silently if Redis is not available
      }
      try {
        await redis.del(`users:${key}`);
        log.debug({ key }, 'Users cache deleted');
      } catch (error) {
        // Only log if it's not a connection error
        const errorCode = (error as any)?.code;
        if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
          log.error({ error, key }, 'Cache users del error');
        }
      }
    },
  },

  // Cache des services (1 heure)
  services: {
    set: async (key: string, data: any, ttl: number = 3600) => {
      if (!isRedisAvailable()) {
        return;
      }
      try {
        await redis.setex(`services:${key}`, ttl, JSON.stringify(data));
        log.debug({ key, ttl }, 'Services cache set');
      } catch (error) {
        const errorCode = (error as any)?.code;
        if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
          log.error({ error, key }, 'Cache services set error');
        }
      }
    },

    get: async (key: string) => {
      if (!isRedisAvailable()) {
        return null;
      }
      try {
        const data = await redis.get(`services:${key}`);
        if (data) {
          log.debug({ key }, 'Services cache hit');
        }
        return data ? JSON.parse(data) : null;
      } catch (error) {
        const errorCode = (error as any)?.code;
        if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
          log.error({ error, key }, 'Cache services get error');
        }
        return null;
      }
    },

    del: async (key: string) => {
      if (!isRedisAvailable()) {
        return;
      }
      try {
        await redis.del(`services:${key}`);
        log.debug({ key }, 'Services cache deleted');
      } catch (error) {
        const errorCode = (error as any)?.code;
        if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
          log.error({ error, key }, 'Cache services del error');
        }
      }
    },
  },

  // Cache des statistiques (30 minutes)
  stats: {
    set: async (key: string, data: any, ttl: number = 1800) => {
      if (!isRedisAvailable()) {
        return;
      }
      try {
        await redis.setex(`stats:${key}`, ttl, JSON.stringify(data));
        log.debug({ key, ttl }, 'Stats cache set');
      } catch (error) {
        const errorCode = (error as any)?.code;
        if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
          log.error({ error, key }, 'Cache stats set error');
        }
      }
    },

    get: async (key: string) => {
      if (!isRedisAvailable()) {
        return null;
      }
      try {
        const data = await redis.get(`stats:${key}`);
        if (data) {
          log.debug({ key }, 'Stats cache hit');
        }
        return data ? JSON.parse(data) : null;
      } catch (error) {
        const errorCode = (error as any)?.code;
        if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
          log.error({ error, key }, 'Cache stats get error');
        }
        return null;
      }
    },

    del: async (key: string) => {
      if (!isRedisAvailable()) {
        return;
      }
      try {
        await redis.del(`stats:${key}`);
        log.debug({ key }, 'Stats cache deleted');
      } catch (error) {
        const errorCode = (error as any)?.code;
        if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
          log.error({ error, key }, 'Cache stats del error');
        }
      }
    },
  },

  // Cache des rendez-vous (15 minutes)
  appointments: {
    set: async (key: string, data: any, ttl: number = 900) => {
      if (!isRedisAvailable()) {
        return;
      }
      try {
        await redis.setex(`appointments:${key}`, ttl, JSON.stringify(data));
        log.debug({ key, ttl }, 'Appointments cache set');
      } catch (error) {
        const errorCode = (error as any)?.code;
        if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
          log.error({ error, key }, 'Cache appointments set error');
        }
      }
    },

    get: async (key: string) => {
      if (!isRedisAvailable()) {
        return null;
      }
      try {
        const data = await redis.get(`appointments:${key}`);
        if (data) {
          log.debug({ key }, 'Appointments cache hit');
        }
        return data ? JSON.parse(data) : null;
      } catch (error) {
        const errorCode = (error as any)?.code;
        if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
          log.error({ error, key }, 'Cache appointments get error');
        }
        return null;
      }
    },

    del: async (key: string) => {
      if (!isRedisAvailable()) {
        return;
      }
      try {
        await redis.del(`appointments:${key}`);
        log.debug({ key }, 'Appointments cache deleted');
      } catch (error) {
        const errorCode = (error as any)?.code;
        if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
          log.error({ error, key }, 'Cache appointments del error');
        }
      }
    },
  },

  // Cache générique
  set: async (key: string, data: any, ttl: number = 3600) => {
    if (!isRedisAvailable()) {
      return;
    }
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
      log.debug({ key, ttl }, 'Generic cache set');
    } catch (error) {
      const errorCode = (error as any)?.code;
      if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
        log.error({ error, key }, 'Cache set error');
      }
    }
  },

  get: async (key: string) => {
    if (!isRedisAvailable()) {
      return null;
    }
    try {
      const data = await redis.get(key);
      if (data) {
        log.debug({ key }, 'Generic cache hit');
      }
      return data ? JSON.parse(data) : null;
    } catch (error) {
      const errorCode = (error as any)?.code;
      if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
        log.error({ error, key }, 'Cache get error');
      }
      return null;
    }
  },

  del: async (key: string) => {
    if (!isRedisAvailable()) {
      return;
    }
    try {
      await redis.del(key);
      log.debug({ key }, 'Generic cache deleted');
    } catch (error) {
      const errorCode = (error as any)?.code;
      if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
        log.error({ error, key }, 'Cache del error');
      }
    }
  },

  // Nettoyage du cache
  clear: async (pattern: string = '*') => {
    if (!isRedisAvailable()) {
      return;
    }
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        log.info({ pattern, keysCount: keys.length }, 'Cache cleared');
      }
    } catch (error) {
      const errorCode = (error as any)?.code;
      if (errorCode !== 'ECONNREFUSED' && errorCode !== 'ENOTFOUND') {
        log.error({ error, pattern }, 'Cache clear error');
      }
    }
  },
};

export default redis;
