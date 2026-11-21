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
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '@/hooks/auth/useAuth';
import { ROLES, USER_STATUSES } from '@/lib/constants';

// Mock de fetch global
global.fetch = vi.fn();

// Mock de auth-cache - utiliser vi.hoisted() pour éviter les problèmes de hoisting
const {
  mockGetCachedAuth,
  mockGetAuthPromise,
  mockSetAuthPromise,
  mockSetCachedAuth,
  mockClearAuthCache,
} = vi.hoisted(() => ({
  mockGetCachedAuth: vi.fn(),
  mockGetAuthPromise: vi.fn(),
  mockSetAuthPromise: vi.fn(),
  mockSetCachedAuth: vi.fn(),
  mockClearAuthCache: vi.fn(),
}));

vi.mock('@/lib/auth/auth-cache', () => ({
  getCachedAuth: () => mockGetCachedAuth(),
  getAuthPromise: () => mockGetAuthPromise(),
  setAuthPromise: mockSetAuthPromise,
  setCachedAuth: mockSetCachedAuth,
  clearAuthCache: mockClearAuthCache,
}));

// Mock de useSignOut
const mockSignOut = vi.fn();
vi.mock('@/hooks/auth/useSignOut', () => ({
  useSignOut: vi.fn(() => ({
    signOut: mockSignOut,
    isSigningOut: false,
  })),
}));

