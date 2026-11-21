/**
 * Point d'entrée pour initialiser tous les listeners
 */

import { logger } from '@/lib/logger';
import { setupAnalyticsEventListeners } from './AnalyticsEventListeners';
import { setupAuthEventListeners } from './AuthEventListeners';
import { setupPaymentEventListeners } from './PaymentEventListeners';
import { setupSystemEventListeners } from './SystemEventListeners';

/**
 * Initialiser tous les listeners d'événements
 * À appeler au démarrage de l'application
 */
export function setupAllEventListeners() {
  logger.info('[EventListeners] Setting up all event listeners...');

  setupAuthEventListeners();
  setupPaymentEventListeners();
  setupSystemEventListeners();
  setupAnalyticsEventListeners();

  logger.info('[EventListeners] All event listeners initialized');
}

// Exports individuels pour permettre l'initialisation sélective
export { setupAnalyticsEventListeners } from './AnalyticsEventListeners';
export { setupAuthEventListeners } from './AuthEventListeners';
export { setupPaymentEventListeners } from './PaymentEventListeners';
export { setupSystemEventListeners } from './SystemEventListeners';

