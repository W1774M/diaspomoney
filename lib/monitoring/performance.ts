/**
 * Performance Monitoring
 * Implémente les design patterns :
 * - Singleton Pattern (instance unique)
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 * - Monitoring Pattern
 */

import { childLogger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

const log = childLogger({ component: 'PerformanceMonitoring' });

// Monitoring de performance basique pour la Phase 1
export const performanceMonitoring = {
  // Track des métriques de performance
  metrics: {
    apiResponseTime: new Map<string, number[]>(),
    cacheHitRate: new Map<string, { hits: number; misses: number }>(),
    errorCount: new Map<string, number>(),
  },

  // Enregistrer le temps de réponse d'une API
  trackAPIPerformance: (endpoint: string, duration: number) => {
    const metrics = performanceMonitoring.metrics.apiResponseTime;
    if (!metrics.has(endpoint)) {
      metrics.set(endpoint, []);
    }

    const times = metrics.get(endpoint)!;
    times.push(duration);

    // Garder seulement les 100 dernières mesures
    if (times.length > 100) {
      times.shift();
    }

    // Alert si > 2 secondes
    if (duration > 2000) {
      log.warn({ endpoint, duration }, 'Slow API detected');
      Sentry.captureMessage(`Slow API: ${endpoint}`, {
        level: 'warning',
        extra: { endpoint, duration },
      });
    }
  },

  // Enregistrer les hits/misses du cache
  trackCachePerformance: (cacheType: string, hit: boolean) => {
    const metrics = performanceMonitoring.metrics.cacheHitRate;
    if (!metrics.has(cacheType)) {
      metrics.set(cacheType, { hits: 0, misses: 0 });
    }

    const stats = metrics.get(cacheType)!;
    if (hit) {
      stats.hits++;
    } else {
      stats.misses++;
    }
  },

  // Enregistrer une erreur
  trackError: (endpoint: string, error: string) => {
    const metrics = performanceMonitoring.metrics.errorCount;
    const count = metrics.get(endpoint) || 0;
    metrics.set(endpoint, count + 1);

    log.error({ endpoint, error }, 'API error tracked');
    Sentry.captureMessage(`Error in ${endpoint}`, {
      level: 'error',
      extra: { endpoint, error },
    });
  },

  // Obtenir les statistiques de performance
  getStats: () => {
    const stats: any = {};

    // Stats des temps de réponse
    for (const [endpoint, times] of performanceMonitoring.metrics
      .apiResponseTime) {
      if (times.length > 0) {
        stats[`${endpoint}_response_time`] = {
          avg: times.reduce((a, b) => a + b, 0) / times.length,
          min: Math.min(...times),
          max: Math.max(...times),
          count: times.length,
        };
      }
    }

    // Stats du cache
    for (const [cacheType, { hits, misses }] of performanceMonitoring.metrics
      .cacheHitRate) {
      const total = hits + misses;
      stats[`${cacheType}_cache_hit_rate`] =
        total > 0 ? (hits / total) * 100 : 0;
    }

    // Stats des erreurs
    for (const [endpoint, count] of performanceMonitoring.metrics.errorCount) {
      stats[`${endpoint}_errors`] = count;
    }

    return stats;
  },

  // Nettoyer les métriques anciennes
  cleanup: () => {
    performanceMonitoring.metrics.apiResponseTime.clear();
    performanceMonitoring.metrics.cacheHitRate.clear();
    performanceMonitoring.metrics.errorCount.clear();
  },
};

// Middleware pour tracker automatiquement les performances
export function withPerformanceTracking<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  endpoint: string,
) {
  return async (...args: T): Promise<R> => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      performanceMonitoring.trackAPIPerformance(endpoint, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      performanceMonitoring.trackAPIPerformance(endpoint, duration);
      performanceMonitoring.trackError(
        endpoint,
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  };
}

// Fonction pour obtenir un rapport de performance
export function getPerformanceReport() {
  const stats = performanceMonitoring.getStats();

  log.info({ stats }, 'Performance report generated');

  return stats;
}
