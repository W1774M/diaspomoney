/**
 * Tests d'intégration pour le système d'autorisation
 * 
 * Ces tests vérifient le comportement complet du système d'autorisation
 * en simulant différents scénarios d'utilisateurs avec différents rôles et permissions.
 * 
 * Ils testent l'intégration entre :
 * - useAuthorization hook
 * - AuthorizedRoute component
 * - AuthorizedContent component
 * - Différents scénarios d'authentification
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useAuthorization } from '@/hooks/auth/useAuthorization';
import AuthorizedRoute from '@/components/auth/AuthorizedRoute';
import AuthorizedContent from '@/components/auth/AuthorizedContent';
import { ROLES, USER_STATUSES } from '@/lib/constants';

// Mock de useRouter
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock de useAuth
const mockUseAuth = vi.fn();
vi.mock('@/hooks/auth/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Integration: Système d\'autorisation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scénario 1: Utilisateur non authentifié', () => {
    it('devrait rediriger vers /login depuis AuthorizedRoute', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      render(
        <AuthorizedRoute>
          <div>Contenu protégé</div>
        </AuthorizedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('devrait retourner isAuthorized: false dans useAuthorization', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      const { result } = renderHook(() =>
        useAuthorization({ roles: [ROLES.ADMIN] })
      );

      expect(result.current.isAuthorized).toBe(false);
      expect(result.current.reason).toBe('no_session');
      expect(result.current.error).toBe('Non autorisé - Session requise');
    });

    it('ne devrait pas afficher le contenu dans AuthorizedContent', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      const { container } = render(
        <AuthorizedContent roles={[ROLES.ADMIN]}>
          <div>Contenu admin</div>
        </AuthorizedContent>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Scénario 2: Utilisateur CUSTOMER accédant à une page ADMIN', () => {
    it('devrait afficher un message d\'erreur dans AuthorizedRoute', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'customer123',
          email: 'customer@example.com',
          roles: [ROLES.CUSTOMER],
          status: USER_STATUSES.ACTIVE,
        },
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN]}>
          <div>Contenu admin</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Accès non autorisé')).toBeInTheDocument();
      expect(screen.getByText(/Rôle requis: ADMIN/)).toBeInTheDocument();
      expect(screen.queryByText('Contenu admin')).not.toBeInTheDocument();
    });

    it('devrait retourner isAuthorized: false avec reason insufficient_roles', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'customer123',
          roles: [ROLES.CUSTOMER],
        },
      });

      const { result } = renderHook(() =>
        useAuthorization({ roles: [ROLES.ADMIN] })
      );

      expect(result.current.isAuthorized).toBe(false);
      expect(result.current.reason).toBe('insufficient_roles');
      expect(result.current.error).toContain('Rôle requis: ADMIN');
    });

    it('ne devrait pas afficher le contenu dans AuthorizedContent', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'customer123',
          roles: [ROLES.CUSTOMER],
        },
      });

      const { container } = render(
        <AuthorizedContent roles={[ROLES.ADMIN]}>
          <div>Contenu admin</div>
        </AuthorizedContent>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Scénario 3: Utilisateur ADMIN accédant à une page ADMIN', () => {
    it('devrait afficher le contenu dans AuthorizedRoute', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'admin123',
          email: 'admin@example.com',
          roles: [ROLES.ADMIN],
          status: USER_STATUSES.ACTIVE,
        },
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN]}>
          <div>Contenu admin</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Contenu admin')).toBeInTheDocument();
    });

    it('devrait retourner isAuthorized: true dans useAuthorization', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'admin123',
          roles: [ROLES.ADMIN],
        },
      });

      const { result } = renderHook(() =>
        useAuthorization({ roles: [ROLES.ADMIN] })
      );

      expect(result.current.isAuthorized).toBe(true);
      expect(result.current.reason).toBeUndefined();
    });

    it('devrait afficher le contenu dans AuthorizedContent', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'admin123',
          roles: [ROLES.ADMIN],
        },
      });

      render(
        <AuthorizedContent roles={[ROLES.ADMIN]}>
          <div>Contenu admin</div>
        </AuthorizedContent>
      );

      expect(screen.getByText('Contenu admin')).toBeInTheDocument();
    });
  });

  describe('Scénario 4: Utilisateur avec permissions insuffisantes', () => {
    it('devrait afficher un message d\'erreur pour permissions insuffisantes', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
          permissions: ['users:read'],
        },
      });

      render(
        <AuthorizedRoute permissions={['users:delete']}>
          <div>Contenu avec permission</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Accès non autorisé')).toBeInTheDocument();
      expect(screen.getByText(/Permission requise: users:delete/)).toBeInTheDocument();
    });

    it('devrait retourner isAuthorized: false avec reason insufficient_permissions', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
          permissions: ['users:read'],
        },
      });

      const { result } = renderHook(() =>
        useAuthorization({ permissions: ['users:delete'] })
      );

      expect(result.current.isAuthorized).toBe(false);
      expect(result.current.reason).toBe('insufficient_permissions');
      expect(result.current.error).toContain('Permission requise: users:delete');
    });
  });

  describe('Scénario 5: Vérification de propriété (ownership)', () => {
    it('devrait autoriser si l\'utilisateur est propriétaire', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
        },
      });

      const { result } = renderHook(() =>
        useAuthorization({
          checkOwnership: true,
          resourceOwnerId: 'user123',
        })
      );

      expect(result.current.isAuthorized).toBe(true);
    });

    it('devrait refuser si l\'utilisateur n\'est pas propriétaire', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
        },
      });

      const { result } = renderHook(() =>
        useAuthorization({
          checkOwnership: true,
          resourceOwnerId: 'other-user',
        })
      );

      expect(result.current.isAuthorized).toBe(false);
      expect(result.current.reason).toBe('not_owner');
      expect(result.current.error).toContain('propriétaire de cette ressource');
    });

    it('devrait autoriser les admins même s\'ils ne sont pas propriétaires', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'admin123',
          roles: [ROLES.ADMIN],
        },
      });

      const { result } = renderHook(() =>
        useAuthorization({
          checkOwnership: true,
          resourceOwnerId: 'other-user',
        })
      );

      expect(result.current.isAuthorized).toBe(true);
    });
  });

  describe('Scénario 6: Rôles multiples (ADMIN ou CSM)', () => {
    it('devrait autoriser si l\'utilisateur a l\'un des rôles requis', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'csm123',
          roles: [ROLES.CSM],
        },
      });

      const { result } = renderHook(() =>
        useAuthorization({ roles: [ROLES.ADMIN, ROLES.CSM] })
      );

      expect(result.current.isAuthorized).toBe(true);
    });

    it('devrait afficher le contenu dans AuthorizedRoute avec rôles multiples', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'csm123',
          roles: [ROLES.CSM],
        },
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN, ROLES.CSM]}>
          <div>Contenu admin ou CSM</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Contenu admin ou CSM')).toBeInTheDocument();
    });
  });

  describe('Scénario 7: Mode invert dans AuthorizedContent', () => {
    it('devrait afficher le contenu si non autorisé quand invert est true', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'customer123',
          roles: [ROLES.CUSTOMER],
        },
      });

      render(
        <AuthorizedContent roles={[ROLES.ADMIN]} invert>
          <div>Contenu pour non-admin</div>
        </AuthorizedContent>
      );

      expect(screen.getByText('Contenu pour non-admin')).toBeInTheDocument();
    });

    it('ne devrait pas afficher le contenu si autorisé quand invert est true', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'admin123',
          roles: [ROLES.ADMIN],
        },
      });

      const { container } = render(
        <AuthorizedContent roles={[ROLES.ADMIN]} invert>
          <div>Contenu pour non-admin</div>
        </AuthorizedContent>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Scénario 8: Fallback personnalisé', () => {
    it('devrait afficher le fallback dans AuthorizedRoute si non autorisé', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'customer123',
          roles: [ROLES.CUSTOMER],
        },
      });

      render(
        <AuthorizedRoute
          roles={[ROLES.ADMIN]}
          fallback={<div>Accès refusé - Page admin uniquement</div>}
        >
          <div>Contenu admin</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Accès refusé - Page admin uniquement')).toBeInTheDocument();
      expect(screen.queryByText('Contenu admin')).not.toBeInTheDocument();
    });

    it('devrait afficher le fallback dans AuthorizedContent si non autorisé', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'customer123',
          roles: [ROLES.CUSTOMER],
        },
      });

      render(
        <AuthorizedContent
          roles={[ROLES.ADMIN]}
          fallback={<div>Bouton non disponible</div>}
        >
          <button>Supprimer</button>
        </AuthorizedContent>
      );

      expect(screen.getByText('Bouton non disponible')).toBeInTheDocument();
      expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();
    });
  });

  describe('Scénario 9: État de chargement', () => {
    it('devrait afficher un loader pendant la vérification dans AuthorizedRoute', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
      });

      render(
        <AuthorizedRoute>
          <div>Contenu protégé</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Vérification des autorisations...')).toBeInTheDocument();
    });

    it('devrait retourner isAuthorized: false pendant le chargement dans useAuthorization', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
      });

      const { result } = renderHook(() => useAuthorization({}));

      expect(result.current.isAuthorized).toBe(false);
      expect(result.current.reason).toBe('no_session');
      expect(result.current.error).toBe('Vérification en cours...');
    });
  });

  describe('Scénario 10: Redirection personnalisée', () => {
    it('devrait rediriger vers redirectTo personnalisé si non authentifié', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      render(
        <AuthorizedRoute redirectTo="/custom-login">
          <div>Contenu protégé</div>
        </AuthorizedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-login');
      });
    });

    it('devrait rediriger vers redirectTo personnalisé si non autorisé', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'customer123',
          roles: [ROLES.CUSTOMER],
        },
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN]} redirectTo="/dashboard">
          <div>Contenu admin</div>
        </AuthorizedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });
});

