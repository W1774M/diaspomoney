/**
 * Composant de garde d'authentification
 * Implémente les design patterns :
 * - Middleware Pattern (protection des routes)
 * - Error Handling Pattern (gestion des redirections)
 * - Component Composition Pattern
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si pas de session et pas en cours de chargement, rediriger vers login
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // Show loading while determining session
  if (status === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  // Show fallback if unauthenticated (should not reach here due to redirect)
  if (status === 'unauthenticated') {
    return (
      fallback || (
        <div className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)] mx-auto mb-4'></div>
            <p className='text-gray-600'>
              Redirection vers la page de connexion...
            </p>
          </div>
        </div>
      )
    );
  }

  // Render children when authenticated
  return <>{children}</>;
}
