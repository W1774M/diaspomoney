/**
 * Tests unitaires pour AuthorizedRoute
 * 
 * Implémente les tests pour :
 * - Redirection lorsque l'utilisateur n'est pas authentifié
 * - Affichage du message d'erreur lorsque l'utilisateur n'a pas les permissions
 * - Comportement correct avec différents rôles
 * - Vérification de la propriété (ownership) si applicable
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AuthorizedRoute from '@/components/auth/AuthorizedRoute';
import { ROLES } from '@/lib/constants';

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

describe('AuthorizedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentification', () => {
    it('devrait rediriger vers /login si l\'utilisateur n\'est pas authentifié', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'no_session',
        error: 'Non autorisé - Session requise',
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

    it('devrait rediriger vers redirectTo si spécifié et non authentifié', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'no_session',
        error: 'Non autorisé - Session requise',
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

    it('devrait afficher un loader pendant le chargement', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'no_session',
        error: 'Vérification en cours...',
      });

      render(
        <AuthorizedRoute>
          <div>Contenu protégé</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Vérification des autorisations...')).toBeInTheDocument();
    });
  });

  describe('Autorisation par rôles', () => {
    it('devrait afficher le contenu si l\'utilisateur a le rôle requis', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN]}>
          <div>Contenu protégé</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
    });

    it('devrait afficher un message d\'erreur si l\'utilisateur n\'a pas le rôle requis', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
        error: 'Accès non autorisé - Rôle requis: ADMIN',
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN]}>
          <div>Contenu protégé</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Accès non autorisé')).toBeInTheDocument();
      expect(screen.getByText(/Rôle requis: ADMIN/)).toBeInTheDocument();
      expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
    });

    it('devrait rediriger si redirectTo est spécifié et non autorisé', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
        error: 'Accès non autorisé',
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN]} redirectTo="/dashboard">
          <div>Contenu protégé</div>
        </AuthorizedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Autorisation par permissions', () => {
    it('devrait afficher le contenu si l\'utilisateur a la permission requise', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedRoute permissions={['users:delete']}>
          <div>Contenu protégé</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
    });

    it('devrait afficher un message d\'erreur si l\'utilisateur n\'a pas la permission requise', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_permissions',
        error: 'Accès non autorisé - Permission requise: users:delete',
      });

      render(
        <AuthorizedRoute permissions={['users:delete']}>
          <div>Contenu protégé</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Accès non autorisé')).toBeInTheDocument();
      expect(screen.getByText(/Permission requise: users:delete/)).toBeInTheDocument();
      expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
    });
  });

  describe('Vérification de la propriété (ownership)', () => {
    it('devrait afficher le contenu si l\'utilisateur est propriétaire', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 'user123' },
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedRoute checkOwnership resourceOwnerId="user123">
          <div>Contenu protégé</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
    });

    it('devrait afficher un message d\'erreur si l\'utilisateur n\'est pas propriétaire', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 'user123' },
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'not_owner',
        error: 'Accès non autorisé - Vous n\'êtes pas propriétaire de cette ressource',
      });

      render(
        <AuthorizedRoute checkOwnership resourceOwnerId="other-user">
          <div>Contenu protégé</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Accès non autorisé')).toBeInTheDocument();
      expect(screen.getByText(/propriétaire de cette ressource/)).toBeInTheDocument();
      expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
    });
  });

  describe('Fallback personnalisé', () => {
    it('devrait afficher le fallback si fourni et non autorisé', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
        error: 'Accès non autorisé',
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN]} fallback={<div>Accès refusé</div>}>
          <div>Contenu protégé</div>
        </AuthorizedRoute>
      );

      expect(screen.getByText('Accès refusé')).toBeInTheDocument();
      expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
    });
  });

  describe('Désactivation du message d\'erreur', () => {
    it('devrait ne rien afficher si showError est false et non autorisé', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
        error: 'Accès non autorisé',
      });

      const { container } = render(
        <AuthorizedRoute roles={[ROLES.ADMIN]} showError={false}>
          <div>Contenu protégé</div>
        </AuthorizedRoute>
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
    });
  });

  describe('Bouton de retour', () => {
    it('devrait afficher un bouton de retour au tableau de bord', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
        error: 'Accès non autorisé',
      });

      render(
        <AuthorizedRoute roles={[ROLES.ADMIN]}>
          <div>Contenu protégé</div>
        </AuthorizedRoute>
      );

      const button = screen.getByText('Retour au tableau de bord');
      expect(button).toBeInTheDocument();

      button.click();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});

