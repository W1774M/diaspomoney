/**
 * Tests d'intégration pour les pages refactorisées avec autorisation
 * 
 * Ces tests vérifient que les pages protégées fonctionnent correctement
 * avec le système d'autorisation AuthorizedRoute.
 * 
 * Pages testées :
 * - Pages admin uniquement
 * - Pages avec rôles multiples
 * - Pages avec authentification uniquement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AuthorizedRoute from '@/components/auth/AuthorizedRoute';
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

// Mock de useAuthorization
const mockUseAuthorization = vi.fn();
vi.mock('@/hooks/auth/useAuthorization', () => ({
  useAuthorization: (options: any) => mockUseAuthorization(options),
}));

describe('Integration: Pages avec autorisation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Admin uniquement (ex: /dashboard/specialities)', () => {
    it('devrait afficher le contenu pour un utilisateur ADMIN', () => {
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
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN]}>
          <div>Page Spécialités</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Page Spécialités')).toBeInTheDocument();
    });

    it('devrait refuser l\'accès à un utilisateur CUSTOMER', () => {
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
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
        error: 'Accès non autorisé - Rôle requis: ADMIN',
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN]}>
          <div>Page Spécialités</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Accès non autorisé')).toBeInTheDocument();
      expect(screen.queryByText('Page Spécialités')).not.toBeInTheDocument();
    });

    it('devrait rediriger vers /dashboard si non autorisé', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'customer123',
          roles: [ROLES.CUSTOMER],
        },
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
        error: 'Accès non autorisé',
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN]} redirectTo="/dashboard">
          <div>Page Spécialités</div>
        </AuthorizedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Page avec rôles multiples (ex: /dashboard/providers)', () => {
    it('devrait afficher le contenu pour un utilisateur ADMIN', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'admin123',
          roles: [ROLES.ADMIN],
        },
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN, ROLES.CSM]}>
          <div>Page Prestataires</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Page Prestataires')).toBeInTheDocument();
    });

    it('devrait afficher le contenu pour un utilisateur CSM', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'csm123',
          roles: [ROLES.CSM],
        },
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN, ROLES.CSM]}>
          <div>Page Prestataires</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Page Prestataires')).toBeInTheDocument();
    });

    it('devrait refuser l\'accès à un utilisateur CUSTOMER', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'customer123',
          roles: [ROLES.CUSTOMER],
        },
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
        error: 'Accès non autorisé - Rôle requis: ADMIN, CSM',
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN, ROLES.CSM]}>
          <div>Page Prestataires</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Accès non autorisé')).toBeInTheDocument();
      expect(screen.queryByText('Page Prestataires')).not.toBeInTheDocument();
    });
  });

  describe('Page avec authentification uniquement (ex: /dashboard/settings/faq)', () => {
    it('devrait afficher le contenu pour un utilisateur authentifié', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
        },
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedRoute>
          <div>Page FAQ</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Page FAQ')).toBeInTheDocument();
    });

    it('devrait rediriger vers /login si non authentifié', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'no_session',
        error: 'Non autorisé - Session requise',
      });

      render(
        <AuthorizedRoute>
          <div>Page FAQ</div>
        </AuthorizedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Page Provider uniquement (ex: /dashboard/provider)', () => {
    it('devrait afficher le contenu pour un utilisateur PROVIDER', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'provider123',
          roles: [ROLES.PROVIDER],
        },
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedRoute roles={[ROLES.PROVIDER]}>
          <div>Dashboard Provider</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Dashboard Provider')).toBeInTheDocument();
    });

    it('devrait refuser l\'accès à un utilisateur CUSTOMER', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'customer123',
          roles: [ROLES.CUSTOMER],
        },
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
        error: 'Accès non autorisé - Rôle requis: PROVIDER',
      });

      render(
        <AuthorizedRoute roles={[ROLES.PROVIDER]}>
          <div>Dashboard Provider</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Accès non autorisé')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Provider')).not.toBeInTheDocument();
    });
  });

  describe('Page Customer uniquement (ex: /dashboard/customer)', () => {
    it('devrait afficher le contenu pour un utilisateur CUSTOMER', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'customer123',
          roles: [ROLES.CUSTOMER],
        },
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedRoute roles={[ROLES.CUSTOMER]}>
          <div>Dashboard Customer</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Dashboard Customer')).toBeInTheDocument();
    });

    it('devrait refuser l\'accès à un utilisateur PROVIDER', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'provider123',
          roles: [ROLES.PROVIDER],
        },
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
        error: 'Accès non autorisé - Rôle requis: CUSTOMER',
      });

      render(
        <AuthorizedRoute roles={[ROLES.CUSTOMER]}>
          <div>Dashboard Customer</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Accès non autorisé')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Customer')).not.toBeInTheDocument();
    });
  });

  describe('Page avec tous les rôles (ex: /dashboard/appointments)', () => {
    it('devrait afficher le contenu pour un utilisateur ADMIN', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'admin123',
          roles: [ROLES.ADMIN],
        },
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedRoute
          roles={[ROLES.ADMIN, ROLES.CSM, ROLES.PROVIDER, ROLES.CUSTOMER]}
        >
          <div>Page Rendez-vous</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Page Rendez-vous')).toBeInTheDocument();
    });

    it('devrait afficher le contenu pour un utilisateur CUSTOMER', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: 'customer123',
          roles: [ROLES.CUSTOMER],
        },
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedRoute
          roles={[ROLES.ADMIN, ROLES.CSM, ROLES.PROVIDER, ROLES.CUSTOMER]}
        >
          <div>Page Rendez-vous</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Page Rendez-vous')).toBeInTheDocument();
    });
  });
});

