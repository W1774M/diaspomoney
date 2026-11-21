/**
 * Cache Decorator Pattern
 * 
 * Decorator pour ajouter du caching automatique aux méthodes de service
 * Utilise Redis si disponible, sinon fallback sur cache mémoire
 */

import { memoryCache } from '@/lib/cache/memory-fallback';
import { cache } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';
import type { CacheableDecoratorOptions, InvalidateCacheDecoratorOptions } from '@/lib/types';

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

      // Invalider le cache après l'opération
      try {
        await cache.clear(pattern);
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