// Mock de authEvents
vi.mock('@/lib/events/EventHelpers', () => ({
  authEvents: {
    onUserLoggedIn: vi.fn(() => vi.fn()),
    onUserLoggedOut: vi.fn(() => vi.fn()),
  },
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

    mockGetCachedAuth.mockReturnValue({ user: mockCachedUser, timestamp: Date.now() });

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
    mockGetCachedAuth.mockReturnValue(null);
    
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      roles: [ROLES.CUSTOMER],
      status: USER_STATUSES.ACTIVE,
    };

    const mockPromise = Promise.resolve({ user: mockUser });
    mockGetAuthPromise.mockReturnValue(mockPromise);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('devrait récupérer l\'utilisateur via fetch /api/users/me', async () => {
    mockGetCachedAuth.mockReturnValue(null);
    mockGetAuthPromise.mockReturnValue(null);

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
    expect(mockSetCachedAuth).toHaveBeenCalledWith(mockUser);
    expect(mockSetAuthPromise).toHaveBeenCalled();
    expect(result.current.user).toBeDefined();
  });

  it('devrait gérer le timeout (5 secondes)', async () => {
    mockGetCachedAuth.mockReturnValue(null);
    mockGetAuthPromise.mockReturnValue(null);

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
    mockGetCachedAuth.mockReturnValue(null);
    mockGetAuthPromise.mockReturnValue(null);

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
    mockGetCachedAuth.mockReturnValue(null);
    mockGetAuthPromise.mockReturnValue(null);

    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('devrait gérer les états de chargement (isLoading)', async () => {
    mockGetCachedAuth.mockReturnValue(null);
    mockGetAuthPromise.mockReturnValue(null);

    vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {})); // Jamais résolu

    const { result } = renderHook(() => useAuth());

    // Au début, isLoading devrait être true
    expect(result.current.isLoading).toBe(true);
  });

  it('devrait gérer l\'état d\'authentification (isAuthenticated)', async () => {
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

    mockGetCachedAuth.mockReturnValue({ user: mockCachedUser, timestamp: Date.now() });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.status).toBe('authenticated');
  });

  it('devrait vérifier les rôles (isAdmin, isProvider, isCSM, isCustomer)', async () => {
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

    mockGetCachedAuth.mockReturnValue({ user: mockCachedUser, timestamp: Date.now() });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin()).toBe(true);
    expect(result.current.isProvider()).toBe(true);
    expect(result.current.isCustomer()).toBe(false);
  });

  it('devrait exécuter refreshAuth avec succès', async () => {
    mockGetCachedAuth.mockReturnValue(null);

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

    mockGetCachedAuth.mockReturnValue({ user: mockCachedUser, timestamp: Date.now() });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.status).toBe('unauthenticated');
  });

  it('devrait gérer les données OAuth', async () => {
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

    mockGetCachedAuth.mockReturnValue({ user: mockCachedUser, timestamp: Date.now() });

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
    mockGetCachedAuth.mockReturnValue(null);
    mockGetAuthPromise.mockReturnValue(null);

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

  it('devrait mettre à jour l\'utilisateur avec toutes les données de l\'API', async () => {
    mockGetCachedAuth.mockReturnValue(null);
    mockGetAuthPromise.mockReturnValue(null);

    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      roles: [ROLES.ADMIN, ROLES.PROVIDER],
      status: USER_STATUSES.ACTIVE,
      avatar: { image: 'avatar.jpg', name: 'Test User' },
      oauth: { google: { linked: true } },
      phone: '+33123456789',
      company: 'Test Company',
      address: '123 Test St',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    } as Response);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toMatchObject({
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      roles: [ROLES.ADMIN, ROLES.PROVIDER],
      status: USER_STATUSES.ACTIVE,
      phone: '+33123456789',
      company: 'Test Company',
      address: '123 Test St',
    });
  });

  it('devrait écouter les événements d\'authentification', async () => {
    mockGetCachedAuth.mockReturnValue(null);
    mockGetAuthPromise.mockReturnValue(null);

    // Mock fetch pour éviter l'erreur
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: 'user123' } }),
    } as Response);

    const { authEvents } = await import('@/lib/events/EventHelpers');
    const { unmount } = renderHook(() => useAuth());

    // Attendre que le hook soit monté
    await waitFor(() => {
      expect(authEvents.onUserLoggedIn).toHaveBeenCalled();
      expect(authEvents.onUserLoggedOut).toHaveBeenCalled();
    });

    // Nettoyer
    unmount();
  });

  it('devrait appeler handleSignOut et nettoyer l\'état', async () => {
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

    mockGetCachedAuth.mockReturnValue({ user: mockCachedUser, timestamp: Date.now() });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockClearAuthCache).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('devrait gérer les autres erreurs HTTP (non-401) lors du fetch initial', async () => {
    mockGetCachedAuth.mockReturnValue(null);
    mockGetAuthPromise.mockReturnValue(null);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Devrait retourner null pour les autres erreurs HTTP
    expect(result.current.user).toBeNull();
  });

  it('devrait gérer les erreurs 401 dans refreshAuth', async () => {
    mockGetCachedAuth.mockReturnValue(null);
    mockGetAuthPromise.mockReturnValue(null);

    // Premier appel pour le montage
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: 'user123' } }),
    } as Response);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Deuxième appel pour refreshAuth avec erreur 401
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    await act(async () => {
      await result.current.refreshAuth();
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
    expect(mockClearAuthCache).toHaveBeenCalled();
  });

  it('devrait gérer les erreurs non-ok dans refreshAuth', async () => {
    mockGetCachedAuth.mockReturnValue(null);
    mockGetAuthPromise.mockReturnValue(null);

    // Premier appel pour le montage
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: 'user123' } }),
    } as Response);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Vider le cache avant refreshAuth
    mockGetCachedAuth.mockReturnValue(null);

    // Deuxième appel pour refreshAuth avec erreur 500
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await act(async () => {
      await result.current.refreshAuth();
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
    expect(mockClearAuthCache).toHaveBeenCalled();
  });

  it('devrait gérer les erreurs dans refreshAuth (catch)', async () => {
    mockGetCachedAuth.mockReturnValue(null);
    mockGetAuthPromise.mockReturnValue(null);

    // Premier appel pour le montage
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: 'user123' } }),
    } as Response);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Vider le cache avant refreshAuth
    mockGetCachedAuth.mockReturnValue(null);

    // Deuxième appel pour refreshAuth avec erreur réseau
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      await result.current.refreshAuth();
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
    expect(mockClearAuthCache).toHaveBeenCalled();
  });

  it('devrait appeler refreshAuth lors de l\'événement onUserLoggedIn', async () => {
    mockGetCachedAuth.mockReturnValue(null);
    mockGetAuthPromise.mockReturnValue(null);

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 'user123' } }),
    } as Response);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const { authEvents } = await import('@/lib/events/EventHelpers');
    const loginCallback = vi.mocked(authEvents.onUserLoggedIn).mock.calls[0]?.[0];

    if (loginCallback) {
      await act(async () => {
        await loginCallback({ userId: 'user123', email: 'test@example.com', timestamp: new Date() });
      });

      // refreshAuth devrait être appelé
      expect(fetch).toHaveBeenCalledWith('/api/users/me', { cache: 'no-store' });
    }
  });

  it('devrait nettoyer l\'état lors de l\'événement onUserLoggedOut', async () => {
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

    mockGetCachedAuth.mockReturnValue({ user: mockCachedUser, timestamp: Date.now() });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const { authEvents } = await import('@/lib/events/EventHelpers');
    const logoutCallback = vi.mocked(authEvents.onUserLoggedOut).mock.calls[0]?.[0];

    if (logoutCallback) {
      await act(async () => {
        logoutCallback({ userId: 'user123' });
      });

      expect(mockClearAuthCache).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    }
  });
});

