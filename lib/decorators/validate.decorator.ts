/**
 * Validate Decorator Pattern
 * 
 * Decorator pour ajouter de la validation automatique aux méthodes de service
 * Utilise Zod pour valider les arguments
 */

import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

interface ValidationRule {
  paramIndex: number; // Index du paramètre à valider (0-based)
  schema: z.ZodTypeAny; // Schéma Zod pour la validation
  paramName?: string; // Nom du paramètre (pour les messages d'erreur)
}

interface ValidateOptions {
  rules: ValidationRule[]; // Règles de validation
  throwOnError?: boolean; // Lancer une exception en cas d'erreur (défaut: true)
  logErrors?: boolean; // Logger les erreurs de validation (défaut: true)
}

/**
 * Decorator Validate pour ajouter de la validation aux méthodes
 * 
 * @param options - Options de validation avec les règles
 * 
 * @example
 * class UserService {
 *   @Validate({
 *     rules: [
 *       { paramIndex: 0, schema: z.string().min(1), paramName: 'userId' }
 *     ]
 *   })
 *   async getUserById(userId: string) {
 *     // Logique
 *   }
 * }
 */
export function Validate(options: ValidateOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) {
      return;
    }

    const {
      rules,
      throwOnError = true,
      logErrors = true,
    } = options;

    descriptor.value = async function (this: any, ...args: any[]) {
      const className = target.constructor.name;
      const methodName = propertyKey;
      const validationErrors: Array<{ paramIndex: number; paramName?: string; errors: string[] }> = [];

      // Valider chaque paramètre selon les règles
      for (const rule of rules) {
        const { paramIndex, schema, paramName } = rule;

        if (paramIndex >= args.length) {
          continue; // Paramètre non fourni, skip
        }

        const paramValue = args[paramIndex];
        const result = await schema.safeParseAsync(paramValue);

        if (!result.success) {
          const errors = result.error.issues.map(issue => issue.message);
          validationErrors.push({
            paramIndex,
            paramName: paramName || `param${paramIndex}`,
            errors,
          });

          // Logger l'erreur de validation
          if (logErrors) {
            logger.warn({
              type: 'validation_error',
              class: className,
              method: methodName,
              paramIndex,
              paramName: paramName || `param${paramIndex}`,
              errors,
              value: paramValue,
            }, `Validation failed for ${className}.${methodName} - ${paramName || `param${paramIndex}`}`);
          }
        } else {
          // Remplacer la valeur par la valeur validée (peut être transformée par Zod)
          args[paramIndex] = result.data;
        }
      }

      // Si des erreurs de validation existent
      if (validationErrors.length > 0) {
        const errorMessage = validationErrors
          .map(err => `${err.paramName}: ${err.errors.join(', ')}`)
          .join('; ');

        const validationError = new Error(`Validation failed: ${errorMessage}`);

        // Envoyer à Sentry
        Sentry.captureException(validationError, {
          tags: {
            class: className,
            method: methodName,
            type: 'validation_error',
          },
          extra: {
            validationErrors,
            args,
          },
        });

        if (throwOnError) {
          throw validationError;
        }
      }

      // Exécuter la méthode originale avec les valeurs validées
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Helper pour créer une règle de validation
 */
export function ValidationRule(
  paramIndex: number,
  schema: z.ZodTypeAny,
  paramName?: string
): ValidationRule {
  return { paramIndex, schema, paramName: paramName || 'unknown' };
}

