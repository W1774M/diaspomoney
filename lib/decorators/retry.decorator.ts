/**
 * Retry Decorator - DiaspoMoney
 * 
 * Decorator pour ajouter une logique de retry automatique aux méthodes
 * Utile pour les opérations qui peuvent échouer temporairement (appels API, DB, etc.)
 */

import { logger } from '@/lib/logger';

interface RetryOptions {
  maxAttempts?: number; // Nombre maximum de tentatives (défaut: 3)
  delay?: number; // Délai en ms entre les tentatives (défaut: 1000)
  backoff?: 'fixed' | 'exponential' | 'linear'; // Type de backoff (défaut: 'fixed')
  backoffMultiplier?: number; // Multiplicateur pour le backoff exponentiel/linéaire (défaut: 2)
  shouldRetry?: (error: any) => boolean; // Fonction pour déterminer si on doit retry (défaut: toujours retry)
  onRetry?: (attempt: number, error: any) => void; // Callback appelé à chaque retry
  logRetries?: boolean; // Logger les tentatives (défaut: true)
}

/**
 * Decorator pour ajouter une logique de retry à une méthode
 * 
 * @example
 * ```typescript
 * @Retry({ maxAttempts: 3, delay: 1000, backoff: 'exponential' })
 * async fetchData() {
 *   // Méthode qui peut échouer
 * }
 * ```
 */
export function Retry(options: RetryOptions = {}) {
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
      maxAttempts = 3,
      delay = 1000,
      backoff = 'fixed',
      backoffMultiplier = 2,
      shouldRetry = () => true,
      onRetry,
      logRetries = true,
    } = options;

    descriptor.value = async function (this: any, ...args: any[]) {
      const methodName = `${target.constructor.name}.${propertyKey}`;
      let lastError: any;
      let currentDelay = delay;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const result = await originalMethod.apply(this, args);
          
          // Si c'est un retry réussi, logger le succès
          if (attempt > 1 && logRetries) {
            logger.info({
              method: methodName,
              attempt,
              totalAttempts: attempt,
            }, `Retry succeeded after ${attempt} attempts`);
          }

          return result;
        } catch (error: any) {
          lastError = error;

          // Vérifier si on doit retry cette erreur
          if (!shouldRetry(error)) {
            if (logRetries) {
              logger.warn({
                method: methodName,
                attempt,
                error: error.message,
              }, 'Error not retryable, throwing immediately');
            }
            throw error;
          }

          // Si c'est la dernière tentative, throw l'erreur
          if (attempt === maxAttempts) {
            if (logRetries) {
              logger.error({
                method: methodName,
                totalAttempts: maxAttempts,
                error: error.message,
                errorStack: error.stack,
              }, `All ${maxAttempts} retry attempts failed`);
            }
            throw error;
          }

          // Logger le retry
          if (logRetries) {
            logger.warn({
              method: methodName,
              attempt,
              maxAttempts,
              nextAttemptIn: currentDelay,
              error: error.message,
            }, `Retry attempt ${attempt}/${maxAttempts}`);
          }

          // Appeler le callback onRetry si fourni
          if (onRetry) {
            try {
              onRetry(attempt, error);
            } catch (callbackError) {
              logger.error({
                method: methodName,
                attempt,
                callbackError,
              }, 'Error in onRetry callback');
            }
          }

          // Attendre avant le prochain essai
          await new Promise((resolve) => setTimeout(resolve, currentDelay));

          // Calculer le délai pour le prochain essai
          switch (backoff) {
            case 'exponential':
              currentDelay = delay * Math.pow(backoffMultiplier, attempt - 1);
              break;
            case 'linear':
              currentDelay = delay * backoffMultiplier * (attempt - 1);
              break;
            case 'fixed':
            default:
              currentDelay = delay;
              break;
          }
        }
      }

      // Ne devrait jamais arriver ici, mais au cas où
      throw lastError;
    };

    return descriptor;
  };
}

/**
 * Helper pour créer une fonction shouldRetry basée sur le type d'erreur
 */
export const RetryHelpers = {
  /**
   * Retry uniquement pour les erreurs réseau
   */
  retryOnNetworkError: (error: any): boolean => {
    return (
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ENOTFOUND' ||
      error?.message?.includes('network') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('ECONNREFUSED') ||
      error?.message?.includes('ETIMEDOUT')
    );
  },

  /**
   * Retry uniquement pour les erreurs HTTP 5xx
   */
  retryOnServerError: (error: any): boolean => {
    return (
      error?.status >= 500 && error?.status < 600 ||
      error?.response?.status >= 500 && error?.response?.status < 600
    );
  },

  /**
   * Retry pour les erreurs réseau ET serveur
   */
  retryOnNetworkOrServerError: (error: any): boolean => {
    return RetryHelpers.retryOnNetworkError(error) || RetryHelpers.retryOnServerError(error);
  },

  /**
   * Ne jamais retry pour certaines erreurs spécifiques
   */
  neverRetryOn: (errorTypes: string[]) => (error: any): boolean => {
    return !errorTypes.some(type => 
      error?.name === type || 
      error?.code === type ||
      error?.message?.includes(type),
    );
  },
};

