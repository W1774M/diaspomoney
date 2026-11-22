/**
 * Redis Cache Helper
 * Implémente les design patterns :
 * - Singleton Pattern (instance Redis unique)
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 * - Cache Pattern
 *
 * Activation : CACHE_REDIS_ENABLED=true (désactivé par défaut, jamais en test ni pendant
 * `next build`). Désactivé, toutes les fonctions sont sans effet et `get` renvoie null.
 *
 * Toutes les clés sont rangées sous « cache: » : un vidage du cache ne touche jamais les
 * autres clés de la base (compteurs anti force brute, liste noire de jetons, fraude).
 */

import { childLogger } from '@/lib/logger';
import { redisConnectionFromEnv } from '@/lib/redis/redis-connection';
import * as Sentry from '@sentry/nextjs';
import Redis from 'ioredis';

const log = childLogger({ component: 'RedisCache' });

/** Espace de noms de toutes les clés de cache. */
export const CACHE_NAMESPACE = 'cache:';

/** Le cache est-il activé pour ce processus ? (lu à chaque appel : modifiable en test) */
export const isCacheEnabled = (): boolean =>
  process.env['CACHE_REDIS_ENABLED'] === 'true' &&
  process.env.NODE_ENV !== 'test' &&
  process.env['NEXT_PHASE'] !== 'phase-production-build';

// État de connexion Redis
let isConnected = false;
let lastErrorTime = 0;
let errorCount = 0;
const ERROR_RATE_LIMIT_MS = 60000; // 1 minute entre les logs d'erreur
const MAX_ERRORS_BEFORE_SILENCE = 5; // Arrêter de logger après 5 erreurs

// Base propre à chaque environnement (REDIS_URL …/0 dev, /1 rct, /2 prod).
const redis = new Redis({
  ...redisConnectionFromEnv(),
  maxRetriesPerRequest: 3,
  lazyConnect: true, // connexion ouverte au premier usage, seulement si le cache est activé
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
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
  if (errorCount <= MAX_ERRORS_BEFORE_SILENCE || timeSinceLastError > ERROR_RATE_LIMIT_MS) {
    if (errorCount > MAX_ERRORS_BEFORE_SILENCE) {
      errorCount = 1; // Reset counter après le délai
    }

    const errorCode = (err as any)?.code || 'UNKNOWN';
    log.warn({ error: err, code: errorCode, errorCount }, 'Redis connection error');

    // Envoyer à Sentry seulement pour les premières erreurs ou erreurs critiques
    if (errorCount <= 3 || errorCode !== 'ECONNREFUSED') {
      Sentry.captureException(err, {
        tags: { component: 'RedisCache', event: 'connection_error', code: errorCode },
        level: errorCount <= 1 ? 'error' : 'warning',
      });
    }
  }

  isConnected = false;
});

redis.on('connect', () => {
  isConnected = true;
  errorCount = 0; // Reset error count on successful connection
  log.info('Redis connected successfully');
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

/**
 * Redis est-il utilisable maintenant ? Ouvre la connexion au premier appel (sans attendre :
 * cet appel-là et les suivants, jusqu'à « ready », se passent du cache).
 */
const isRedisAvailable = (): boolean => {
  if (!isCacheEnabled()) return false;
  if (redis.status === 'wait') {
    redis.connect().catch(() => undefined); // erreurs déjà traitées par le handler 'error'
    return false;
  }
  return isConnected && redis.status === 'ready';
};

// Export helper pour vérifier le statut Redis
export const isRedisConnected = (): boolean => isRedisAvailable();

/** Les dates passent par JSON en texte ISO : on les restaure en Date à la lecture. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
export const reviveDates = (_key: string, value: unknown): unknown =>
  typeof value === 'string' && ISO_DATE.test(value) ? new Date(value) : value;

/** Erreurs de connexion : déjà journalisées par le handler 'error', inutile de les répéter. */
const logCommandError = (error: unknown, context: Record<string, unknown>, msg: string) => {
  const code = (error as any)?.code;
  if (code !== 'ECONNREFUSED' && code !== 'ENOTFOUND') log.error({ error, ...context }, msg);
};

/** Cache sous un préfixe (« users: », etc. ; vide pour le cache générique). */
function namespace(prefix: string, defaultTtl: number, label: string) {
  const fullKey = (key: string) => `${CACHE_NAMESPACE}${prefix}${key}`;
  return {
    set: async (key: string, data: any, ttl: number = defaultTtl) => {
      if (data === undefined || !isRedisAvailable()) return;
      try {
        await redis.setex(fullKey(key), ttl, JSON.stringify(data));
        log.debug({ key, ttl }, `${label} cache set`);
      } catch (error) {
        logCommandError(error, { key }, `Cache ${label} set error`);
      }
    },

    get: async (key: string) => {
      if (!isRedisAvailable()) return null;
      try {
        const data = await redis.get(fullKey(key));
        if (data) log.debug({ key }, `${label} cache hit`);
        return data ? JSON.parse(data, reviveDates) : null;
      } catch (error) {
        logCommandError(error, { key }, `Cache ${label} get error`);
        return null;
      }
    },

    del: async (key: string) => {
      if (!isRedisAvailable()) return;
      try {
        await redis.del(fullKey(key));
        log.debug({ key }, `${label} cache deleted`);
      } catch (error) {
        logCommandError(error, { key }, `Cache ${label} del error`);
      }
    },
  };
}

const generic = namespace('', 3600, 'Generic');

// Cache helper functions
export const cache = {
  users: namespace('users:', 300, 'Users'), // 5 minutes
  services: namespace('services:', 3600, 'Services'), // 1 heure
  stats: namespace('stats:', 1800, 'Stats'), // 30 minutes
  appointments: namespace('appointments:', 900, 'Appointments'), // 15 minutes

  // Cache générique
  ...generic,

  /** Supprime les clés de cache correspondant au motif (dans l'espace « cache: » seulement). */
  clear: async (pattern: string = '*') => {
    if (!isRedisAvailable()) return;
    try {
      const keys = await redis.keys(`${CACHE_NAMESPACE}${pattern}`);
      if (keys.length > 0) {
        await redis.del(...keys);
        log.info({ pattern, keysCount: keys.length }, 'Cache cleared');
      }
    } catch (error) {
      logCommandError(error, { pattern }, 'Cache clear error');
    }
  },
};

/**
 * Domaines écrits à presque chaque requête et lus seulement par eux-mêmes : une écriture ne
 * vide que leurs propres clés (sinon le cache serait vidé en permanence).
 */
const SELF_CONTAINED_DOMAINS: ReadonlyArray<readonly [RegExp, readonly string[]]> = [
  [/^(AuditLog|PCIAuditLog)/, ['AuditLog*', 'PCIAuditLog*']],
  [/^Notification/, ['Notification*']],
];

/**
 * Invalidation après une écriture. Une donnée est souvent mise en cache à plusieurs niveaux
 * (dépôt, service, façade, statistiques) : on vide tout le cache de l'environnement, sauf pour
 * les domaines autonomes ci-dessus. Plus sûr que des motifs ciblés, faciles à rater.
 *
 * @param scope motif ou préfixe d'origine (ex. « UserRepository:* ») ; absent = tout vider
 */
export async function invalidateAppCache(scope?: string): Promise<void> {
  const domain = scope ? SELF_CONTAINED_DOMAINS.find(([re]) => re.test(scope)) : undefined;
  for (const pattern of domain ? domain[1] : ['*']) {
    await cache.clear(pattern);
  }
}

export default redis;
