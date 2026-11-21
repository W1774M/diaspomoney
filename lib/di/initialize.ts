/**
 * Dependency Injection Initialization
 * 
 * Initialise le conteneur de services au démarrage de l'application
 */

import { initializeServiceRegistry } from '@/containers/service-registry';
import { initializeEventSystem } from '@/lib/events/setup';
import { logger } from '@/lib/logger';

let isInitialized = false;

/**
 * Initialiser le système d'injection de dépendances
 * À appeler au démarrage de l'application
 */
export function initializeDI(): void {
  if (isInitialized) {
    logger.warn('DI system already initialized, skipping...');
    return;
  }

  try {
    logger.info('Initializing Dependency Injection system...');

    // Initialiser le registre de services
    initializeServiceRegistry();

    // Initialiser le système d'événements
    initializeEventSystem();

    isInitialized = true;
    logger.info('Dependency Injection system initialized successfully');
  } catch (error: any) {
    logger.error({ error }, 'Failed to initialize DI system');
    throw error;
  }
}

/**
 * Vérifier si le système DI est initialisé
 */
export function isDIInitialized(): boolean {
  return isInitialized;
}

