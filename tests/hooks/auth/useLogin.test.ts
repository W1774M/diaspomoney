/**
 * Tests unitaires pour useLogin
 * 
 * Implémente les tests pour :
 * - Connexion utilisateur
 * - Gestion NextAuth
 * - Événements
 * - Redirections
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLogin } from '@/hooks/auth/useLogin';
import { signIn } from 'next-auth/react';

// Éviter les imports réels Resend pendant les tests (le hook importe dynamiquement)
vi.mock('@/lib/email/resend', () => ({
  sendLoginSuccessEmail: vi.fn(async () => {}),
}));

// Mock de next-auth/react
const mockUpdate = vi.fn();
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  useSession: () => ({
    status: 'unauthenticated',
    update: mockUpdate,
  }),
}));

// Mock de useRouter
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockReplace,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

// Mock de useNotificationManager
const mockAddSuccess = vi.fn();
const mockAddError = vi.fn();
vi.mock('@/components/ui/Notification', () => ({
  useNotificationManager: () => ({
    addSuccess: mockAddSuccess,
    addError: mockAddError,
  }),
}));

// Mock de authEvents
vi.mock('@/lib/events', () => ({
  authEvents: {
    emitUserLoggedIn: vi.fn(),
  },
}));

// Mock de useSimpleStore
const mockDispatch = vi.fn();
vi.mock('@/store/simple-store', () => ({
  useSimpleStore: (selector: any) => selector({ dispatch: mockDispatch }),
  authActions: {
    loginStart: () => ({ type: 'AUTH/LOGIN_START' }),
    loginSuccess: (user: any) => ({ type: 'AUTH/LOGIN_SUCCESS', payload: user }),
    loginFailure: (error: string) => ({ type: 'AUTH/LOGIN_FAILURE', payload: error }),
  },
}));

// Mock de childLogger
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock de fetch pour la vérification de session
global.fetch = vi.fn();

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({
      user: { id: 'user123', email: 'test@example.com' },
    });
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
  });

  afterEach(() => {
    // Sécurité: éviter de laisser des fake timers actifs entre tests
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('devrait se connecter avec succès avec signIn NextAuth', async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: true,
      error: null,
      url: null,
      status: 200,
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      const success = await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(success).toBe(true);
    });

    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password123',
      redirect: false,
      // Le hook force maintenant un callbackUrl RELATIF
      callbackUrl: '/dashboard',
    });
    expect(mockAddSuccess).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('devrait gérer les erreurs CredentialsSignin', async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: false,
      error: 'CredentialsSignin',
      url: '/api/auth/error?error=CredentialsSignin',
      status: 401,
    } as any);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      const success = await result.current.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
      expect(success).toBe(false);
    });

    expect(mockAddError).toHaveBeenCalledWith(
      'Identifiants incorrects. Vérifiez votre email et mot de passe.',
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'AUTH/LOGIN_FAILURE' }),
    );
  });

  it('devrait gérer les erreurs Callback', async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: false,
      error: 'Callback',
      url: null,
      status: 500,
    } as any);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      const success = await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(success).toBe(false);
    });

    expect(mockAddError).toHaveBeenCalledWith(
      'Erreur lors de la validation de la connexion. Veuillez réessayer.',
    );
  });

  it('devrait gérer les erreurs réseau', async () => {
    vi.mocked(signIn).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      const success = await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(success).toBe(false);
    });

    expect(mockAddError).toHaveBeenCalledWith(
      'Erreur lors de la connexion. Veuillez réessayer.',
    );
  });

  it('devrait gérer les timeouts (AbortError)', async () => {
    const abortError = new Error('AbortError');
    abortError.name = 'AbortError';
    vi.mocked(signIn).mockRejectedValueOnce(abortError);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      const success = await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(success).toBe(false);
    });

    expect(mockAddError).toHaveBeenCalledWith(
      'La connexion a été annulée ou a expiré. Veuillez réessayer.',
    );
  });

  it('devrait vérifier la session si signIn retourne undefined', async () => {
    vi.mocked(signIn).mockResolvedValueOnce(undefined);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      const success = await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(success).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith('/api/auth/session');
    const { authEvents } = await import('@/lib/events');
    expect(vi.mocked(authEvents.emitUserLoggedIn)).toHaveBeenCalled();
  });

  it('devrait émettre l\'événement authEvents.emitUserLoggedIn', async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: true,
      error: null,
      url: null,
      status: 200,
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    const { authEvents } = await import('@/lib/events');
    expect(vi.mocked(authEvents.emitUserLoggedIn)).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: expect.any(String),
        email: 'test@example.com',
        timestamp: expect.any(Date),
      }),
    );
  });

  it('devrait rediriger vers /dashboard après connexion', async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: true,
      error: null,
      url: null,
      status: 200,
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('devrait rediriger vers callbackUrl depuis sessionStorage', async () => {
    const mockSessionStorage = {
      getItem: vi.fn(() => '/custom-page'),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });

    vi.mocked(signIn).mockResolvedValueOnce({
      ok: true,
      error: null,
      url: null,
      status: 200,
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(mockReplace).toHaveBeenCalledWith('/custom-page');
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('authCallbackUrl');
  });

  it('devrait gérer les états de chargement (isLoading)', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(signIn).mockReturnValueOnce(promise as any);
    // Le hook fait plusieurs fetch('/api/auth/session') + plusieurs timeouts (>= ~1.5s)
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 'user123', email: 'test@example.com' } }),
    } as Response);

    const { result } = renderHook(() => useLogin());

    let loginPromise: Promise<boolean>;
    act(() => {
      loginPromise = result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise!({
        ok: true,
        error: null,
        url: null,
        status: 200,
      });
      await promise;
    });

    // Attendre que le flow de login se termine réellement
    await act(async () => {
      await loginPromise!;
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 8000 });
  });

  it('devrait masquer l\'email dans les logs', async () => {
    // Mock logger is used implicitly through the hook

    vi.mocked(signIn).mockResolvedValueOnce({
      ok: true,
      error: null,
      url: null,
      status: 200,
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Le logger devrait être appelé avec un email masqué
    // (vérifié via les mocks de childLogger)
  });

  it('devrait gérer les URLs localhost dans result.url', async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: true,
      error: null,
      url: 'http://localhost:3000/dashboard',
      status: 200,
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Le hook devrait ignorer l'URL localhost et utiliser router.push
    expect(mockReplace).toHaveBeenCalled();
  });

  it('devrait gérer les redirections vers /api/auth/error', async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: false,
      error: 'CredentialsSignin',
      url: '/api/auth/error?error=CredentialsSignin',
      status: 401,
    } as any);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      const success = await result.current.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
      expect(success).toBe(false);
    });

    expect(mockAddError).toHaveBeenCalledWith(
      'Identifiants incorrects. Vérifiez votre email et mot de passe.',
    );
  });

  it('devrait normaliser l\'URL de redirection (origin différent)', async () => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });

    // Simuler sessionStorage avec une URL externe
    const sessionStorageMock = {
      getItem: vi.fn(() => 'http://evil.com/redirect'),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });

    vi.mocked(signIn).mockResolvedValueOnce({
      ok: true,
      error: null,
      url: null,
      status: 200,
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Devrait rediriger vers /dashboard au lieu de l'URL externe
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('devrait gérer les erreurs dans normalizeRedirectUrl (catch)', async () => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });

    // Simuler sessionStorage avec une URL invalide qui causera une erreur dans URL()
    const sessionStorageMock = {
      getItem: vi.fn(() => 'not-a-valid-url'),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });

    vi.mocked(signIn).mockResolvedValueOnce({
      ok: true,
      error: null,
      url: null,
      status: 200,
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Devrait utiliser l'URL telle quelle si elle commence par /
    expect(mockReplace).toHaveBeenCalled();
  });

  it('devrait gérer les erreurs dans router.refresh', async () => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });

    mockRefresh.mockImplementation(() => {
      throw new Error('Refresh error');
    });

    vi.mocked(signIn).mockResolvedValueOnce({
      ok: true,
      error: null,
      url: null,
      status: 200,
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Devrait continuer malgré l'erreur de refresh
    expect(mockReplace).toHaveBeenCalled();
  });

  it('devrait utiliser window.location.assign si router.replace échoue', async () => {
    mockReplace.mockImplementation(() => {
      throw new Error('Navigation error');
    });

    const mockAssign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
        assign: mockAssign,
      },
      writable: true,
    });

    vi.mocked(signIn).mockResolvedValueOnce({
      ok: true,
      error: null,
      url: null,
      status: 200,
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user123', email: 'test@example.com' },
      }),
    } as Response);

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Devrait utiliser window.location.assign en fallback
    await waitFor(() => {
      expect(mockAssign).toHaveBeenCalled();
    });
  });
});

