/**
 * Performance Decorator Pattern
 * 
 * Decorator pour mesurer les performances des méthodes
 * Enregistre les métriques de performance
 */

import { logger } from '@/lib/logger';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import * as Sentry from '@sentry/nextjs';
import type { PerformanceDecoratorOptions } from '@/lib/types';

/**
 * Decorator Performance pour mesurer les performances
 * 
 * @param options - Options de performance
 * 
 * @example
 * class UserService {
 *   @Performance({ warningThreshold: 1000, errorThreshold: 5000 })
 *   async getUserById(id: string) {
 *     // Logique
 *   }
 * }
 */
export function Performance(options: PerformanceDecoratorOptions = {}) {
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
      warningThreshold = 1000, // 1 seconde
      errorThreshold = 5000, // 5 secondes
      logMetrics = true,
      sendMetrics = true,
      enabled = true,
      log = true,
    } = options;

    descriptor.value = async function (this: any, ...args: any[]) {
      if (!enabled) {
        return originalMethod.apply(this, args);
      }

      const className = target.constructor.name;
      const methodName = propertyKey;
      const startTime = Date.now();
      const startHrTime = process.hrtime.bigint();

      let result: any;
      let error: any = null;

      try {
        // Exécuter la méthode originale
        result = await originalMethod.apply(this, args);

        const endTime = Date.now();
        const endHrTime = process.hrtime.bigint();
        const executionTime = endTime - startTime;
        const executionTimeNs = Number(endHrTime - startHrTime) / 1_000_000; // Convertir en millisecondes

        // Déterminer le niveau de performance
        let performanceLevel: 'good' | 'warning' | 'error' = 'good';
        if (executionTime >= errorThreshold) {
          performanceLevel = 'error';
        } else if (executionTime >= warningThreshold) {
          performanceLevel = 'warning';
        }

        // Enregistrer les métriques
        if (sendMetrics) {
          try {
            monitoringManager.recordMetric({
              name: `method_execution_time`,
              value: executionTime,
              timestamp: new Date(),
              labels: {
                class: className,
                method: methodName,
                level: performanceLevel,
              },
              type: 'histogram',
            });

            monitoringManager.recordMetric({
              name: `method_execution_count`,
              value: 1,
              timestamp: new Date(),
              labels: {
                class: className,
                method: methodName,
                status: 'success',
              },
              type: 'counter',
            });
          } catch (metricsError) {
            logger.error(
              {
                type: 'performance_metrics_error',
                class: className,
                method: methodName,
                error: (metricsError as Error).message,
              },
              `Failed to record performance metrics for ${className}.${methodName}`,
            );
          }
        }

        // Logger selon le niveau de performance
        if (log && logMetrics) {
          const logData = {
            type: 'performance',
            class: className,
            method: methodName,
            executionTime,
            executionTimeNs,
            level: performanceLevel,
            warningThreshold,
            errorThreshold,
          };

          if (performanceLevel === 'error') {
            logger.error(
              logData,
              `Performance error: ${className}.${methodName} took ${executionTime}ms (threshold: ${errorThreshold}ms)`,
            );

            Sentry.captureMessage(
              `Performance error: ${className}.${methodName} exceeded error threshold`,
              {
                level: 'error',
                tags: {
                  component: 'PerformanceDecorator',
                  action: 'performanceError',
                },
                extra: logData,
              },
            );
          } else if (performanceLevel === 'warning') {
            logger.warn(
              logData,
              `Performance warning: ${className}.${methodName} took ${executionTime}ms (threshold: ${warningThreshold}ms)`,
            );
          } else {
            logger.debug(
              logData,
              `Performance: ${className}.${methodName} took ${executionTime}ms`,
            );
          }
        }

        return result;
      } catch (err: any) {
        error = err;
        const endTime = Date.now();
        const executionTime = endTime - startTime;

        // Enregistrer les métriques d'erreur
        if (sendMetrics) {
          try {
            monitoringManager.recordMetric({
              name: `method_execution_count`,
              value: 1,
              timestamp: new Date(),
              labels: {
                class: className,
                method: methodName,
                status: 'error',
              },
              type: 'counter',
            });
          } catch (metricsError) {
            logger.error(
              {
                type: 'performance_metrics_error',
                class: className,
                method: methodName,
                error: (metricsError as Error).message,
              },
              `Failed to record performance metrics for ${className}.${methodName}`,
            );
          }
        }

        if (log && logMetrics) {
          logger.error(
            {
              type: 'performance_error',
              class: className,
              method: methodName,
              executionTime,
              error: error.message,
            },
            `Performance error in ${className}.${methodName} after ${executionTime}ms`,
          );
        }

        throw error;
      }
    };

    return descriptor;
  };
}

