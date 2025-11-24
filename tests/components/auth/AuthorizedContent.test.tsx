/**
 * Tests unitaires pour AuthorizedContent
 * 
 * Implémente les tests pour :
 * - Affichage conditionnel basé sur les rôles
 * - Affichage conditionnel basé sur les permissions
 * - Mode invert
 * - Fallback personnalisé
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthorizedContent from '@/components/auth/AuthorizedContent';
import { ROLES } from '@/lib/constants';

// Mock de useAuthorization
const mockUseAuthorization = vi.fn();
vi.mock('@/hooks/auth/useAuthorization', () => ({
  useAuthorization: (options: any) => mockUseAuthorization(options),
}));

describe('AuthorizedContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Affichage conditionnel par rôles', () => {
    it('devrait afficher le contenu si l\'utilisateur a le rôle requis', () => {
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedContent roles={[ROLES.ADMIN]}>
          <div>Contenu admin</div>
        </AuthorizedContent>
      );

      expect(screen.getByText('Contenu admin')).toBeInTheDocument();
    });

    it('ne devrait pas afficher le contenu si l\'utilisateur n\'a pas le rôle requis', () => {
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
      });

      render(
        <AuthorizedContent roles={[ROLES.ADMIN]}>
          <div>Contenu admin</div>
        </AuthorizedContent>
      );

      expect(screen.queryByText('Contenu admin')).not.toBeInTheDocument();
    });

    it('devrait afficher le fallback si fourni et non autorisé', () => {
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
      });

      render(
        <AuthorizedContent roles={[ROLES.ADMIN]} fallback={<div>Accès refusé</div>}>
          <div>Contenu admin</div>
        </AuthorizedContent>
      );

      expect(screen.getByText('Accès refusé')).toBeInTheDocument();
      expect(screen.queryByText('Contenu admin')).not.toBeInTheDocument();
    });
  });

  describe('Affichage conditionnel par permissions', () => {
    it('devrait afficher le contenu si l\'utilisateur a la permission requise', () => {
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedContent permissions={['users:delete']}>
          <div>Bouton supprimer</div>
        </AuthorizedContent>
      );

      expect(screen.getByText('Bouton supprimer')).toBeInTheDocument();
    });

    it('ne devrait pas afficher le contenu si l\'utilisateur n\'a pas la permission requise', () => {
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_permissions',
      });

      render(
        <AuthorizedContent permissions={['users:delete']}>
          <div>Bouton supprimer</div>
        </AuthorizedContent>
      );

      expect(screen.queryByText('Bouton supprimer')).not.toBeInTheDocument();
    });
  });

  describe('Mode invert', () => {
    it('devrait afficher le contenu si non autorisé quand invert est true', () => {
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
      });

      render(
        <AuthorizedContent roles={[ROLES.ADMIN]} invert>
          <div>Contenu pour non-admin</div>
        </AuthorizedContent>
      );

      expect(screen.getByText('Contenu pour non-admin')).toBeInTheDocument();
    });

    it('ne devrait pas afficher le contenu si autorisé quand invert est true', () => {
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedContent roles={[ROLES.ADMIN]} invert>
          <div>Contenu pour non-admin</div>
        </AuthorizedContent>
      );

      expect(screen.queryByText('Contenu pour non-admin')).not.toBeInTheDocument();
    });

    it('devrait afficher le fallback si autorisé quand invert est true', () => {
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedContent
          roles={[ROLES.ADMIN]}
          invert
          fallback={<div>Vous êtes admin</div>}
        >
          <div>Contenu pour non-admin</div>
        </AuthorizedContent>
      );

      expect(screen.getByText('Vous êtes admin')).toBeInTheDocument();
      expect(screen.queryByText('Contenu pour non-admin')).not.toBeInTheDocument();
    });
  });

  describe('Vérification de la propriété (ownership)', () => {
    it('devrait afficher le contenu si l\'utilisateur est propriétaire', () => {
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedContent checkOwnership resourceOwnerId="user123">
          <div>Contenu propriétaire</div>
        </AuthorizedContent>
      );

      expect(screen.getByText('Contenu propriétaire')).toBeInTheDocument();
    });

    it('ne devrait pas afficher le contenu si l\'utilisateur n\'est pas propriétaire', () => {
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'not_owner',
      });

      render(
        <AuthorizedContent checkOwnership resourceOwnerId="other-user">
          <div>Contenu propriétaire</div>
        </AuthorizedContent>
      );

      expect(screen.queryByText('Contenu propriétaire')).not.toBeInTheDocument();
    });
  });

  describe('Combinaison de vérifications', () => {
    it('devrait afficher le contenu si l\'utilisateur a le rôle ET la permission', () => {
      mockUseAuthorization.mockReturnValue({
        isAuthorized: true,
      });

      render(
        <AuthorizedContent roles={[ROLES.CSM]} permissions={['users:delete']}>
          <div>Contenu avec rôle et permission</div>
        </AuthorizedContent>
      );

      expect(screen.getByText('Contenu avec rôle et permission')).toBeInTheDocument();
    });

    it('ne devrait pas afficher le contenu si l\'utilisateur n\'a pas le rôle ET la permission', () => {
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
      });

      render(
        <AuthorizedContent roles={[ROLES.CSM]} permissions={['users:delete']}>
          <div>Contenu avec rôle et permission</div>
        </AuthorizedContent>
      );

      expect(screen.queryByText('Contenu avec rôle et permission')).not.toBeInTheDocument();
    });
  });

  describe('Fallback par défaut', () => {
    it('devrait ne rien afficher si fallback n\'est pas fourni et non autorisé', () => {
      mockUseAuthorization.mockReturnValue({
        isAuthorized: false,
        reason: 'insufficient_roles',
      });

      const { container } = render(
        <AuthorizedContent roles={[ROLES.ADMIN]}>
          <div>Contenu admin</div>
        </AuthorizedContent>
      );

      expect(container.firstChild).toBeNull();
    });
  });
});

