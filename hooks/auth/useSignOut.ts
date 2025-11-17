'use client';

import { authEvents } from '@/lib/events';
import { childLogger } from '@/lib/logger';
import { signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Créer un logger avec contexte pour ce hook
const logger = childLogger({ component: 'useSignOut' });

export function useSignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const signOut = async () => {
    if (isSigningOut) return; // Éviter les déconnexions multiples

    setIsSigningOut(true);

    try {
      logger.debug('Déconnexion en cours...');

      // Récupérer l'ID utilisateur avant la déconnexion pour l'événement
      let userId: string | undefined;
      try {
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          userId =
            sessionData?.user?.id || sessionData?.user?.email || undefined;
        }
      } catch (e) {
        // Ignorer les erreurs de récupération de session
      }

      // Déconnecter la session NextAuth
      await nextAuthSignOut({
        redirect: false,
        callbackUrl: '/login',
      });

      logger.debug('Session NextAuth déconnectée');

      // Observer Pattern : Émettre l'événement de déconnexion
      if (userId) {
        try {
          await authEvents.emitUserLoggedOut(userId);
          logger.debug({ userId }, 'Événement de déconnexion émis');
        } catch (eventError: unknown) {
          const errorMessage =
            eventError instanceof Error
              ? eventError.message
              : 'Erreur inconnue';
          logger.warn(
            { error: errorMessage },
            "Erreur lors de l'émission de l'événement de déconnexion",
          );
        }
      }

      // Nettoyer le localStorage/sessionStorage si nécessaire
      if (typeof window !== 'undefined') {
        // Nettoyer les données locales
        localStorage.removeItem('user-session');
        sessionStorage.clear();

        // Nettoyer les cookies de session si nécessaire
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          if (name.includes('next-auth') || name.includes('session')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      }

      logger.debug('Données locales nettoyées');

      // Rediriger vers la page de connexion
      router.push('/login');

      // Forcer un rechargement pour s'assurer que tout est nettoyé
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error(
        {
          error: errorMessage,
          errorType: error instanceof Error ? error.name : 'UnknownError',
        },
        'Erreur lors de la déconnexion',
      );

      // En cas d'erreur, forcer la redirection
      router.push('/login');
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } finally {
      setIsSigningOut(false);
    }
  };

  return {
    signOut,
    isSigningOut,
  };
}
