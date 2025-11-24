/**
 * Rate Limit Decorator Pattern
 * 
 * Decorator pour limiter le taux d'appels aux méthodes
 * Utilise Redis pour le rate limiting distribué
 */

import { logger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis/redis-client';
import * as Sentry from '@sentry/nextjs';
import type { RateLimitDecoratorOptions } from '@/lib/types';

/**
 * Decorator RateLimit pour limiter le taux d'appels
 * 
 * @param options - Options de rate limiting
 * 
 * @example
 * class UserService {
 *   @RateLimit({ maxRequests: 100, windowMs: 60000 })
 *   async getUserById(id: string) {
 *     // Logique
 *   }
 * }
 */
export function RateLimit(options: RateLimitDecoratorOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) {
      return;
    }

    const {
      maxRequests,
      windowMs,
      errorMessage = 'Trop de requêtes, veuillez réessayer plus tard',
      keyGenerator,
      enabled = true,
      log = true,
    } = options;

    descriptor.value = async function (this: any, ...args: any[]) {
      if (!enabled) {
        return originalMethod.apply(this, args);
      }

      const className = target.constructor.name;
      const methodName = propertyKey;

      try {
        // Générer la clé de rate limiting
        const key = keyGenerator
          ? keyGenerator(...args)
          : `ratelimit:${className}:${methodName}:${args[0] || 'default'}`;

        // Vérifier le rate limit via Redis
        const redisClient = getRedisClient();
        const windowSeconds = Math.floor(windowMs / 1000);
        const rateLimitResult = await redisClient.rateLimit(
          key,
          maxRequests,
          windowSeconds,
        );

        if (!rateLimitResult.allowed) {
          const error = new Error(errorMessage);
          (error as any).statusCode = 429;
          (error as any).remaining = rateLimitResult.remaining;
          (error as any).resetTime = rateLimitResult.resetTime;

          if (log) {
            logger.warn(
              {
                type: 'rate_limit_exceeded',
                class: className,
                method: methodName,
                key,
                maxRequests,
                windowMs,
              },
              `Rate limit exceeded for ${className}.${methodName}`,
            );
          }

          Sentry.captureException(error, {
            tags: {
              component: 'RateLimitDecorator',
              action: 'rateLimitExceeded',
            },
            extra: {
              className,
              methodName,
              key,
              maxRequests,
              windowMs,
            },
          });

          throw error;
        }

        if (log && rateLimitResult.remaining < maxRequests * 0.1) {
          logger.debug(
            {
              type: 'rate_limit_warning',
              class: className,
              method: methodName,
              key,
              remaining: rateLimitResult.remaining,
              maxRequests,
            },
            `Rate limit warning for ${className}.${methodName}`,
          );
        }

        // Exécuter la méthode originale
        return await originalMethod.apply(this, args);
      } catch (error: any) {
        // Si c'est déjà une erreur de rate limit, la propager
        if (error.statusCode === 429) {
          throw error;
        }

        // Sinon, logger l'erreur mais permettre l'exécution
        logger.error(
          {
            type: 'rate_limit_error',
            class: className,
            method: methodName,
            error: error.message,
          },
          `Error in rate limit check for ${className}.${methodName}`,
        );

        // En cas d'erreur Redis, permettre l'exécution (fail-open)
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

