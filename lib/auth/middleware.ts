/**
 * Middleware d'authentification
 * Gère à la fois NextAuth et les tokens JWT personnalisés
 */

import jwt from 'jsonwebtoken';
import { decode } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export async function authenticateUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
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
        const secret = process.env['AUTH_SECRET'] ?? process.env['NEXTAUTH_SECRET'] ?? 'fallback-secret-for-development';
        try {
          const decoded = await decode({
            token: sessionToken,
            secret: secret,
            salt: secret,
          });

          if (decoded && decoded.email) {
            return {
              id: (decoded.sub || decoded['userId'] || '') as string,
              email: decoded.email as string,
              role: 'CUSTOMER',
            };
          }
        } catch (decodeError: any) {
          // Ignorer les erreurs de décryptage silencieusement si le token est invalide/expiré
          // Cela peut arriver avec des sessions expirées ou des secrets différents
          if (decodeError?.message && !decodeError.message.includes('decryption')) {
            console.error('[AUTH] Error decoding session token:', decodeError.message);
          }
          // Ne pas logger les erreurs de décryptage normales (sessions expirées, etc.)
        }
      }
    } catch (authError) {
      // Erreur générale d'authentification - ignorer silencieusement
      // Les erreurs de décryptage sont normales pour les sessions expirées
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as any;

        if (decoded.type === 'access' && decoded.userId && decoded.email) {
          return {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role || 'CUSTOMER',
          };
        }
      } catch (jwtError) {
        console.log('JWT verification failed:', jwtError);
      }
    }

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}
