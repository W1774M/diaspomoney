'use client';

/**
 * AuthorizedRoute Component
 * Implémente les design patterns :
 * - Higher-Order Component Pattern
 * - Authorization Pattern (aligné avec @Authorize decorator backend)
 * - Route Protection Pattern
 */

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth/useAuth';
import { useAuthorization, type AuthorizationOptions } from '@/hooks/auth/useAuthorization';
import { ROLES } from '@/lib/constants';

export interface AuthorizedRouteProps extends AuthorizationOptions {
  children: ReactNode;
  /**
   * Redirection en cas d'échec d'autorisation
   */
  redirectTo?: string;
  /**
   * Composant à afficher en cas d'échec d'autorisation
   */
  fallback?: ReactNode;
  /**
   * Afficher un message d'erreur personnalisé
   */
  showError?: boolean;
}

/**
 * Composant pour protéger une route avec autorisation basée sur les rôles et permissions
 * Aligné avec le décorateur @Authorize du backend
 * 
 * @example
 * ```tsx
 * <AuthorizedRoute roles={[ROLES.ADMIN]} permissions={['users:delete']}>
 *   <AdminPanel />
 * </AuthorizedRoute>
 * ```
 */
export default function AuthorizedRoute({
  children,
  roles,
  permissions,
  checkOwnership,
  resourceOwnerId,
  enabled = true,
  redirectTo,
  fallback,
  showError = true,
}: AuthorizedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const authorizationOptions: AuthorizationOptions = {
    enabled,
  };
  if (roles) authorizationOptions.roles = roles;
  if (permissions) authorizationOptions.permissions = permissions;
  if (checkOwnership !== undefined) authorizationOptions.checkOwnership = checkOwnership;
  if (resourceOwnerId) authorizationOptions.resourceOwnerId = resourceOwnerId;
  
  const { isAuthorized, reason, error } = useAuthorization(authorizationOptions);

  useEffect(() => {
    if (isLoading) return;

    // Rediriger si non authentifié
    if (!isAuthenticated) {
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push('/login');
      }
      return;
    }

    // Rediriger si non autorisé
    if (!isAuthorized && redirectTo) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, isAuthorized, redirectTo, router]);

  // Afficher un message de chargement pendant la vérification
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Vérification des autorisations...</p>
      </div>
    );
  }

  // Afficher le fallback si fourni
  if (!isAuthorized && fallback) {
    return <>{fallback}</>;
  }

  // Afficher un message d'erreur par défaut
  if (!isAuthorized && showError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h1>
          <p className="text-gray-600 mb-4">{error || 'Vous n\'avez pas les permissions pour accéder à cette page.'}</p>
          {reason === 'insufficient_roles' && roles && (
            <p className="text-sm text-gray-500 mb-4">
              Rôles requis: {roles.join(', ')}
            </p>
          )}
          {reason === 'insufficient_permissions' && permissions && (
            <p className="text-sm text-gray-500 mb-4">
              Permissions requises: {permissions.join(', ')}
            </p>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  // Ne pas afficher le contenu si non autorisé
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Composant helper pour protéger une route avec un rôle spécifique
 */
export function AdminRoute({ children, ...props }: Omit<AuthorizedRouteProps, 'roles'>) {
  return (
    <AuthorizedRoute roles={[ROLES.ADMIN]} {...props}>
      {children}
    </AuthorizedRoute>
  );
}

/**
 * Composant helper pour protéger une route avec plusieurs rôles
 */
export function RoleRoute({
  roles,
  children,
  ...props
}: AuthorizedRouteProps & { roles: string[] }) {
  return (
    <AuthorizedRoute roles={roles} {...props}>
      {children}
    </AuthorizedRoute>
  );
}

