'use client';

/**
 * AuthorizedContent Component
 * Implémente les design patterns :
 * - Conditional Rendering Pattern
 * - Authorization Pattern (aligné avec @Authorize decorator backend)
 */

import { ReactNode } from 'react';
import { useAuthorization, type AuthorizationOptions } from '@/hooks/auth/useAuthorization';

export interface AuthorizedContentProps extends AuthorizationOptions {
  children: ReactNode;
  /**
   * Contenu à afficher si non autorisé
   */
  fallback?: ReactNode;
  /**
   * Inverser la logique (afficher si non autorisé)
   */
  invert?: boolean;
}

/**
 * Composant pour afficher conditionnellement du contenu basé sur les autorisations
 * Aligné avec le décorateur @Authorize du backend
 * 
 * @example
 * ```tsx
 * <AuthorizedContent roles={[ROLES.ADMIN]}>
 *   <DeleteButton />
 * </AuthorizedContent>
 * 
 * <AuthorizedContent roles={[ROLES.ADMIN]} invert fallback={<p>Accès limité</p>}>
 *   <AdminPanel />
 * </AuthorizedContent>
 * ```
 */
export default function AuthorizedContent({
  children,
  fallback = null,
  invert = false,
  ...authOptions
}: AuthorizedContentProps) {
  const { isAuthorized } = useAuthorization(authOptions);

  if (invert) {
    return <>{!isAuthorized ? children : fallback}</>;
  }

  return <>{isAuthorized ? children : fallback}</>;
}

