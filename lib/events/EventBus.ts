/**
 * EventBus - Implémentation de l'Observer Pattern
 * Système d'événements pour découpler les composants
 */

import { logger } from '@/lib/logger';

export type EventCallback<T = any> = (data: T) => void | Promise<void>;
export type EventUnsubscribe = () => void;

export interface EventListener {
  callback: EventCallback;
  once?: boolean;
  priority?: number;
}

/**
 * EventBus - Bus d'événements global
 * Permet la communication découplée entre composants
 */
export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, EventListener[]> = new Map();
  private maxListeners: number = 100;

  private constructor() {
    // Singleton
  }

  /**
   * Obtenir l'instance singleton
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Écouter un événement
   * @param event Nom de l'événement
   * @param callback Fonction à appeler quand l'événement est émis
   * @param priority Priorité (plus élevé = appelé en premier, défaut: 0)
   * @returns Fonction pour se désabonner
   */
  on<T = any>(
    event: string,
    callback: EventCallback<T>,
    priority: number = 0
  ): EventUnsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listeners = this.listeners.get(event)!;
    
    // Vérifier la limite
    if (listeners.length >= this.maxListeners) {
      logger.warn({
        event,
        maxListeners: this.maxListeners,
        currentListeners: listeners.length,
      }, `[EventBus] Maximum listeners reached for event`);
    }

    const listener: EventListener = {
      callback: callback as EventCallback,
      priority,
    };

    // Insérer selon la priorité (ordre décroissant)
    const insertIndex = listeners.findIndex(l => l.priority! < priority);
    if (insertIndex === -1) {
      listeners.push(listener);
    } else {
      listeners.splice(insertIndex, 0, listener);
    }

    // Retourner la fonction de désabonnement
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Écouter un événement une seule fois
   * @param event Nom de l'événement
   * @param callback Fonction à appeler
   * @param priority Priorité
   * @returns Fonction pour se désabonner
   */
  once<T = any>(
    event: string,
    callback: EventCallback<T>,
    priority: number = 0
  ): EventUnsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listeners = this.listeners.get(event)!;
    const listener: EventListener = {
      callback: callback as EventCallback,
      once: true,
      priority,
    };

    const insertIndex = listeners.findIndex(l => l.priority! < priority);
    if (insertIndex === -1) {
      listeners.push(listener);
    } else {
      listeners.splice(insertIndex, 0, listener);
    }

    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Émettre un événement
   * @param event Nom de l'événement
   * @param data Données à passer aux listeners
   * @returns Promise qui se résout quand tous les listeners ont été appelés
   */
  async emit<T = any>(event: string, data?: T): Promise<void> {
    const listeners = this.listeners.get(event);
    if (!listeners || listeners.length === 0) {
      return;
    }

    // Créer une copie pour éviter les modifications pendant l'itération
    const listenersToCall = [...listeners];

    // Appeler les listeners dans l'ordre de priorité
    const promises: Promise<void>[] = [];

    for (const listener of listenersToCall) {
      try {
        const result = listener.callback(data);
        
        // Si le callback retourne une Promise, l'attendre
        if (result instanceof Promise) {
          promises.push(result);
        }

        // Si c'est un listener "once", le supprimer
        if (listener.once) {
          const index = listeners.indexOf(listener);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        }
      } catch (error) {
        logger.error({ error, event }, `[EventBus] Error in listener for event`);
        // Continuer avec les autres listeners même en cas d'erreur
      }
    }

    // Nettoyer les événements sans listeners
    if (listeners.length === 0) {
      this.listeners.delete(event);
    }

    // Attendre que toutes les Promises se résolvent
    await Promise.allSettled(promises);
  }

  /**
   * Émettre un événement de manière synchrone (sans attendre les Promises)
   * @param event Nom de l'événement
   * @param data Données à passer aux listeners
   */
  emitSync<T = any>(event: string, data?: T): void {
    const listeners = this.listeners.get(event);
    if (!listeners || listeners.length === 0) {
      return;
    }

    const listenersToCall = [...listeners];

    for (const listener of listenersToCall) {
      try {
        listener.callback(data);

        // Si c'est un listener "once", le supprimer
        if (listener.once) {
          const index = listeners.indexOf(listener);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        }
      } catch (error) {
        logger.error({ error, event }, `[EventBus] Error in listener for event`);
      }
    }

    // Nettoyer les événements sans listeners
    if (listeners.length === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Supprimer tous les listeners d'un événement
   * @param event Nom de l'événement
   */
  off(event: string): void {
    this.listeners.delete(event);
  }

  /**
   * Supprimer tous les listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Obtenir le nombre de listeners pour un événement
   * @param event Nom de l'événement
   * @returns Nombre de listeners
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.length || 0;
  }

  /**
   * Obtenir la liste des événements qui ont des listeners
   * @returns Tableau des noms d'événements
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Définir le nombre maximum de listeners par événement
   * @param max Nombre maximum
   */
  setMaxListeners(max: number): void {
    this.maxListeners = max;
  }

  /**
   * Obtenir le nombre maximum de listeners
   * @returns Nombre maximum
   */
  getMaxListeners(): number {
    return this.maxListeners;
  }
}

// Export de l'instance singleton
export const eventBus = EventBus.getInstance();

