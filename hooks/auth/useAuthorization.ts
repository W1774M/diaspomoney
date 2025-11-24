'use client';

/**
 * useAuthorization Hook
 * Implémente les design patterns :
 * - Custom Hooks Pattern
 * - Authorization Pattern (aligné avec @Authorize decorator backend)
 * - Permission-based Access Control
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { ROLES } from '@/lib/constants';

export interface AuthorizationOptions {
  /**
   * Rôles autorisés (au moins un doit correspondre)
   */
  roles?: string[];
  /**
   * Permissions requises (au moins une doit correspondre)
   */
  permissions?: string[];
  /**
   * Vérifier si l'utilisateur est propriétaire de la ressource
   */
  checkOwnership?: boolean;
  /**
   * ID du propriétaire de la ressource (pour checkOwnership)
   */
  resourceOwnerId?: string;
  /**
   * Activer/désactiver la vérification
   */
  enabled?: boolean;
}

export interface AuthorizationResult {
  /**
   * L'utilisateur est autorisé
   */
  isAuthorized: boolean;
  /**
   * Raison de l'échec d'autorisation
   */
  reason?: 'no_session' | 'insufficient_roles' | 'insufficient_permissions' | 'not_owner';
  /**
   * Message d'erreur
   */
  error?: string;
}

/**
 * Hook pour vérifier les autorisations basées sur les rôles et permissions
 * Aligné avec le décorateur @Authorize du backend
 * 
 * @example
 * ```tsx
 * const { isAuthorized, reason } = useAuthorization({
 *   roles: [ROLES.ADMIN],
 *   permissions: ['users:delete']
 * });
 * 
 * if (!isAuthorized) {
 *   return <Unauthorized reason={reason} />;
 * }
 * ```
 */
export function useAuthorization(options: AuthorizationOptions = {}): AuthorizationResult {
  const { user, isAuthenticated, isLoading } = useAuth();

  const {
    roles = [],
    permissions = [],
    checkOwnership = false,
    resourceOwnerId,
    enabled = true,
  } = options;

  console.log('[useAuthorization] Appelé', {
    roles,
    isAuthenticated,
    isLoading,
    userId: user?.id,
  });

  const result = useMemo((): AuthorizationResult => {
    console.log('[useAuthorization] useMemo recalculé', {
      isLoading,
      isAuthenticated,
      userId: user?.id,
    });
    // Si désactivé, autoriser
    if (!enabled) {
      return { isAuthorized: true };
    }

    // Vérifier la session
    if (isLoading) {
      return { isAuthorized: false, reason: 'no_session', error: 'Vérification en cours...' };
    }

    if (!isAuthenticated || !user) {
      return {
        isAuthorized: false,
        reason: 'no_session',
        error: 'Non autorisé - Session requise',
      };
    }

    const userRoles = user.roles || [];
    // Les permissions peuvent être stockées dans user.permissions ou dans un champ séparé
    const userPermissions = (user as any).permissions || [];

    // Les admins ont accès à tout (comme dans le décorateur backend)
    const isAdmin = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SUPERADMIN);

    // Vérifier les rôles
    if (roles.length > 0) {
      const hasRequiredRole =
        isAdmin || roles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        return {
          isAuthorized: false,
          reason: 'insufficient_roles',
          error: `Accès non autorisé - Rôle requis: ${roles.join(', ')}`,
        };
      }
    }

    // Vérifier les permissions
    if (permissions.length > 0) {
      const hasRequiredPermission =
        isAdmin ||
        permissions.some(permission => userPermissions.includes(permission));

      if (!hasRequiredPermission) {
        return {
          isAuthorized: false,
          reason: 'insufficient_permissions',
          error: `Accès non autorisé - Permission requise: ${permissions.join(', ')}`,
        };
      }
    }

    // Vérifier la propriété de la ressource
    if (checkOwnership && resourceOwnerId) {
      const isOwner = user.id === resourceOwnerId;
      if (!isOwner && !isAdmin) {
        return {
          isAuthorized: false,
          reason: 'not_owner',
          error: 'Accès non autorisé - Vous n\'êtes pas propriétaire de cette ressource',
        };
      }
    }

    return { isAuthorized: true };
  }, [
    enabled,
    isLoading,
    isAuthenticated,
    user,
    roles,
    permissions,
    checkOwnership,
    resourceOwnerId,
  ]);

  return result;
}

/**
 * Hook helper pour vérifier un rôle spécifique
 */
export function useHasRole(role: string): boolean {
  const { user } = useAuth();
  const userRoles = user?.roles || [];
  return userRoles.includes(role) || userRoles.includes(ROLES.ADMIN);
}

/**
 * Hook helper pour vérifier une permission spécifique
 */
export function useHasPermission(permission: string): boolean {
  const { user } = useAuth();
  const userRoles = user?.roles || [];
  const userPermissions = (user as any).permissions || [];
  const isAdmin = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SUPERADMIN);
  return isAdmin || userPermissions.includes(permission);
}

