/**
 * Cache Decorator Pattern
 * 
 * Decorator pour ajouter du caching automatique aux méthodes de service
 * Utilise Redis si disponible, sinon fallback sur cache mémoire
 */

import { memoryCache } from '@/lib/cache/memory-fallback';
import { cache, invalidateAppCache } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';
import type { CacheableDecoratorOptions, InvalidateCacheDecoratorOptions } from '@/lib/types';

/**
 * Champs qui ne doivent jamais être copiés dans Redis (hash de mot de passe, secrets 2FA,
 * jetons). Un résultat qui en contient n'est pas mis en cache : il est renvoyé tel quel.
 */
const SECRET_KEYS = new Set([
  'password',
  'passwordHash',
  'twoFactorSecret',
  'twoFactorBackupCodes',
  'securityAnswer',
  'passwordResetToken',
  'resetToken',
  'emailVerificationToken',
  'verificationToken',
  'refreshToken',
  'accessToken',
]);

/** Le résultat contient-il un champ secret (recherche bornée en profondeur) ? */
export function containsSecret(value: unknown, depth = 0): boolean {
  if (depth > 6 || value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((v) => containsSecret(v, depth + 1));
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEYS.has(key) && v !== undefined && v !== null && v !== '') return true;
    if (containsSecret(v, depth + 1)) return true;
  }
  return false;
}

/**
 * Decorator Cacheable pour ajouter du caching aux méthodes
 * 
 * @param ttl - Durée de vie du cache en secondes (défaut: 300 = 5 minutes)
 * @param options - Options supplémentaires pour le cache
 * 
 * @example
 * class UserService {
 *   @Cacheable(600) // Cache 10 minutes
 *   async getUserById(id: string) {
 *     // Logique
 *   }
 * }
 */
export function Cacheable(ttl: number = 300, options: CacheableDecoratorOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) {
      return;
    }

    const useMemoryFallback = options.useMemoryFallback !== false;

    descriptor.value = async function (this: any, ...args: any[]) {
      // Générer la clé de cache
      const prefix = options.prefix || `${target.constructor.name}:${propertyKey}`;
      const argsKey = JSON.stringify(args);
      const cacheKey = `${prefix}:${argsKey}`;

      // Essayer de récupérer depuis le cache Redis
      try {
        const cached = await cache.get(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (error) {
        // Si Redis échoue et qu'on a le fallback mémoire
        if (useMemoryFallback) {
          try {
            const memoryCached = await memoryCache.get(cacheKey);
            if (memoryCached) {
              return memoryCached;
            }
          } catch (memoryError) {
            logger.error({ cacheKey, error: memoryError }, 'Cache memory fallback error');
          }
        } else {
          logger.error({ cacheKey, error }, 'Cache Redis error');
        }
      }

      // Exécuter la méthode originale
      const result = await originalMethod.apply(this, args);

      // Jamais de secret dans le cache (Redis est persisté sur disque).
      if (containsSecret(result)) {
        logger.warn({ prefix }, 'Résultat non mis en cache : il contient un champ secret');
        return result;
      }

      // Mettre en cache le résultat
      try {
        await cache.set(cacheKey, result, ttl);
      } catch (error) {
        // Fallback sur cache mémoire si Redis échoue
        if (useMemoryFallback) {
          try {
            await memoryCache.set(cacheKey, result, ttl);
          } catch (memoryError) {
            logger.error({ cacheKey, error: memoryError }, 'Cache memory set error');
          }
        } else {
          logger.error({ cacheKey, error }, 'Cache Redis set error');
        }
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator pour invalider le cache après une opération de modification
 * 
 * @param pattern - Pattern de clés à invalider (ex: "UserService:getUserById:*")
 * @param options - Options supplémentaires
 * 
 * @example
 * class UserService {
 *   @InvalidateCache("UserService:getUserById:*")
 *   async updateUser(id: string, data: any) {
 *     // Logique de mise à jour
 *   }
 * }
 */
export function InvalidateCache(pattern: string, _options?: InvalidateCacheDecoratorOptions) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) {
      return;
    }

    descriptor.value = async function (this: any, ...args: any[]) {
      // Exécuter la méthode originale
      const result = await originalMethod.apply(this, args);

      // Invalider le cache après l'opération : tout le cache de l'environnement (sauf domaines
      // autonomes, voir invalidateAppCache). Le motif ne sert qu'à identifier le domaine :
      // une donnée est mise en cache à plusieurs niveaux, un motif ciblé en oublie.
      try {
        await invalidateAppCache(pattern);
      } catch (error) {
        logger.error({ pattern, error }, 'Cache invalidation error');
        // Essayer aussi avec le cache mémoire
        try {
          const keys = await memoryCache.keys(pattern);
          for (const key of keys) {
            await memoryCache.del(key);
          }
        } catch (memoryError) {
          logger.error({ pattern, error: memoryError }, 'Memory cache invalidation error');
        }
      }

      return result;
    };

    return descriptor;
  };
}

