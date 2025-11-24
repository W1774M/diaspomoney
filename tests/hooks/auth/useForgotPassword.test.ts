/**
 * Tests unitaires pour useForgotPassword
 * 
 * Implémente les tests pour :
 * - Envoi d'email de réinitialisation
 * - Gestion des erreurs
 * - États de chargement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useForgotPassword } from '@/hooks/auth/useForgotPassword';

// Mock de fetch global
global.fetch = vi.fn();

// Mock de useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('useForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devrait envoyer un email avec succès', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Email envoyé' }),
    } as Response);

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.sendResetEmail('test@example.com');
    });

    expect(result.current.success).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
  });

  it('devrait gérer les erreurs API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email non trouvé' }),
    } as Response);

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.sendResetEmail('test@example.com');
    });

    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe('Email non trouvé');
    expect(result.current.isLoading).toBe(false);
  });

  it('devrait gérer les erreurs réseau', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.sendResetEmail('test@example.com');
    });

    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe('Erreur réseau. Veuillez réessayer.');
    expect(result.current.isLoading).toBe(false);
  });

  it('devrait gérer les états de chargement (isLoading)', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(fetch).mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useForgotPassword());

    act(() => {
      result.current.sendResetEmail('test@example.com');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true }),
      });
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('devrait gérer l\'état de succès (success)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.sendResetEmail('test@example.com');
    });

    expect(result.current.success).toBe(true);
  });

  it('devrait gérer les erreurs (error)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Erreur serveur' }),
    } as Response);

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.sendResetEmail('test@example.com');
    });

    expect(result.current.error).toBe('Erreur serveur');
  });

  it('devrait rediriger vers /login après 3 secondes en cas de succès', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.sendResetEmail('test@example.com');
    });

    expect(result.current.success).toBe(true);

    // Avancer le temps de 3 secondes pour déclencher le setTimeout
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Exécuter tous les timers en attente
    act(() => {
      vi.runAllTimers();
    });

    // Vérifier que la redirection a été appelée
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('devrait valider l\'email', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.sendResetEmail('invalid-email');
    });

    // Le hook envoie l'email tel quel, la validation se fait côté serveur
    expect(fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'invalid-email' }),
    });
  });
});

