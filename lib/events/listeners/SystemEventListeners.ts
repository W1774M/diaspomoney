/**
 * Listeners pour les événements système
 * Gère le logging, monitoring et alertes
 */

import { ErrorOccurredEvent, systemEvents } from '@/lib/events';
import { logger } from '@/lib/logger';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import * as Sentry from '@sentry/nextjs';

/**
 * Initialiser tous les listeners système
 */
export function setupSystemEventListeners() {
  // Listener pour les erreurs
  systemEvents.onError(async (data: ErrorOccurredEvent) => {
    logger.error({ error: data.error }, '[SystemEventListeners] Error occurred');

    try {
      // 1. Envoyer à Sentry
      Sentry.captureException(data.error, {
        extra: data.context as Record<string, any>,
        tags: {
          source: 'event-bus',
          timestamp: data.timestamp.toISOString(),
        },
      });

      // 2. Enregistrer dans le monitoring
      monitoringManager.recordMetric({
        name: 'errors_occurred',
        value: 1,
        timestamp: data.timestamp,
        labels: {
          error_type: data.error.name,
          error_message: data.error.message.substring(0, 100), // Limiter la longueur
        },
        type: 'counter',
      });

      // 3. Logger pour debugging
      logger.error({
        name: data.error.name,
        message: data.error.message,
        stack: data.error.stack,
        context: data.context,
        timestamp: data.timestamp,
      }, '[SystemEventListeners] Error details');

      // 4. Envoyer une alerte pour les erreurs critiques
      if (data.context && 'critical' in data.context && data.context['critical']) {   
        // await alertService.sendCriticalAlert({
        //   error: data.error.message,
        //   context: data.context,
        //   timestamp: data.timestamp,
        // });
      }
    } catch (error) {
      // Ne pas laisser les erreurs dans les listeners bloquer l'exécution
      logger.error({ error }, '[SystemEventListeners] Error in error handler');
    }
  });
}

