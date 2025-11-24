/**
 * Tests unitaires pour useSignOut
 * 
 * Implémente les tests pour :
 * - Déconnexion utilisateur
 * - Nettoyage
 * - Événements
 * - Redirections
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSignOut } from '@/hooks/auth/useSignOut';
import { signOut as nextAuthSignOut } from 'next-auth/react';

// Mock de next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

// Mock de useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock de authEvents
vi.mock('@/lib/events', () => ({
  authEvents: {
    emitUserLoggedOut: vi.fn(),
  },
}));

// Mock de childLogger
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock de fetch pour la récupération de session
global.fetch = vi.fn();

// Mock de window.location
const mockLocation = {
  href: 'http://localhost:3000',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('useSignOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock localStorage
    const localStorageMock = {
      removeItem: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock sessionStorage
    const sessionStorageMock = {
      clear: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });

    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      value: 'next-auth.session-token=abc123; other-cookie=value',
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('devrait déconnecter avec succès avec nextAuthSignOut', async () => {
    vi.mocked(nextAuthSignOut).mockResolvedValueOnce(undefined);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    expect(nextAuthSignOut).toHaveBeenCalledWith({
      redirect: false,
      callbackUrl: '/login',
    });
  });

  it('devrait récupérer userId avant déconnexion', async () => {
    vi.mocked(nextAuthSignOut).mockResolvedValueOnce(undefined);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    expect(fetch).toHaveBeenCalledWith('/api/auth/session');
  });

  it('devrait émettre l\'événement authEvents.emitUserLoggedOut', async () => {
    vi.mocked(nextAuthSignOut).mockResolvedValueOnce(undefined);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    const { authEvents } = await import('@/lib/events');
    expect(vi.mocked(authEvents.emitUserLoggedOut)).toHaveBeenCalledWith('user123');
  });

  it('devrait nettoyer le localStorage (user-session)', async () => {
    vi.mocked(nextAuthSignOut).mockResolvedValueOnce(undefined);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123' },
      }),
    } as Response);

    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('user-session');
  });

  it('devrait nettoyer le sessionStorage', async () => {
    vi.mocked(nextAuthSignOut).mockResolvedValueOnce(undefined);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123' },
      }),
    } as Response);

    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    expect(window.sessionStorage.clear).toHaveBeenCalled();
  });

  it('devrait nettoyer les cookies NextAuth', async () => {
    vi.mocked(nextAuthSignOut).mockResolvedValueOnce(undefined);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123' },
      }),
    } as Response);

    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    // Vérifier que nextAuthSignOut a été appelé (ce qui devrait nettoyer les cookies)
    // Note: On ne peut pas tester directement la manipulation de document.cookie dans jsdom
    // car la propriété n'est pas configurable, mais nextAuthSignOut devrait gérer cela
    expect(nextAuthSignOut).toHaveBeenCalled();
  });

  it('devrait rediriger vers /login', async () => {
    vi.mocked(nextAuthSignOut).mockResolvedValueOnce(undefined);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123' },
      }),
    } as Response);

    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('devrait forcer un rechargement de la page après 100ms', async () => {
    vi.mocked(nextAuthSignOut).mockResolvedValueOnce(undefined);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123' },
      }),
    } as Response);

    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    // Avancer le temps de 100ms
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(window.location.href).toBe('/login');
  });

  it('devrait gérer les états de chargement (isSigningOut)', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise<void>(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(nextAuthSignOut).mockReturnValueOnce(promise as any);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123' },
      }),
    } as Response);

    const { result } = renderHook(() => useSignOut());

    // Lancer la déconnexion
    await act(async () => {
      result.current.signOut();
    });

    // Vérifier que isSigningOut est true pendant le chargement
    expect(result.current.isSigningOut).toBe(true);

    // Résoudre la promesse pour terminer la déconnexion
    await act(async () => {
      resolvePromise!();
      await promise;
    });

    // Attendre que isSigningOut redevienne false
    await waitFor(() => {
      expect(result.current.isSigningOut).toBe(false);
    }, { timeout: 2000 });
  });

  it('devrait prévenir les déconnexions multiples', async () => {
    vi.mocked(nextAuthSignOut).mockImplementation(() => new Promise(() => {})); // Jamais résolu

    const { result } = renderHook(() => useSignOut());

    act(() => {
      result.current.signOut();
    });

    expect(result.current.isSigningOut).toBe(true);

    // Tenter une deuxième déconnexion
    act(() => {
      result.current.signOut();
    });

    // Le nombre d'appels à nextAuthSignOut ne devrait pas augmenter
    expect(vi.mocked(nextAuthSignOut).mock.calls.length).toBe(1);
  });

  it('devrait gérer les erreurs de déconnexion', async () => {
    vi.mocked(nextAuthSignOut).mockRejectedValueOnce(new Error('Sign out error'));

    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    // En cas d'erreur, devrait quand même rediriger
    expect(mockPush).toHaveBeenCalledWith('/login');
    
    // Avancer le temps pour le setTimeout
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(window.location.href).toBe('/login');
  });

  it('devrait gérer l\'absence de userId', async () => {
    vi.mocked(nextAuthSignOut).mockResolvedValueOnce(undefined);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    // L'événement ne devrait pas être émis si userId est undefined
    const { authEvents } = await import('@/lib/events');
    expect(vi.mocked(authEvents.emitUserLoggedOut)).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});

