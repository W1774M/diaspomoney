/**
 * Configuration et initialisation du système d'événements
 * À appeler au démarrage de l'application
 */

import { logger } from '@/lib/logger';
import { setupAllEventListeners } from './listeners';

let isInitialized = false;

/**
 * Initialiser le système d'événements
 * À appeler une seule fois au démarrage de l'application
 */
export function initializeEventSystem() {
  if (isInitialized) {
    logger.warn('[EventSystem] Already initialized, skipping...');
    return;
  }

  logger.info('[EventSystem] Initializing event system...');
  
  // Initialiser tous les listeners
  setupAllEventListeners();
  
  isInitialized = true;
  logger.info('[EventSystem] Event system initialized successfully');
}

/**
 * Vérifier si le système est initialisé
 */
export function isEventSystemInitialized(): boolean {
  return isInitialized;
}

