/**
 * Tests unitaires pour useUser
 * 
 * Implémente les tests pour :
 * - Récupération d'un utilisateur par ID
 * - Gestion des erreurs
 * - Conversion des dates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUser } from '@/hooks/users/useUser';

// Mock de fetch global
global.fetch = vi.fn();

describe('useUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer un utilisateur avec succès', async () => {
    const mockUser = {
      _id: 'user123',
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: mockUser,
      }),
    } as Response);

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await result.current.fetchUser('user123');
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.user?.id).toBe('user123');
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('devrait gérer les erreurs 404 (utilisateur non trouvé)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await result.current.fetchUser('nonexistent');
    });

    expect(result.current.error).toBe('Utilisateur non trouvé');
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('devrait gérer les erreurs API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await result.current.fetchUser('user123');
    });

    expect(result.current.error).toBe("Erreur lors de la récupération de l'utilisateur");
    expect(result.current.user).toBeNull();
  });

  it('devrait convertir les dates string en Date objects', async () => {
    const mockUser = {
      _id: 'user123',
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: mockUser,
      }),
    } as Response);

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await result.current.fetchUser('user123');
    });

    expect(result.current.user?.createdAt).toBeInstanceOf(Date);
    expect(result.current.user?.updatedAt).toBeInstanceOf(Date);
  });

  it('devrait gérer les états de chargement (loading)', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(fetch).mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useUser());

    act(() => {
      result.current.fetchUser('user123');
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: 'user123' },
        }),
      });
      await promise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('devrait gérer les erreurs (error)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Erreur serveur',
      }),
    } as Response);

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await result.current.fetchUser('user123');
    });

    expect(result.current.error).toBe('Erreur serveur');
    expect(result.current.user).toBeNull();
  });

  it('devrait appeler fetchUser avec le bon userId', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: { id: 'user123' },
      }),
    } as Response);

    const { result } = renderHook(() => useUser());

    await act(async () => {
      await result.current.fetchUser('user123');
    });

    expect(fetch).toHaveBeenCalledWith('/api/users/user123');
  });
});

