/**
 * Tests unitaires pour useUserEdit
 * 
 * Implémente les tests pour :
 * - Modification d'un utilisateur
 * - Gestion des erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUserEdit } from '@/hooks/users/useUserEdit';

// Mock de fetch global
global.fetch = vi.fn();

describe('useUserEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait modifier un utilisateur avec succès', async () => {
    const mockUpdatedUser = {
      id: 'user123',
      email: 'updated@example.com',
      name: 'Updated User',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: mockUpdatedUser,
      }),
    } as Response);

    const { result } = renderHook(() => useUserEdit());

    await act(async () => {
      const updatedUser = await result.current.updateUser('user123', {
        email: 'updated@example.com',
        name: 'Updated User',
      });

      expect(updatedUser).toEqual(mockUpdatedUser);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('devrait gérer les erreurs API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Email invalide',
      }),
    } as Response);

    const { result } = renderHook(() => useUserEdit());

    await act(async () => {
      try {
        await result.current.updateUser('user123', {
          email: 'invalid-email',
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.error).toBe('Email invalide');
  });

  it('devrait gérer les erreurs réseau', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useUserEdit());

    await act(async () => {
      try {
        await result.current.updateUser('user123', {
          email: 'test@example.com',
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.error).toBe('Network error');
  });

  it('devrait gérer les états de chargement (loading)', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(fetch).mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useUserEdit());

    act(() => {
      result.current.updateUser('user123', {
        email: 'test@example.com',
      });
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

  it('devrait retourner l\'utilisateur mis à jour', async () => {
    const mockUpdatedUser = {
      id: 'user123',
      email: 'updated@example.com',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: mockUpdatedUser,
      }),
    } as Response);

    const { result } = renderHook(() => useUserEdit());

    await act(async () => {
      const updatedUser = await result.current.updateUser('user123', {
        email: 'updated@example.com',
      });

      expect(updatedUser).toEqual(mockUpdatedUser);
    });
  });

  it('devrait appeler fetch avec la bonne URL et méthode', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: { id: 'user123' },
      }),
    } as Response);

    const { result } = renderHook(() => useUserEdit());

    await act(async () => {
      await result.current.updateUser('user123', {
        email: 'test@example.com',
      });
    });

    expect(fetch).toHaveBeenCalledWith('/api/users/user123', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });
  });
});

