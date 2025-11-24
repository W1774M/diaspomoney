/**
 * Tests unitaires pour useCreateUser
 * 
 * Implémente les tests pour :
 * - Création d'utilisateur
 * - Transformation name en firstName/lastName
 * - Gestion des erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCreateUser } from '@/hooks/users/useCreateUser';

// Mock de fetch global
global.fetch = vi.fn();

// Mock de logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useCreateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait créer un utilisateur avec succès', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockUser,
      }),
    } as Response);

    const { result } = renderHook(() => useCreateUser());

    await act(async () => {
      const createResult = await result.current.createUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['CUSTOMER'],
        status: 'ACTIVE',
      });

      expect(createResult.success).toBe(true);
      expect(createResult.user).toEqual(mockUser);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('devrait transformer name en firstName/lastName', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { id: 'user123' },
      }),
    } as Response);

    const { result } = renderHook(() => useCreateUser());

    await act(async () => {
      await result.current.createUser({
        email: 'test@example.com',
        name: 'John Doe',
        roles: ['CUSTOMER'],
        status: 'ACTIVE',
      });
    });

    expect(fetch).toHaveBeenCalledWith('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: undefined,
        company: undefined,
        address: undefined,
        roles: ['CUSTOMER'],
        status: 'ACTIVE',
        specialty: undefined,
        preferences: undefined,
      }),
    });
  });

  it('devrait gérer les champs optionnels', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { id: 'user123' },
      }),
    } as Response);

    const { result } = renderHook(() => useCreateUser());

    await act(async () => {
      await result.current.createUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '+33123456789',
        company: 'Test Company',
        address: '123 Test St',
        roles: ['CUSTOMER'],
        status: 'ACTIVE',
        specialty: 'HEALTH',
        recommended: true,
        clientNotes: 'Test notes',
        preferences: {
          language: 'fr',
          timezone: 'Europe/Paris',
          notifications: true,
        },
      });
    });

    const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0]?.[1]?.body as string);
    expect(callBody.phone).toBe('+33123456789');
    expect(callBody.company).toBe('Test Company');
    expect(callBody.recommended).toBe(true);
    expect(callBody.clientNotes).toBe('Test notes');
  });

  it('devrait gérer les erreurs API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Email déjà utilisé',
      }),
    } as Response);

    const { result } = renderHook(() => useCreateUser());

    await act(async () => {
      const createResult = await result.current.createUser({
        email: 'existing@example.com',
        roles: ['CUSTOMER'],
        status: 'ACTIVE',
      });

      expect(createResult.success).toBe(false);
      expect(createResult.error).toBe('Email déjà utilisé');
    });

    expect(result.current.error).toBe('Email déjà utilisé');
  });

  it('devrait gérer les erreurs réseau', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCreateUser());

    await act(async () => {
      const createResult = await result.current.createUser({
        email: 'test@example.com',
        roles: ['CUSTOMER'],
        status: 'ACTIVE',
      });

      expect(createResult.success).toBe(false);
      expect(createResult.error).toBe('Network error');
    });

    expect(result.current.error).toBe('Network error');
  });

  it('devrait gérer les états de chargement (loading)', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(fetch).mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useCreateUser());

    act(() => {
      result.current.createUser({
        email: 'test@example.com',
        roles: ['CUSTOMER'],
        status: 'ACTIVE',
      });
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 'user123' },
        }),
      });
      await promise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('devrait logger avec logger', async () => {
    const { logger } = await import('@/lib/logger');
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useCreateUser());

    await act(async () => {
      await result.current.createUser({
        email: 'test@example.com',
        roles: ['CUSTOMER'],
        status: 'ACTIVE',
      });
    });

    expect(logger.info).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('devrait retourner CreateUserResult', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { id: 'user123' },
      }),
    } as Response);

    const { result } = renderHook(() => useCreateUser());

    await act(async () => {
      const createResult = await result.current.createUser({
        email: 'test@example.com',
        roles: ['CUSTOMER'],
        status: 'ACTIVE',
      });

      expect(createResult).toHaveProperty('success');
      expect(createResult).toHaveProperty('user');
    });
  });
});

