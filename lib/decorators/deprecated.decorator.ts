/**
 * Deprecated Decorator Pattern
 * 
 * Decorator pour marquer les méthodes comme dépréciées
 * Affiche un avertissement lors de l'utilisation
 */

import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import type { DeprecatedDecoratorOptions } from '@/lib/types';

/**
 * Decorator Deprecated pour marquer les méthodes comme dépréciées
 * 
 * @param options - Options de dépréciation
 * 
 * @example
 * class UserService {
 *   @Deprecated({ message: 'Use getUserById instead', since: '1.0.0', alternative: 'getUserById' })
 *   async getOldUser(id: string) {
 *     // Logique
 *   }
 * }
 */
export function Deprecated(options: DeprecatedDecoratorOptions = {}) {
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
      message = 'Cette méthode est dépréciée',
      since,
      alternative,
      enabled = true,
      log = true,
    } = options;

    descriptor.value = async function (this: any, ...args: any[]) {
      const className = target.constructor.name;
      const methodName = propertyKey;

      // Construire le message d'avertissement
      let warningMessage = `⚠️ DEPRECATED: ${className}.${methodName} - ${message}`;
      if (since) {
        warningMessage += ` (depuis la version ${since})`;
      }
      if (alternative) {
        warningMessage += ` - Utilisez ${alternative} à la place`;
      }

      if (log && enabled) {
        logger.warn(
          {
            type: 'deprecated_method_used',
            class: className,
            method: methodName,
            message,
            since,
            alternative,
            stack: new Error().stack,
          },
          warningMessage,
        );

        // Envoyer à Sentry pour tracking
        Sentry.captureMessage(warningMessage, {
          level: 'warning',
          tags: {
            component: 'DeprecatedDecorator',
            action: 'deprecatedMethodUsed',
          },
          extra: {
            className,
            methodName,
            message,
            since,
            alternative,
          },
        });
      }

      // Exécuter la méthode originale
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

