/**
 * Service Container - Dependency Injection Pattern
 * 
 * Conteneur pour gérer l'injection de dépendances et l'inversion de contrôle
 */

import { logger } from '@/lib/logger';

type ServiceFactory<T = any> = () => T;
type ServiceKey = string | symbol;

/**
 * ServiceContainer - Conteneur pour l'injection de dépendances
 */
export class ServiceContainer {
  private services = new Map<ServiceKey, ServiceFactory>();
  private singletons = new Map<ServiceKey, any>();
  private isResolving = new Set<ServiceKey>();

  /**
   * Enregistrer un service avec une factory
   */
  register<T>(key: ServiceKey, factory: ServiceFactory<T>, singleton: boolean = true): void {
    if (this.services.has(key)) {
      logger.warn({ key: String(key) }, `Service ${String(key)} is already registered, overwriting...`);
    }

    if (singleton) {
      // Pour les singletons, wrapper la factory pour mettre en cache
      this.services.set(key, () => {
        if (this.singletons.has(key)) {
          return this.singletons.get(key);
        }

        // Détecter les dépendances circulaires
        if (this.isResolving.has(key)) {
          throw new Error(`Circular dependency detected for service: ${String(key)}`);
        }

        this.isResolving.add(key);
        try {
          const instance = factory();
          this.singletons.set(key, instance);
          return instance;
        } finally {
          this.isResolving.delete(key);
        }
      });
    } else {
      // Pour les services non-singleton, utiliser la factory directement
      this.services.set(key, factory);
    }

    logger.debug({ key: String(key), singleton }, `Service registered: ${String(key)}`);
  }

  /**
   * Résoudre un service
   */
  resolve<T>(key: ServiceKey): T {
    const factory = this.services.get(key);
    
    if (!factory) {
      throw new Error(`Service ${String(key)} not found. Make sure it's registered.`);
    }

    try {
      return factory() as T;
    } catch (error: any) {
      logger.error({ key: String(key), error: error.message }, `Failed to resolve service: ${String(key)}`);
      throw error;
    }
  }

  /**
   * Vérifier si un service est enregistré
   */
  has(key: ServiceKey): boolean {
    return this.services.has(key);
  }

  /**
   * Enregistrer une instance directement (pour les tests)
   */
  registerInstance<T>(key: ServiceKey, instance: T): void {
    this.singletons.set(key, instance);
    this.services.set(key, () => instance);
    logger.debug({ key: String(key) }, `Service instance registered: ${String(key)}`);
  }

  /**
   * Réinitialiser le conteneur (utile pour les tests)
   */
  reset(): void {
    this.services.clear();
    this.singletons.clear();
    this.isResolving.clear();
    logger.info('Service container reset');
  }

  /**
   * Obtenir tous les services enregistrés
   */
  getRegisteredServices(): ServiceKey[] {
    return Array.from(this.services.keys());
  }
}

/**
 * Conteneur singleton global
 */
export const serviceContainer = new ServiceContainer();

/**
 * Décorator pour injecter des dépendances automatiquement
 * Note: Cette implémentation nécessiterait des métadonnées de réflexion (reflect-metadata)
 * Pour l'instant, on utilise l'injection manuelle via le constructeur
 */
export function Inject(_key: ServiceKey) {
  return function (_target: any, _propertyKey: string | symbol | undefined, _parameterIndex: number) {
    // Placeholder pour future implémentation avec reflect-metadata
  };
}

/**
 * Helper pour créer un service avec injection de dépendances
 */
export function createService<T>(
  ServiceClass: new (...args: any[]) => T,
  dependencies: ServiceKey[],
): T {
  const resolvedDependencies = dependencies.map(key => serviceContainer.resolve(key));
  return new ServiceClass(...resolvedDependencies);
}

