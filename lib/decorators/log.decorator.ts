/**
 * Log Decorator Pattern
 * 
 * Decorator pour ajouter du logging automatique aux méthodes de service
 * Log les entrées, sorties, erreurs et temps d'exécution
 */

import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import type { LogDecoratorOptions } from '@/lib/types';

/**
 * Masquer les champs sensibles dans les données
 */
function maskSensitiveData(data: any, fieldsToMask: string[]): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item, fieldsToMask));
  }

  const masked = { ...data };
  for (const field of fieldsToMask) {
    if (field in masked) {
      masked[field] = '***MASKED***';
    }
  }

  return masked;
}

/**
 * Decorator Log pour ajouter du logging aux méthodes
 * 
 * @param options - Options de logging
 * 
 * @example
 * class UserService {
 *   @Log({ level: 'info', logArgs: true })
 *   async getUserById(id: string) {
 *     // Logique
 *   }
 * }
 */
export function Log(options: LogDecoratorOptions = {}) {
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
      level = 'info',
      logArgs = true,
      logResult = false,
      logExecutionTime = true,
      maskSensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'],
      sendToSentry = true,
    } = options;

    descriptor.value = async function (this: any, ...args: any[]) {
      const className = target.constructor.name;
      const methodName = propertyKey;
      const startTime = Date.now();

      // Préparer les arguments à logger
      let argsToLog = args;
      if (logArgs && maskSensitiveFields.length > 0) {
        argsToLog = args.map(arg => maskSensitiveData(arg, maskSensitiveFields));
      }

      // Logger l'entrée
      logger[level]({
        type: 'method_call',
        class: className,
        method: methodName,
        action: 'start',
        args: logArgs ? argsToLog : undefined,
      }, `${className}.${methodName} called`);

      try {
        // Exécuter la méthode originale
        const result = await originalMethod.apply(this, args);

        // Calculer le temps d'exécution
        const executionTime = Date.now() - startTime;

        // Préparer le résultat à logger
        let resultToLog = result;
        if (logResult && maskSensitiveFields.length > 0) {
          resultToLog = maskSensitiveData(result, maskSensitiveFields);
        }

        // Logger la sortie
        logger[level]({
          type: 'method_call',
          class: className,
          method: methodName,
          action: 'success',
          executionTime: logExecutionTime ? executionTime : undefined,
          result: logResult ? resultToLog : undefined,
        }, `${className}.${methodName} completed in ${executionTime}ms`);

        return result;
      } catch (error: any) {
        const executionTime = Date.now() - startTime;

        // Logger l'erreur
        logger.error({
          type: 'method_error',
          class: className,
          method: methodName,
          action: 'error',
          executionTime: logExecutionTime ? executionTime : undefined,
          error: {
            name: error?.name,
            message: error?.message,
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
          },
          args: logArgs ? argsToLog : undefined,
        }, `${className}.${methodName} failed after ${executionTime}ms: ${error?.message}`);

        // Envoyer à Sentry si activé
        if (sendToSentry && error) {
          Sentry.captureException(error, {
            tags: {
              class: className,
              method: methodName,
            },
            extra: {
              args: logArgs ? argsToLog : undefined,
              executionTime,
            },
          });
        }

        throw error;
      }
    };

    return descriptor;
  };
}

