/**
 * Tests unitaires pour EventBus
 * 
 * Teste le système d'événements (Observer Pattern)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus, eventBus } from '@/lib/events/EventBus';
import { logger } from '@/lib/logger';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('lib/events/EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    // Obtenir une nouvelle instance pour chaque test
    bus = EventBus.getInstance();
    bus.removeAllListeners();
    // Réinitialiser maxListeners à sa valeur par défaut
    bus.setMaxListeners(100);
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('devrait retourner la même instance (singleton)', () => {
      const instance1 = EventBus.getInstance();
      const instance2 = EventBus.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('on', () => {
    it('devrait enregistrer un listener et retourner une fonction unsubscribe', () => {
      const callback = vi.fn();
      const unsubscribe = bus.on('test-event', callback);

      expect(bus.listenerCount('test-event')).toBe(1);
      expect(typeof unsubscribe).toBe('function');
    });

    it('devrait appeler le callback quand l\'événement est émis', async () => {
      const callback = vi.fn();
      bus.on('test-event', callback);

      await bus.emit('test-event', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('devrait permettre de se désabonner', async () => {
      const callback = vi.fn();
      const unsubscribe = bus.on('test-event', callback);

      unsubscribe();
      await bus.emit('test-event', { data: 'test' });

      expect(callback).not.toHaveBeenCalled();
      expect(bus.listenerCount('test-event')).toBe(0);
    });

    it('devrait supprimer l\'événement si plus de listeners', () => {
      const callback = vi.fn();
      const unsubscribe = bus.on('test-event', callback);

      expect(bus.eventNames()).toContain('test-event');

      unsubscribe();

      expect(bus.eventNames()).not.toContain('test-event');
    });

    it('devrait insérer les listeners selon la priorité (ordre décroissant)', async () => {
      const calls: number[] = [];
      bus.on('test-event', () => { calls.push(1); }, 1);
      bus.on('test-event', () => { calls.push(2); }, 3);
      bus.on('test-event', () => { calls.push(3); }, 2);

      await bus.emit('test-event');

      // Priorité 3 en premier, puis 2, puis 1
      expect(calls).toEqual([2, 3, 1]);
    });

    it('devrait insérer un listener avec splice si la priorité est plus élevée', async () => {
      const calls: number[] = [];
      bus.on('test-event', () => { calls.push(1); }, 1);
      bus.on('test-event', () => { calls.push(2); }, 0); // Priorité plus basse

      // Ajouter un listener avec priorité 2 (entre 1 et 0)
      bus.on('test-event', () => { calls.push(3); }, 2);

      await bus.emit('test-event');

      // Ordre: 3 (priorité 2), 1 (priorité 1), 2 (priorité 0)
      expect(calls).toEqual([3, 1, 2]);
    });

    it('devrait logger un warning si maxListeners est atteint', () => {
      bus.setMaxListeners(2);

      bus.on('test-event', vi.fn());
      bus.on('test-event', vi.fn());
      bus.on('test-event', vi.fn()); // Dépassement

      expect(logger.warn).toHaveBeenCalled();
      const lastCall = vi.mocked(logger.warn).mock.calls[vi.mocked(logger.warn).mock.calls.length - 1];
      // Le warning est vérifié AVANT d'ajouter le listener, donc currentListeners = 2
      expect(lastCall?.[0]).toMatchObject({
        event: 'test-event',
        maxListeners: 2,
        currentListeners: 2,
      });   
      expect(lastCall?.[1]).toContain('[EventBus] Maximum listeners reached for event');
    });
  });

  describe('once', () => {
    it('devrait enregistrer un listener qui ne s\'exécute qu\'une fois', async () => {
      const callback = vi.fn();
      bus.once('test-event', callback);

      await bus.emit('test-event');
      await bus.emit('test-event');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('devrait supprimer le listener après la première exécution', async () => {
      const callback = vi.fn();
      bus.once('test-event', callback);

      expect(bus.listenerCount('test-event')).toBe(1);

      await bus.emit('test-event');

      expect(bus.listenerCount('test-event')).toBe(0);
    });

    it('devrait respecter la priorité pour les listeners once', async () => {
      const calls: number[] = [];
      bus.once('test-event', () => { calls.push(1); }, 2);
      bus.once('test-event', () => { calls.push(2); }, 1);

      await bus.emit('test-event');

      expect(calls).toEqual([1, 2]);
    });

    it('devrait permettre de se désabonner avant l\'exécution', async () => {
      const callback = vi.fn();
      const unsubscribe = bus.once('test-event', callback);

      unsubscribe();
      await bus.emit('test-event');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('devrait appeler tous les listeners', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      bus.on('test-event', callback1);
      bus.on('test-event', callback2);

      await bus.emit('test-event', { data: 'test' });

      expect(callback1).toHaveBeenCalledWith({ data: 'test' });
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('devrait retourner immédiatement si aucun listener', async () => {
      await expect(bus.emit('non-existent-event')).resolves.toBeUndefined();
    });

    it('devrait attendre les Promises retournées par les callbacks', async () => {
      let resolved = false;
      const callback = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        resolved = true;
      };

      bus.on('test-event', callback);

      const emitPromise = bus.emit('test-event');
      expect(resolved).toBe(false);

      await emitPromise;
      expect(resolved).toBe(true);
    });

    it('devrait gérer les erreurs dans les listeners sans arrêter les autres', async () => {
      const callback1 = vi.fn(() => {
        throw new Error('Error in callback1');
      });
      const callback2 = vi.fn();

      bus.on('test-event', callback1);
      bus.on('test-event', callback2);

      await bus.emit('test-event');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });

    it('devrait nettoyer les événements sans listeners après emit', async () => {
      bus.once('test-event', vi.fn());

      expect(bus.eventNames()).toContain('test-event');

      await bus.emit('test-event');

      expect(bus.eventNames()).not.toContain('test-event');
    });

    it('devrait utiliser une copie des listeners pour éviter les modifications pendant l\'itération', async () => {
      const calls: number[] = [];
      bus.on('test-event', () => {
        calls.push(1);
        // Ajouter un listener pendant l'émission
        bus.on('test-event', () => { calls.push(2); });
      });

      await bus.emit('test-event');

      // Seul le premier listener devrait être appelé
      expect(calls).toEqual([1]);
    });
  });

  describe('emitSync', () => {
    it('devrait appeler les listeners de manière synchrone', () => {
      const callback = vi.fn();
      bus.on('test-event', callback);

      bus.emitSync('test-event', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('devrait ne pas attendre les Promises', () => {
      let resolved = false;
      const callback = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        resolved = true;
      };

      bus.on('test-event', callback);

      bus.emitSync('test-event');
      // resolved devrait toujours être false car on n'attend pas
      expect(resolved).toBe(false);
    });

    it('devrait supprimer les listeners once après exécution', () => {
      const callback = vi.fn();
      bus.once('test-event', callback);

      bus.emitSync('test-event');
      bus.emitSync('test-event');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('devrait gérer les erreurs dans les listeners', () => {
      const callback = vi.fn(() => {
        throw new Error('Error');
      });

      bus.on('test-event', callback);

      expect(() => bus.emitSync('test-event')).not.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });

    it('devrait nettoyer les événements sans listeners', () => {
      bus.once('test-event', vi.fn());

      bus.emitSync('test-event');

      expect(bus.eventNames()).not.toContain('test-event');
    });
  });

  describe('off', () => {
    it('devrait supprimer tous les listeners d\'un événement', () => {
      bus.on('test-event', vi.fn());
      bus.on('test-event', vi.fn());

      expect(bus.listenerCount('test-event')).toBe(2);

      bus.off('test-event');

      expect(bus.listenerCount('test-event')).toBe(0);
      expect(bus.eventNames()).not.toContain('test-event');
    });

    it('devrait ne rien faire si l\'événement n\'existe pas', () => {
      expect(() => bus.off('non-existent-event')).not.toThrow();
    });
  });

  describe('removeAllListeners', () => {
    it('devrait supprimer tous les listeners de tous les événements', () => {
      bus.on('event1', vi.fn());
      bus.on('event2', vi.fn());
      bus.on('event3', vi.fn());

      expect(bus.eventNames().length).toBeGreaterThan(0);

      bus.removeAllListeners();

      expect(bus.eventNames().length).toBe(0);
    });
  });

  describe('listenerCount', () => {
    it('devrait retourner le nombre de listeners pour un événement', () => {
      expect(bus.listenerCount('test-event')).toBe(0);

      bus.on('test-event', vi.fn());
      expect(bus.listenerCount('test-event')).toBe(1);

      bus.on('test-event', vi.fn());
      expect(bus.listenerCount('test-event')).toBe(2);
    });

    it('devrait retourner 0 pour un événement inexistant', () => {
      expect(bus.listenerCount('non-existent-event')).toBe(0);
    });
  });

  describe('eventNames', () => {
    it('devrait retourner la liste des événements avec des listeners', () => {
      bus.on('event1', vi.fn());
      bus.on('event2', vi.fn());

      const names = bus.eventNames();
      expect(names).toContain('event1');
      expect(names).toContain('event2');
    });

    it('devrait retourner un tableau vide si aucun listener', () => {
      expect(bus.eventNames()).toEqual([]);
    });
  });

  describe('setMaxListeners / getMaxListeners', () => {
    it('devrait définir et récupérer le nombre maximum de listeners', () => {
      expect(bus.getMaxListeners()).toBe(100);

      bus.setMaxListeners(50);
      expect(bus.getMaxListeners()).toBe(50);
    });

    it('devrait utiliser la nouvelle limite pour les warnings', () => {
      bus.setMaxListeners(2);

      bus.on('test-event', vi.fn());
      bus.on('test-event', vi.fn());
      bus.on('test-event', vi.fn()); // Dépassement

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          maxListeners: 2,
        }),
        expect.any(String),
      );
    });
  });

  describe('eventBus (instance singleton exportée)', () => {
    it('devrait être une instance de EventBus', () => {
      expect(eventBus).toBeInstanceOf(EventBus);
    });

    it('devrait être la même instance que getInstance()', () => {
      expect(eventBus).toBe(EventBus.getInstance());
    });
  });
});
