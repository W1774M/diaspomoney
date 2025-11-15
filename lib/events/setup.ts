/**
 * Configuration et initialisation du système d'événements
 * À appeler au démarrage de l'application
 */

import { setupAllEventListeners } from './listeners';

let isInitialized = false;

/**
 * Initialiser le système d'événements
 * À appeler une seule fois au démarrage de l'application
 */
export function initializeEventSystem() {
  if (isInitialized) {
    console.warn('[EventSystem] Already initialized, skipping...');
    return;
  }

  console.log('[EventSystem] Initializing event system...');
  
  // Initialiser tous les listeners
  setupAllEventListeners();
  
  isInitialized = true;
  console.log('[EventSystem] Event system initialized successfully');
}

/**
 * Vérifier si le système est initialisé
 */
export function isEventSystemInitialized(): boolean {
  return isInitialized;
}

