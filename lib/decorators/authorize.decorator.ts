/**
 * Authorize Decorator Pattern
 * 
 * Decorator pour l'autorisation automatique des méthodes
 * Vérifie les rôles et permissions avant l'exécution
 */

import { logger } from '@/lib/logger';
import { ROLES } from '@/lib/constants';
import * as Sentry from '@sentry/nextjs';
import type { AuthorizeDecoratorOptions } from '@/lib/types';
import { auth } from '@/auth';

/**
 * Decorator Authorize pour l'autorisation automatique
 * 
 * @param options - Options d'autorisation
 * 
 * @example
 * class UserService {
 *   @Authorize({ roles: ['ADMIN'] })
 *   async deleteUser(id: string) {
 *     // Logique
 *   }
 * }
 */
export function Authorize(options: AuthorizeDecoratorOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) {
      return;
    }

    const {
      roles = [],
      permissions = [],
      checkOwnership = false,
      enabled = true,
      log = true,
    } = options;

    descriptor.value = async function (this: any, ...args: any[]) {
      if (!enabled) {
        return originalMethod.apply(this, args);
      }

      const className = target.constructor.name;
      const methodName = propertyKey;

      try {
        // Récupérer la session utilisateur
        const session = await auth();

        if (!session?.user?.id) {
          const error = new Error('Non autorisé - Session requise');
          (error as any).statusCode = 401;
          (error as any).code = 'UNAUTHORIZED';

          if (log) {
            logger.warn(
              {
                type: 'authorization_failed',
                class: className,
                method: methodName,
                reason: 'no_session',
              },
              `Authorization failed for ${className}.${methodName} - No session`,
            );
          }

          throw error;
        }

        const userRoles = session.user.roles || [];
        // Les permissions peuvent être stockées dans session.user ou dans un champ séparé
        const userPermissions = (session.user as any).permissions || [];

        // Les SUPERADMIN et ADMIN ont accès à tout
        const isSuperAdmin = userRoles.includes(ROLES.SUPERADMIN);
        const isAdmin = userRoles.includes(ROLES.ADMIN);

        // Vérifier les rôles
        if (roles.length > 0) {
          const hasRequiredRole = isSuperAdmin || isAdmin || roles.some(role =>
            userRoles.includes(role),
          );

          if (!hasRequiredRole) {
            const error = new Error(
              `Accès non autorisé - Rôle requis: ${roles.join(', ')}`,
            );
            (error as any).statusCode = 403;
            (error as any).code = 'FORBIDDEN';

            if (log) {
              logger.warn(
                {
                  type: 'authorization_failed',
                  class: className,
                  method: methodName,
                  reason: 'insufficient_roles',
                  requiredRoles: roles,
                  userRoles,
                  userId: session.user.id,
                },
                `Authorization failed for ${className}.${methodName} - Insufficient roles`,
              );
            }

            Sentry.captureException(error, {
              tags: {
                component: 'AuthorizeDecorator',
                action: 'authorizationFailed',
              },
              extra: {
                className,
                methodName,
                requiredRoles: roles,
                userRoles,
                userId: session.user.id,
              },
            });

            throw error;
          }
        }

        // Vérifier les permissions
        if (permissions.length > 0) {
          const hasRequiredPermission = permissions.some(permission =>
            userPermissions.includes(permission) ||
            userRoles.includes(ROLES.ADMIN),
          );

          if (!hasRequiredPermission) {
            const error = new Error(
              `Accès non autorisé - Permission requise: ${permissions.join(', ')}`,
            );
            (error as any).statusCode = 403;
            (error as any).code = 'FORBIDDEN';

            if (log) {
              logger.warn(
                {
                  type: 'authorization_failed',
                  class: className,
                  method: methodName,
                  reason: 'insufficient_permissions',
                  requiredPermissions: permissions,
                  userPermissions,
                  userId: session.user.id,
                },
                `Authorization failed for ${className}.${methodName} - Insufficient permissions`,
              );
            }

            throw error;
          }
        }

        // Vérifier la propriété de la ressource
        if (checkOwnership && args.length > 0) {
          const resourceId = args[0];
          // Cette vérification devrait être faite dans la méthode elle-même
          // car elle nécessite d'accéder à la ressource en base de données
          // Le décorateur peut seulement vérifier que l'ID est fourni
          if (!resourceId) {
            const error = new Error('ID de ressource requis pour vérifier la propriété');
            (error as any).statusCode = 400;
            throw error;
          }
          // Note: ownershipField est utilisé pour la documentation mais la vérification
          // réelle doit être faite dans la méthode elle-même
        }

        // Exécuter la méthode originale
        return await originalMethod.apply(this, args);
      } catch (error: any) {
        // Si c'est déjà une erreur d'autorisation, la propager
        if (error.statusCode === 401 || error.statusCode === 403) {
          throw error;
        }

        // Sinon, logger l'erreur et la propager
        logger.error(
          {
            type: 'authorization_error',
            class: className,
            method: methodName,
            error: error.message,
          },
          `Error in authorization check for ${className}.${methodName}`,
        );

        throw error;
      }
    };

    return descriptor;
  };
}

