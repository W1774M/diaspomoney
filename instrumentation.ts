/**
 * Next.js Instrumentation Hook
 * S'exécute une seule fois au démarrage du serveur
 * Utilisé pour initialiser les systèmes serveur uniquement
 */
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    // Sentry : erreurs serveur, étiquetées par environnement (development, staging,
    // production). Ces alertes alimentent la validation des déploiements CircleCI via le
    // relais docker/sentry-relay. Inactif sans SENTRY_DSN.
    const dsn = process.env['SENTRY_DSN'];
    if (dsn) {
      Sentry.init({
        dsn,
        environment: process.env['SENTRY_ENVIRONMENT'] ?? 'development',
        tracesSampleRate: 0,
        sendDefaultPii: false,
      });
    }

    // Initialiser les systèmes serveur uniquement
    const { initializeDI } = await import('@/lib/di/initialize');
    initializeDI();
  }
}

/** Remonte à Sentry les erreurs des requêtes (routes, server components, actions). */
export const onRequestError = Sentry.captureRequestError;
