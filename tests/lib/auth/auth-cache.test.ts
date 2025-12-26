/**
 * Tests unitaires pour auth-cache
 * 
 * Teste le système de cache partagé pour l'authentification
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCachedAuth,
  setCachedAuth,
  clearAuthCache,
  setAuthPromise,
  getAuthPromise,
} from '@/lib/auth/auth-cache';

describe('lib/auth/auth-cache', () => {
  beforeEach(() => {
    // Réinitialiser le cache avant chaque test
    clearAuthCache();
    // Réinitialiser Date.now pour contrôler le temps
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getCachedAuth', () => {
    it('devrait retourner null si le cache est vide', () => {
      const result = getCachedAuth();
      expect(result).toBeNull();
    });

    it('devrait retourner le cache si il est valide (moins de 5 secondes)', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      setCachedAuth(mockUser);

      const result = getCachedAuth();
      expect(result).not.toBeNull();
      expect(result?.user).toEqual(mockUser);
      expect(result?.timestamp).toBeDefined();
    });

    it('devrait retourner null si le cache est expiré (plus de 5 secondes)', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      setCachedAuth(mockUser);

      // Avancer le temps de 6 secondes (au-delà de CACHE_DURATION = 5000ms)
      vi.advanceTimersByTime(6000);

      const result = getCachedAuth();
      expect(result).toBeNull();
    });

    it('devrait retourner le cache si il est juste à la limite (5 secondes exactement)', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      setCachedAuth(mockUser);

      // Avancer le temps de 4999ms (juste avant l'expiration)
      vi.advanceTimersByTime(4999);

      const result = getCachedAuth();
      expect(result).not.toBeNull();
      expect(result?.user).toEqual(mockUser);
    });
  });

  describe('setCachedAuth', () => {
    it('devrait définir le cache avec un utilisateur', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      setCachedAuth(mockUser);

      const result = getCachedAuth();
      expect(result).not.toBeNull();
      expect(result?.user).toEqual(mockUser);
      expect(result?.timestamp).toBeDefined();
      expect(result?.promise).toBeUndefined();
    });

    it('devrait remplacer le cache existant', () => {
      const mockUser1 = { id: 'user1', email: 'user1@example.com' };
      const mockUser2 = { id: 'user2', email: 'user2@example.com' };

      setCachedAuth(mockUser1);
      setCachedAuth(mockUser2);

      const result = getCachedAuth();
      expect(result?.user).toEqual(mockUser2);
      expect(result?.user).not.toEqual(mockUser1);
    });

    it('devrait mettre à jour le timestamp lors du remplacement', () => {
      const mockUser1 = { id: 'user1', email: 'user1@example.com' };
      const mockUser2 = { id: 'user2', email: 'user2@example.com' };

      setCachedAuth(mockUser1);
      const timestamp1 = getCachedAuth()?.timestamp;

      // Avancer le temps de 1 seconde
      vi.advanceTimersByTime(1000);

      setCachedAuth(mockUser2);
      const timestamp2 = getCachedAuth()?.timestamp;

      expect(timestamp2).toBeGreaterThan(timestamp1!);
    });
  });

  describe('clearAuthCache', () => {
    it('devrait vider le cache', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      setCachedAuth(mockUser);

      expect(getCachedAuth()).not.toBeNull();

      clearAuthCache();

      expect(getCachedAuth()).toBeNull();
    });

    it('devrait vider le cache même s\'il contient une promesse', async () => {
      const mockPromise = Promise.resolve({ user: { id: 'user123' } });
      setAuthPromise(mockPromise);

      expect(getAuthPromise()).not.toBeNull();

      clearAuthCache();

      expect(getCachedAuth()).toBeNull();
      expect(getAuthPromise()).toBeNull();
    });
  });

  describe('setAuthPromise', () => {
    it('devrait créer un nouveau cache si aucun cache n\'existe', () => {
      const mockPromise = Promise.resolve({ user: { id: 'user123' } });
      setAuthPromise(mockPromise);

      const cached = getCachedAuth();
      expect(cached).not.toBeNull();
      expect(cached?.promise).toBe(mockPromise);
      expect(cached?.user).toBeNull();
    });

    it('devrait mettre à jour le cache existant avec la promesse', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      setCachedAuth(mockUser);

      const initialTimestamp = getCachedAuth()?.timestamp;
      const mockPromise = Promise.resolve({ user: mockUser });

      // Avancer le temps de 1 seconde
      vi.advanceTimersByTime(1000);

      setAuthPromise(mockPromise);

      const cached = getCachedAuth();
      expect(cached?.promise).toBe(mockPromise);
      expect(cached?.user).toEqual(mockUser);
      // Le timestamp devrait être mis à jour
      expect(cached?.timestamp).toBeGreaterThan(initialTimestamp!);
    });

    it('devrait mettre à jour le timestamp pour éviter la réutilisation d\'une promesse expirée', () => {
      const mockPromise1 = Promise.resolve({ user: { id: 'user1' } });
      setAuthPromise(mockPromise1);

      const timestamp1 = getCachedAuth()?.timestamp;

      // Avancer le temps de 2 secondes
      vi.advanceTimersByTime(2000);

      const mockPromise2 = Promise.resolve({ user: { id: 'user2' } });
      setAuthPromise(mockPromise2);

      const timestamp2 = getCachedAuth()?.timestamp;
      expect(timestamp2).toBeGreaterThan(timestamp1!);
    });
  });

  describe('getAuthPromise', () => {
    it('devrait retourner null si aucun cache n\'existe', () => {
      const result = getAuthPromise();
      expect(result).toBeNull();
    });

    it('devrait retourner null si le cache n\'a pas de promesse', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      setCachedAuth(mockUser);

      const result = getAuthPromise();
      expect(result).toBeNull();
    });

    it('devrait retourner la promesse si elle existe et est valide', () => {
      const mockPromise = Promise.resolve({ user: { id: 'user123' } });
      setAuthPromise(mockPromise);

      const result = getAuthPromise();
      expect(result).toBe(mockPromise);
    });

    it('devrait retourner null si la promesse est expirée (plus de 5 secondes)', () => {
      const mockPromise = Promise.resolve({ user: { id: 'user123' } });
      setAuthPromise(mockPromise);

      // Avancer le temps de 6 secondes (au-delà de CACHE_DURATION = 5000ms)
      vi.advanceTimersByTime(6000);

      const result = getAuthPromise();
      expect(result).toBeNull();
      // Le cache devrait être vidé
      expect(getCachedAuth()).toBeNull();
    });

    it('devrait retourner la promesse si elle est juste à la limite (moins de 5 secondes)', () => {
      const mockPromise = Promise.resolve({ user: { id: 'user123' } });
      setAuthPromise(mockPromise);

      // Avancer le temps de 4999ms (juste avant l'expiration)
      vi.advanceTimersByTime(4999);

      const result = getAuthPromise();
      expect(result).toBe(mockPromise);
    });

    it('devrait vider le cache si la promesse est expirée', () => {
      const mockPromise = Promise.resolve({ user: { id: 'user123' } });
      setAuthPromise(mockPromise);

      expect(getCachedAuth()).not.toBeNull();

      // Avancer le temps de 6 secondes
      vi.advanceTimersByTime(6000);

      getAuthPromise(); // Appeler pour déclencher le nettoyage

      expect(getCachedAuth()).toBeNull();
    });
  });

  describe('Intégration', () => {
    it('devrait gérer un cycle complet: set -> get -> expire -> clear', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      // 1. Définir le cache
      setCachedAuth(mockUser);
      expect(getCachedAuth()?.user).toEqual(mockUser);

      // 2. Vérifier que le cache est valide
      vi.advanceTimersByTime(2000);
      expect(getCachedAuth()?.user).toEqual(mockUser);

      // 3. Faire expirer le cache
      vi.advanceTimersByTime(4000); // Total: 6 secondes
      expect(getCachedAuth()).toBeNull();

      // 4. Vider le cache
      clearAuthCache();
      expect(getCachedAuth()).toBeNull();
    });

    it('devrait gérer une promesse puis remplacer par un utilisateur', async () => {
      const mockPromise = Promise.resolve({ user: { id: 'user123' } });
      setAuthPromise(mockPromise);

      expect(getAuthPromise()).toBe(mockPromise);
      expect(getCachedAuth()?.user).toBeNull();

      // Remplacer par un utilisateur (setCachedAuth remplace complètement le cache)
      const mockUser = { id: 'user123', email: 'test@example.com' };
      setCachedAuth(mockUser);

      expect(getCachedAuth()?.user).toEqual(mockUser);
      // La promesse est perdue car setCachedAuth remplace le cache
      expect(getCachedAuth()?.promise).toBeUndefined();
    });

    it('devrait mettre à jour le timestamp lors de setAuthPromise sur un cache existant', () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      setCachedAuth(mockUser);

      const timestamp1 = getCachedAuth()?.timestamp;
      expect(timestamp1).toBeDefined();

      // Avancer le temps
      vi.advanceTimersByTime(3000);

      const mockPromise = Promise.resolve({ user: mockUser });
      setAuthPromise(mockPromise);

      const timestamp2 = getCachedAuth()?.timestamp;
      // Le timestamp devrait être mis à jour (plus récent que timestamp1)
      expect(timestamp2).toBeDefined();
      expect(timestamp2).toBeGreaterThanOrEqual(timestamp1!);
    });
  });
});
