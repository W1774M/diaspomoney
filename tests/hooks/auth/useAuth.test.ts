/**
 * Tests unitaires pour useAuth
 * 
 * Implémente les tests pour :
 * - Récupération de l'utilisateur authentifié
 * - Cache partagé
 * - Gestion des états
 * - Vérification des rôles
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/auth/useAuth';
import { ROLES, USER_STATUSES } from '@/lib/constants';

// Mock de fetch global
global.fetch = vi.fn();

// Mock de auth-cache
vi.mock('@/lib/auth/auth-cache', () => ({
  getCachedAuth: vi.fn(),
  getAuthPromise: vi.fn(),
  setAuthPromise: vi.fn(),
  setCachedAuth: vi.fn(),
  clearAuthCache: vi.fn(),
}));

// Mock de useSignOut
vi.mock('@/hooks/auth/useSignOut', () => ({
  useSignOut: vi.fn(() => ({
    signOut: vi.fn(),
    isSigningOut: false,
  })),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simuler l'environnement client
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devrait récupérer l\'utilisateur depuis le cache partagé', async () => {
    const { getCachedAuth } = await import('@/lib/auth/auth-cache');
    const mockCachedUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      roles: [ROLES.CUSTOMER],
      status: USER_STATUSES.ACTIVE,
      avatar: { image: '', name: 'Test User' },
      oauth: {},
      phone: '',
      company: '',
      address: '',
    };

    vi.mocked(getCachedAuth).mockReturnValue({ user: mockCachedUser, timestamp: Date.now() });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual({
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      roles: [ROLES.CUSTOMER],
      status: USER_STATUSES.ACTIVE,
      avatar: { image: '', name: 'Test User' },
      oauth: {},
      phone: '',
      company: '',
      address: '',
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('devrait récupérer l\'utilisateur depuis une requête en cours (promise partagée)', async () => {
    const { getCachedAuth, getAuthPromise } = await import('@/lib/auth/auth-cache');
    vi.mocked(getCachedAuth).mockReturnValue(null);
    
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      roles: [ROLES.CUSTOMER],
      status: USER_STATUSES.ACTIVE,
    };

    const mockPromise = Promise.resolve({ user: mockUser });
    vi.mocked(getAuthPromise).mockReturnValue(mockPromise);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('devrait récupérer l\'utilisateur via fetch /api/users/me', async () => {
    const { getCachedAuth, getAuthPromise, setAuthPromise, setCachedAuth } = await import('@/lib/auth/auth-cache');
    vi.mocked(getCachedAuth).mockReturnValue(null);
    vi.mocked(getAuthPromise).mockReturnValue(null);

    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      roles: [ROLES.CUSTOMER],
      status: USER_STATUSES.ACTIVE,
      avatar: { image: '', name: 'Test User' },
      oauth: {},
      phone: '',
      company: '',
      address: '',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    } as Response);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });

    expect(fetch).toHaveBeenCalledWith('/api/users/me', {
      cache: 'no-store',
      signal: expect.any(AbortSignal),
    });
    expect(setCachedAuth).toHaveBeenCalledWith(mockUser);
    expect(setAuthPromise).toHaveBeenCalled();
    expect(result.current.user).toBeDefined();
  });

  it('devrait gérer le timeout (5 secondes)', async () => {
    const { getCachedAuth, getAuthPromise } = await import('@/lib/auth/auth-cache');
    vi.mocked(getCachedAuth).mockReturnValue(null);
    vi.mocked(getAuthPromise).mockReturnValue(null);

    // Simuler un timeout
    vi.mocked(fetch).mockImplementationOnce(() => {
      return new Promise((_resolve, reject) => {
        setTimeout(() => {
          const error = new Error('AbortError');
          error.name = 'AbortError';
          reject(error);
        }, 100);
      });
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('devrait gérer les erreurs 401', async () => {
    const { getCachedAuth, getAuthPromise } = await import('@/lib/auth/auth-cache');
    vi.mocked(getCachedAuth).mockReturnValue(null);
    vi.mocked(getAuthPromise).mockReturnValue(null);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('devrait gérer les erreurs réseau', async () => {
    const { getCachedAuth, getAuthPromise } = await import('@/lib/auth/auth-cache');
    vi.mocked(getCachedAuth).mockReturnValue(null);
    vi.mocked(getAuthPromise).mockReturnValue(null);

    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('devrait gérer les états de chargement (isLoading)', async () => {
    const { getCachedAuth, getAuthPromise } = await import('@/lib/auth/auth-cache');
    vi.mocked(getCachedAuth).mockReturnValue(null);
    vi.mocked(getAuthPromise).mockReturnValue(null);

    vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {})); // Jamais résolu

    const { result } = renderHook(() => useAuth());

    // Au début, isLoading devrait être true
    expect(result.current.isLoading).toBe(true);
  });

  it('devrait gérer l\'état d\'authentification (isAuthenticated)', async () => {
    const { getCachedAuth } = await import('@/lib/auth/auth-cache');
    const mockCachedUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      roles: [ROLES.CUSTOMER],
      status: USER_STATUSES.ACTIVE,
      avatar: { image: '', name: 'Test User' },
      oauth: {},
      phone: '',
      company: '',
      address: '',
    };

    vi.mocked(getCachedAuth).mockReturnValue({ user: mockCachedUser, timestamp: Date.now() });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.status).toBe('authenticated');
  });

  it('devrait vérifier les rôles (isAdmin, isProvider, isCSM, isCustomer)', async () => {
    const { getCachedAuth } = await import('@/lib/auth/auth-cache');
    const mockCachedUser = {
      id: 'user123',
      email: 'admin@example.com',
      name: 'Admin User',
      roles: [ROLES.ADMIN, ROLES.PROVIDER],
      status: USER_STATUSES.ACTIVE,
      avatar: { image: '', name: 'Admin User' },
      oauth: {},
      phone: '',
      company: '',
      address: '',
    };

    vi.mocked(getCachedAuth).mockReturnValue({ user: mockCachedUser, timestamp: Date.now() });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin()).toBe(true);
    expect(result.current.isProvider()).toBe(true);
    expect(result.current.isCustomer()).toBe(false);
  });

  it('devrait exécuter refreshAuth avec succès', async () => {
    const { getCachedAuth } = await import('@/lib/auth/auth-cache');
    vi.mocked(getCachedAuth).mockReturnValue(null);

    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      roles: [ROLES.CUSTOMER],
      status: USER_STATUSES.ACTIVE,
      avatar: { image: '', name: 'Test User' },
      oauth: {},
      phone: '',
      company: '',
      address: '',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    } as Response);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Appeler refreshAuth
    await result.current.refreshAuth();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith('/api/users/me', { cache: 'no-store' });
  });

  it('devrait gérer le statut utilisateur INACTIVE', async () => {
    const { getCachedAuth } = await import('@/lib/auth/auth-cache');
    const mockCachedUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      roles: [ROLES.CUSTOMER],
      status: USER_STATUSES.INACTIVE,
      avatar: { image: '', name: 'Test User' },
      oauth: {},
      phone: '',
      company: '',
      address: '',
    };

    vi.mocked(getCachedAuth).mockReturnValue({ user: mockCachedUser, timestamp: Date.now() });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.status).toBe('unauthenticated');
  });

  it('devrait gérer les données OAuth', async () => {
    const { getCachedAuth } = await import('@/lib/auth/auth-cache');
    const mockCachedUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      roles: [ROLES.CUSTOMER],
      status: USER_STATUSES.ACTIVE,
      avatar: { image: '', name: 'Test User' },
      oauth: {
        google: { linked: true, providerAccountId: 'google123' },
        facebook: { linked: true, providerAccountId: 'facebook123' },
      },
      phone: '',
      company: '',
      address: '',
    };

    vi.mocked(getCachedAuth).mockReturnValue({ user: mockCachedUser, timestamp: Date.now() });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user?.oauth).toEqual({
      google: { linked: true, providerAccountId: 'google123' },
      facebook: { linked: true, providerAccountId: 'facebook123' },
    });
  });

  it('devrait prévenir les appels multiples (didFetchRef)', async () => {
    const { getCachedAuth, getAuthPromise } = await import('@/lib/auth/auth-cache');
    vi.mocked(getCachedAuth).mockReturnValue(null);
    vi.mocked(getAuthPromise).mockReturnValue(null);

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 'user123' } }),
    } as Response);

    const { result, rerender } = renderHook(() => useAuth());

    // Attendre le premier chargement
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstCallCount = vi.mocked(fetch).mock.calls.length;

    // Re-render ne devrait pas déclencher un nouvel appel
    rerender();

    await waitFor(() => {
      // Le nombre d'appels ne devrait pas augmenter
      expect(vi.mocked(fetch).mock.calls.length).toBe(firstCallCount);
    });
  });
});

