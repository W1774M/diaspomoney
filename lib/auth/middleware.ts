/**
 * Middleware d'authentification
 * Gère à la fois NextAuth et les tokens JWT personnalisés
 */

import { auth } from '@/lib/auth';
import jwt from 'jsonwebtoken';
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
    // 1. Essayer NextAuth d'abord
    const session = await auth();
    if (session?.user?.email) {
      return {
        id: session.user.id || '',
        email: session.user.email,
        role: 'CUSTOMER', // Rôle par défaut
      };
    }

    // 2. Essayer le token JWT personnalisé
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
        // Continue to return null
      }
    }

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}
