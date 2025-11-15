/**
 * Listeners pour les événements système
 * Gère le logging, monitoring et alertes
 */

import { ErrorOccurredEvent, systemEvents } from '@/lib/events';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import * as Sentry from '@sentry/nextjs';

/**
 * Initialiser tous les listeners système
 */
export function setupSystemEventListeners() {
  // Listener pour les erreurs
  systemEvents.onError(async (data: ErrorOccurredEvent) => {
    console.error('[SystemEventListeners] Error occurred:', data.error);

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
      console.error('[SystemEventListeners] Error details:', {
        name: data.error.name,
        message: data.error.message,
        stack: data.error.stack,
        context: data.context,
        timestamp: data.timestamp,
      });

      // 4. Envoyer une alerte pour les erreurs critiques
      if (data.context && 'critical' in data.context && data.context['critical']) {  // eslint-disable-line no-unused-expressions
        // await alertService.sendCriticalAlert({
        //   error: data.error.message,
        //   context: data.context,
        //   timestamp: data.timestamp,
        // });
      }
    } catch (error) {
      // Ne pas laisser les erreurs dans les listeners bloquer l'exécution
      console.error('[SystemEventListeners] Error in error handler:', error);
    }
  });
}

