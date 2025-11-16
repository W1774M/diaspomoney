/**
 * Middleware d'authentification
 * Gère à la fois NextAuth et les tokens JWT personnalisés
 *
 * Implémente les design patterns :
 * - Middleware Pattern
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 * - Strategy Pattern (multiple authentication strategies: NextAuth, JWT)
 */

import { childLogger } from '@/lib/logger';
import type { AuthenticatedUser } from '@/types/auth';
import * as Sentry from '@sentry/nextjs';
import jwt from 'jsonwebtoken';
import { decode } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

/**
 * Authentifier un utilisateur depuis une requête
 * Essaie d'abord NextAuth (cookies), puis JWT (Bearer token)
 */
export async function authenticateUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    component: 'AuthMiddleware',
    requestId: reqId,
  });

  try {
    // 1. Essayer NextAuth via les cookies
    try {
      // Récupérer le token de session depuis les cookies
      const sessionToken =
        request.cookies.get('next-auth.session-token')?.value ||
        request.cookies.get('__Secure-next-auth.session-token')?.value ||
        request.cookies.get('authjs.session-token')?.value ||
        request.cookies.get('__Secure-authjs.session-token')?.value;

      if (sessionToken) {
        const secret =
          process.env['AUTH_SECRET'] ??
          process.env['NEXTAUTH_SECRET'] ??
          'fallback-secret-for-development';

        try {
          const decoded = await decode({
            token: sessionToken,
            secret: secret,
            salt: secret,
          });

          if (decoded && decoded.email) {
            const userId = (decoded.sub || decoded['userId'] || '') as string;
            log.debug(
              { userId, email: decoded.email, authMethod: 'NextAuth' },
              'User authenticated via NextAuth'
            );

            return {
              id: userId,
              email: decoded.email as string,
              role: (decoded.role as string) || 'CUSTOMER',
            };
          }
        } catch (decodeError: any) {
          // Ignorer les erreurs de décryptage silencieusement si le token est invalide/expiré
          // Cela peut arriver avec des sessions expirées ou des secrets différents
          if (
            decodeError?.message &&
            !decodeError.message.includes('decryption')
          ) {
            log.warn(
              { error: decodeError.message, authMethod: 'NextAuth' },
              'Error decoding session token'
            );
            Sentry.captureException(decodeError, {
              tags: {
                component: 'AuthMiddleware',
                action: 'authenticateUser',
                authMethod: 'NextAuth',
              },
              level: 'warning',
            });
          }
          // Ne pas logger les erreurs de décryptage normales (sessions expirées, etc.)
        }
      }
    } catch (authError) {
      // Erreur générale d'authentification - ignorer silencieusement
      // Les erreurs de décryptage sont normales pour les sessions expirées
      log.debug(
        { error: authError },
        'NextAuth authentication attempt failed (normal for expired sessions)'
      );
    }

    // 2. Essayer JWT via le header Authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const jwtSecret = process.env['JWT_SECRET'];
        if (!jwtSecret) {
          log.warn('JWT_SECRET not configured');
          return null;
        }

        const decoded = jwt.verify(token, jwtSecret) as any;

        if (decoded.type === 'access' && decoded.userId && decoded.email) {
          log.debug(
            {
              userId: decoded.userId,
              email: decoded.email,
              role: decoded.role,
              authMethod: 'JWT',
            },
            'User authenticated via JWT'
          );

          return {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role || 'CUSTOMER',
          };
        }
      } catch (jwtError) {
        log.debug(
          { error: jwtError, authMethod: 'JWT' },
          'JWT verification failed (normal for invalid/expired tokens)'
        );
        // Ne pas logger les erreurs JWT normales (tokens invalides/expirés)
        // Seulement capturer les erreurs critiques
        if (jwtError instanceof jwt.JsonWebTokenError) {
          // Erreur de format de token - peut être critique
          Sentry.captureException(jwtError, {
            tags: {
              component: 'AuthMiddleware',
              action: 'authenticateUser',
              authMethod: 'JWT',
              errorType: 'JsonWebTokenError',
            },
            level: 'warning',
          });
        }
      }
    }

    log.debug('No valid authentication found');
    return null;
  } catch (error) {
    log.error({ error }, 'Authentication error');
    Sentry.captureException(error, {
      tags: {
        component: 'AuthMiddleware',
        action: 'authenticateUser',
      },
      extra: {
        url: request.url,
        method: request.method,
      },
    });
    return null;
  }
}
