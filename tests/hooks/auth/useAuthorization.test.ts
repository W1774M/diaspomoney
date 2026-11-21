/**
 * Tests unitaires pour useAuthorization
 * 
 * Implémente les tests pour :
 * - Vérification des rôles
 * - Vérification des permissions
 * - Vérification de la propriété (ownership)
 * - Gestion des cas d'erreur
 * - Comportement avec différents rôles
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthorization, useHasRole, useHasPermission } from '@/hooks/auth/useAuthorization';
import { ROLES } from '@/lib/constants';

// Mock de useAuth
const mockUseAuth = vi.fn();
vi.mock('@/hooks/auth/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('useAuthorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Vérification de base', () => {
    it('devrait autoriser si aucune restriction n\'est spécifiée', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useAuthorization({}));

      expect(result.current.isAuthorized).toBe(true);
      expect(result.current.reason).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it('devrait autoriser si enabled est false', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      const { result } = renderHook(() => useAuthorization({ enabled: false }));

      expect(result.current.isAuthorized).toBe(true);
    });

    it('devrait retourner false si isLoading est true', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      });

      const { result } = renderHook(() => useAuthorization({}));

      expect(result.current.isAuthorized).toBe(false);
      expect(result.current.reason).toBe('no_session');
      expect(result.current.error).toBe('Vérification en cours...');
    });
  });

  describe('Vérification de session', () => {
    it('devrait refuser l\'accès si l\'utilisateur n\'est pas authentifié', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      const { result } = renderHook(() => useAuthorization({ roles: [ROLES.ADMIN] }));

      expect(result.current.isAuthorized).toBe(false);
      expect(result.current.reason).toBe('no_session');
      expect(result.current.error).toBe('Non autorisé - Session requise');
    });

    it('devrait refuser l\'accès si user est null', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useAuthorization({ roles: [ROLES.ADMIN] }));

      expect(result.current.isAuthorized).toBe(false);
      expect(result.current.reason).toBe('no_session');
    });
  });

  describe('Vérification des rôles', () => {
    it('devrait autoriser si l\'utilisateur a le rôle requis', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.ADMIN],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useAuthorization({ roles: [ROLES.ADMIN] }));

      expect(result.current.isAuthorized).toBe(true);
    });

    it('devrait autoriser si l\'utilisateur a l\'un des rôles requis', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CSM],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useAuthorization({ roles: [ROLES.ADMIN, ROLES.CSM] })
      );

      expect(result.current.isAuthorized).toBe(true);
    });

    it('devrait refuser si l\'utilisateur n\'a pas le rôle requis', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useAuthorization({ roles: [ROLES.ADMIN] }));

      expect(result.current.isAuthorized).toBe(false);
      expect(result.current.reason).toBe('insufficient_roles');
      expect(result.current.error).toContain('Rôle requis: ADMIN');
    });

    it('devrait autoriser les admins même sans le rôle spécifique', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.ADMIN],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useAuthorization({ roles: [ROLES.PROVIDER] }));

      expect(result.current.isAuthorized).toBe(true);
    });

    it('devrait autoriser les superadmins même sans le rôle spécifique', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.SUPERADMIN],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useAuthorization({ roles: [ROLES.PROVIDER] }));

      expect(result.current.isAuthorized).toBe(true);
    });
  });

  describe('Vérification des permissions', () => {
    it('devrait autoriser si l\'utilisateur a la permission requise', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
          permissions: ['users:read'],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useAuthorization({ permissions: ['users:read'] })
      );

      expect(result.current.isAuthorized).toBe(true);
    });

    it('devrait autoriser si l\'utilisateur a l\'une des permissions requises', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
          permissions: ['users:read', 'users:write'],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useAuthorization({ permissions: ['users:delete', 'users:write'] })
      );

      expect(result.current.isAuthorized).toBe(true);
    });

    it('devrait refuser si l\'utilisateur n\'a pas la permission requise', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
          permissions: ['users:read'],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useAuthorization({ permissions: ['users:delete'] })
      );

      expect(result.current.isAuthorized).toBe(false);
      expect(result.current.reason).toBe('insufficient_permissions');
      expect(result.current.error).toContain('Permission requise: users:delete');
    });

    it('devrait autoriser les admins même sans la permission spécifique', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.ADMIN],
          permissions: [],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useAuthorization({ permissions: ['users:delete'] })
      );

      expect(result.current.isAuthorized).toBe(true);
    });
  });

  describe('Vérification de la propriété (ownership)', () => {
    it('devrait autoriser si l\'utilisateur est propriétaire de la ressource', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useAuthorization({
          checkOwnership: true,
          resourceOwnerId: 'user123',
        })
      );

      expect(result.current.isAuthorized).toBe(true);
    });

    it('devrait refuser si l\'utilisateur n\'est pas propriétaire de la ressource', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
        },
        isAuthenticated: true,
        isLoading: false,
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
        user: {
          id: 'admin123',
          roles: [ROLES.ADMIN],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useAuthorization({
          checkOwnership: true,
          resourceOwnerId: 'other-user',
        })
      );

      expect(result.current.isAuthorized).toBe(true);
    });

    it('devrait ignorer checkOwnership si resourceOwnerId n\'est pas fourni', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useAuthorization({
          checkOwnership: true,
        })
      );

      expect(result.current.isAuthorized).toBe(true);
    });
  });

  describe('Combinaison de vérifications', () => {
    it('devrait autoriser si l\'utilisateur a le rôle ET la permission', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CSM],
          permissions: ['users:delete'],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useAuthorization({
          roles: [ROLES.CSM],
          permissions: ['users:delete'],
        })
      );

      expect(result.current.isAuthorized).toBe(true);
    });

    it('devrait refuser si l\'utilisateur a le rôle mais pas la permission', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CSM],
          permissions: ['users:read'],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useAuthorization({
          roles: [ROLES.CSM],
          permissions: ['users:delete'],
        })
      );

      expect(result.current.isAuthorized).toBe(false);
      expect(result.current.reason).toBe('insufficient_permissions');
    });

    it('devrait refuser si l\'utilisateur a la permission mais pas le rôle', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
          permissions: ['users:delete'],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useAuthorization({
          roles: [ROLES.CSM],
          permissions: ['users:delete'],
        })
      );

      expect(result.current.isAuthorized).toBe(false);
      expect(result.current.reason).toBe('insufficient_roles');
    });
  });

  describe('useHasRole', () => {
    it('devrait retourner true si l\'utilisateur a le rôle', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.ADMIN],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useHasRole(ROLES.ADMIN));

      expect(result.current).toBe(true);
    });

    it('devrait retourner true si l\'utilisateur est admin', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.ADMIN],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useHasRole(ROLES.PROVIDER));

      expect(result.current).toBe(true);
    });

    it('devrait retourner false si l\'utilisateur n\'a pas le rôle', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useHasRole(ROLES.ADMIN));

      expect(result.current).toBe(false);
    });
  });

  describe('useHasPermission', () => {
    it('devrait retourner true si l\'utilisateur a la permission', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
          permissions: ['users:read'],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useHasPermission('users:read'));

      expect(result.current).toBe(true);
    });

    it('devrait retourner true si l\'utilisateur est admin', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.ADMIN],
          permissions: [],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useHasPermission('users:delete'));

      expect(result.current).toBe(true);
    });

    it('devrait retourner false si l\'utilisateur n\'a pas la permission', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
          permissions: ['users:read'],
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useHasPermission('users:delete'));

      expect(result.current).toBe(false);
    });

    it('devrait gérer user.roles undefined', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: undefined,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useAuthorization({ roles: [ROLES.ADMIN] }));

      expect(result.current.isAuthorized).toBe(false);
      expect(result.current.reason).toBe('insufficient_roles');
    });

    it('devrait gérer user null dans useHasRole', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      const { result } = renderHook(() => useHasRole(ROLES.ADMIN));

      expect(result.current).toBe(false);
    });

    it('devrait gérer user avec permissions undefined', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user123',
          roles: [ROLES.CUSTOMER],
          // permissions n'est pas défini
        },
        isAuthenticated: true,
        isLoading: false,
      });

      // Le code utilise (user as any).permissions || [] pour couvrir la ligne 192
      const { result } = renderHook(() => useHasPermission('users:read'));

      // user.permissions est undefined, donc userPermissions sera []
      expect(result.current).toBe(false);
    });
  });
});

