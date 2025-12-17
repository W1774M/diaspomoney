import { useNotificationManager } from '@/components/ui/Notification';
import { authEvents } from '@/lib/events';
import { childLogger } from '@/lib/logger';
import { clearAuthCache } from '@/lib/auth/auth-cache';
import { authActions, useSimpleStore } from '@/store/simple-store';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Créer un logger avec contexte pour ce hook
const logger = childLogger({ component: 'useLogin' });

interface LoginData {
  email: string;
  password: string;
}

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useSimpleStore(state => state.dispatch);
  const router = useRouter();
  const { update: refreshSession } = useSession();
  const { addSuccess, addError } = useNotificationManager();

  const login = async (data: LoginData): Promise<boolean> => {
    setIsLoading(true);
    dispatch(authActions.loginStart());

    try {
      // Masquer partiellement l'email pour la sécurité
      const maskedEmail = data.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
      logger.debug({ email: maskedEmail }, 'Tentative de connexion');

      // Utiliser NextAuth Credentials provider pour créer une session
      // Spécifier explicitement callbackUrl pour éviter les redirections non désirées
      let result:
        | {
            ok?: boolean;
            error?: string | null;
            url?: string | null;
            status?: number;
          }
        | undefined;
      try {
        // IMPORTANT: toujours utiliser un callbackUrl RELATIF.
        // Un callbackUrl absolu peut provoquer des erreurs "Invalid URL" / "Failed to construct"
        // selon la config NEXTAUTH_URL / proxy / environnement.
        const callbackUrl = '/dashboard';

        result = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
          callbackUrl: callbackUrl,
        });
        logger.debug({ callbackUrl }, 'signIn appelé avec succès');
      } catch (signInError: unknown) {
        const errorMessage =
          signInError instanceof Error
            ? signInError.message
            : 'Erreur inconnue';
        const errorName =
          signInError instanceof Error ? signInError.name : 'UnknownError';
        const errorStack =
          signInError instanceof Error ? signInError.stack : undefined;

        logger.error(
          {
            error: errorMessage,
            errorType: errorName,
            stack: errorStack,
          },
          "Erreur lors de l'appel à signIn",
        );
        // Si l'erreur est liée à une URL invalide, essayer sans callbackUrl
        if (
          (signInError instanceof Error &&
            signInError.message?.includes('Invalid URL')) ||
          (signInError instanceof Error &&
            signInError.message?.includes('Failed to construct'))
        ) {
          logger.warn(
            { originalError: errorMessage },
            'Tentative sans callbackUrl',
          );
          try {
            result = await signIn('credentials', {
              email: data.email,
              password: data.password,
              redirect: false,
            });
          } catch (retryError: unknown) {
            const errorMessage =
              retryError instanceof Error
                ? retryError.message
                : 'Erreur inconnue';
            const errorName =
              retryError instanceof Error ? retryError.name : 'UnknownError';

            logger.error(
              {
                error: errorMessage,
                errorType: errorName,
              },
              'Erreur lors de la tentative de reconnexion',
            );
            throw retryError;
          }
        } else {
          throw signInError;
        }
      }

      // Vérifier le résultat de la connexion
      // Dans NextAuth v5, signIn peut retourner undefined dans certains cas
      logger.debug(
        {
          resultType: typeof result,
          hasOk: result?.ok !== undefined,
          hasError: result?.error !== undefined,
          hasUrl: result?.url !== undefined,
        },
        'Résultat de signIn',
      );

      // Vérifier si result est un objet vide ou avec toutes les propriétés undefined
      if (result && typeof result === 'object') {
        const hasAnyValue = Object.values(result).some(
          val => val !== undefined && val !== null,
        );
        if (!hasAnyValue) {
          logger.warn(
            { result },
            'signIn a retourné un objet vide, traitement comme undefined',
          );
          result = undefined;
        }
      }

      // Si result est undefined ou toutes les propriétés sont undefined, vérifier la session directement
      if (
        result === undefined ||
        result === null ||
        (result.ok === undefined &&
          result.error === undefined &&
          result.url === undefined)
      ) {
        logger.warn(
          { result },
          'signIn a retourné undefined, vérification de la session',
        );

        // Attendre un peu pour que la session soit créée
        await new Promise(resolve => setTimeout(resolve, 500));

        // Vérifier la session en appelant l'API directement
        try {
          const sessionResponse = await fetch('/api/auth/session', {
            cache: 'no-store',
          });
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            if (sessionData?.user) {
              const maskedEmail =
                sessionData.user.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3') ||
                'unknown';
              logger.info({ email: maskedEmail }, 'Session créée avec succès');

              // Observer Pattern : Émettre l'événement de connexion réussie
              try {
                await authEvents.emitUserLoggedIn({
                  userId:
                    sessionData.user.id || sessionData.user.email || 'unknown',
                  email: sessionData.user.email || '',
                  timestamp: new Date(),
                  // ipAddress est optionnel, sera récupéré côté serveur si nécessaire
                });
                logger.debug(
                  { email: maskedEmail },
                  'Événement de connexion émis',
                );
              } catch (eventError: unknown) {
                const errorMessage =
                  eventError instanceof Error
                    ? eventError.message
                    : 'Erreur inconnue';
                logger.warn(
                  { error: errorMessage },
                  "Erreur lors de l'émission de l'événement de connexion",
                );
              }

              await handleLoginSuccess();
              return true;
            }
          } else {
            logger.error(
              {
                status: sessionResponse.status,
                statusText: sessionResponse.statusText,
              },
              'Erreur lors de la vérification de la session',
            );
            const errorText = await sessionResponse.text();
            logger.debug({ errorText }, "Détails de l'erreur de session");
          }
        } catch (sessionError: unknown) {
          const errorMessage =
            sessionError instanceof Error
              ? sessionError.message
              : 'Erreur inconnue';
          const errorName =
            sessionError instanceof Error ? sessionError.name : 'UnknownError';

          logger.error(
            {
              error: errorMessage,
              errorType: errorName,
            },
            'Erreur lors de la vérification de la session',
          );
        }

        // Si on arrive ici, la connexion a probablement échoué
        dispatch(authActions.loginFailure('Connexion échouée'));
        addError('Erreur lors de la connexion. Veuillez réessayer.');
        return false;
      }

      // Si NextAuth a retourné une URL de redirection avec localhost, la corriger
      if (result?.url && result.url.includes('localhost')) {
        logger.warn(
          { url: result.url },
          'NextAuth a retourné une URL avec localhost, correction nécessaire',
        );
        // Extraire le chemin de l'URL et ignorer le domaine localhost
        try {
          const urlObj = new URL(result.url);
          const correctedPath = urlObj.pathname + urlObj.search;
          logger.debug({ correctedPath }, 'Chemin corrigé');
          // Ne pas utiliser cette URL, on utilisera router.push avec le chemin relatif
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Erreur inconnue';

          logger.warn(
            {
              url: result.url,
              error: errorMessage,
            },
            "Impossible de parser l'URL",
          );
        }
      }

      // Si NextAuth a retourné une URL de redirection (vers /api/auth/error), l'ignorer
      // car on gère les erreurs côté client avec des toasts
      if (result?.url && result.url.includes('/api/auth/error')) {
        logger.warn(
          { url: result.url },
          'NextAuth a tenté de rediriger vers /api/auth/error',
        );

        // Extraire le code d'erreur de l'URL si disponible
        try {
          const urlObj = new URL(result.url);
          const errorParam = urlObj.searchParams.get('error');
          logger.warn(
            { errorCode: errorParam },
            "Code d'erreur extrait de l'URL",
          );
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Erreur inconnue';

          logger.warn(
            {
              url: result.url,
              error: errorMessage,
            },
            "Impossible d'extraire l'erreur de l'URL",
          );
        }

        // Ne pas suivre cette redirection, traiter comme une erreur
        dispatch(authActions.loginFailure('CredentialsSignin'));
        addError(
          'Identifiants incorrects. Vérifiez votre email et mot de passe.',
        );
        return false;
      }

      if (result?.error) {
        logger.error(
          {
            error: result.error || 'Erreur inconnue',
            url: result.url || undefined,
            status: result.status || undefined,
          },
          'Erreur de connexion',
        );

        dispatch(authActions.loginFailure(result.error || 'Erreur inconnue'));

        // Message d'erreur spécifique selon le type d'erreur
        const errorType = result.error || 'Unknown';
        const errorMessage =
          errorType === 'CredentialsSignin'
            ? 'Identifiants incorrects. Vérifiez votre email et mot de passe.'
            : errorType === 'Callback'
            ? 'Erreur lors de la validation de la connexion. Veuillez réessayer.'
            : `Erreur lors de la connexion: ${errorType}. Veuillez réessayer.`;

        addError(errorMessage);
        return false;
      }

      const isSuccess =
        result?.ok === true ||
        result?.status === 200 ||
        (!!result?.url && !result?.error);

      if (isSuccess) {
        logger.info(
          { redirectUrl: '/dashboard' },
          'Connexion réussie, redirection vers /dashboard',
        );

        // Observer Pattern : Émettre l'événement de connexion réussie
        // Récupérer les infos utilisateur depuis la session
        try {
          const sessionResponse = await fetch('/api/auth/session', {
            cache: 'no-store',
          });
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            if (sessionData?.user) {
              await authEvents.emitUserLoggedIn({
                userId:
                  sessionData.user.id || sessionData.user.email || 'unknown',
                email: sessionData.user.email || data.email,
                timestamp: new Date(),
                // ipAddress est optionnel, sera récupéré côté serveur si nécessaire
              });
              logger.debug(
                { email: data.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') },
                'Événement de connexion émis',
              );
            }
          }
        } catch (eventError: unknown) {
          const errorMessage =
            eventError instanceof Error
              ? eventError.message
              : 'Erreur inconnue';
          logger.warn(
            { error: errorMessage },
            "Erreur lors de l'émission de l'événement de connexion",
          );
        }

        await handleLoginSuccess();
        return true;
      }

      // Si pas d'erreur mais pas de succès non plus (cas rare)
      logger.warn(
        {
          result: {
            ok: result?.ok,
            error: result?.error,
            url: result?.url,
          },
        },
        'Résultat inattendu de la connexion',
      );
      dispatch(authActions.loginFailure('Connexion échouée'));
      addError('Erreur lors de la connexion. Veuillez réessayer.');
      return false;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Gérer spécifiquement les AbortError (timeouts, annulations)
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn({ error: errorMessage }, 'Connexion annulée ou timeout');
        dispatch(authActions.loginFailure('Connexion annulée'));
        addError('La connexion a été annulée ou a expiré. Veuillez réessayer.');
        return false;
      }

      logger.error(
        {
          error: errorMessage,
          errorType: errorName,
          stack: errorStack,
        },
        'Erreur de connexion',
      );
      dispatch(authActions.loginFailure('Une erreur est survenue'));
      addError('Erreur lors de la connexion. Veuillez réessayer.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = async () => {
    // Important: purger le cache /api/users/me (et la promesse partagée) pour éviter
    // de réutiliser un ancien 401 immédiatement après login, ce qui casse la redirection
    // (AuthorizedRoute pense "non authentifié" et renvoie à /login).
    clearAuthCache();

    // La session NextAuth est maintenant établie côté cookies
    dispatch(authActions.loginSuccess({} as any));

    // Forcer la mise à jour du contexte NextAuth pour que useSession/AuthGuard
    // détectent immédiatement la session sans rechargement manuel.
    let sessionSynced = false;
    for (let i = 0; i < 3; i++) {
      try {
        const refreshed = await refreshSession?.();
        sessionSynced = !!refreshed?.user;
        logger.debug(
          { attempt: i + 1, sessionSynced },
          'Refresh NextAuth session après connexion',
        );
        if (sessionSynced) {
          break;
        }
      } catch (error) {
        logger.debug(
          {
            error:
              error instanceof Error ? error.message : String(error),
            attempt: i + 1,
          },
          'Échec du refresh NextAuth session, nouvelle tentative',
        );
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Récupérer les informations utilisateur pour l'email
    let userEmail = '';
    let userName = '';
    try {
      const sessionResponse = await fetch('/api/auth/session');
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        if (sessionData?.user) {
          userEmail = sessionData.user.email || '';
          userName = sessionData.user.name || `${sessionData.user.firstName || ''} ${sessionData.user.lastName || ''}`.trim() || 'Utilisateur';
        }
      }
    } catch (error) {
      logger.warn({ error }, 'Erreur lors de la récupération de la session pour l\'email');
    }

    // Envoyer l'email de notification de connexion (en arrière-plan, ne pas bloquer)
    if (userEmail && userName) {
      try {
        const { sendLoginSuccessEmail } = await import('@/lib/email/resend');
        sendLoginSuccessEmail(userEmail, userName).catch((emailError) => {
          logger.warn({ error: emailError }, 'Erreur lors de l\'envoi de l\'email de connexion');
        });
      } catch (importError) {
        logger.warn({ error: importError }, 'Erreur lors de l\'import de sendLoginSuccessEmail');
      }
    }

    // Afficher le toast de succès
    addSuccess('Connexion réussie ! Redirection vers votre dashboard...');

    // Attendre que l'authentification soit complètement validée
    // Vérifier plusieurs fois que la session est bien établie
    let sessionValidated = false;
    for (let i = 0; i < 5; i++) {
      try {
        const sessionResponse = await fetch('/api/auth/session', {
          cache: 'no-store',
        });
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData?.user) {
            sessionValidated = true;
            break;
          }
        }
      } catch (error) {
        logger.debug({ attempt: i + 1 }, 'Tentative de validation de session');
      }
      // Attendre 200ms entre chaque tentative
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!sessionValidated) {
      logger.warn('Session non validée après plusieurs tentatives, redirection quand même');
    }

    // Laisser le temps au toast d'apparaître
    await new Promise(resolve => setTimeout(resolve, 800));

    // Normaliser et sécuriser l'URL de redirection
    const normalizeRedirectUrl = (url?: string | null) => {
      if (!url) return '/dashboard';

      // Autoriser uniquement les redirections internes pour éviter les open redirects
      if (typeof window === 'undefined') {
        return url.startsWith('/') ? url : '/dashboard';
      }

      try {
        const parsed = new URL(url, window.location.origin);
        if (parsed.origin !== window.location.origin) {
          return '/dashboard';
        }
        return parsed.pathname + parsed.search + parsed.hash;
      } catch (_err) {
        return url.startsWith('/') ? url : '/dashboard';
      }
    };

    // Vérifier s'il y a une URL de callback stockée
    const rawCallbackUrl =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('authCallbackUrl')
        : null;
    const redirectUrl = normalizeRedirectUrl(rawCallbackUrl);

    logger.info(
      {
        redirectUrl,
        hasCallbackUrl: !!rawCallbackUrl,
        sessionValidated,
      },
      'Redirection après connexion réussie',
    );

    // Nettoyer l'URL de callback du sessionStorage
    if (rawCallbackUrl && typeof window !== 'undefined') {
      sessionStorage.removeItem('authCallbackUrl');
    }

    // Rafraîchir le router si disponible, mais ne pas bloquer la redirection en cas d'erreur
    try {
      router.refresh?.();
    } catch (refreshError) {
      logger.debug(
        {
          error:
            refreshError instanceof Error
              ? refreshError.message
              : String(refreshError),
        },
        'Échec du refresh router avant redirection, poursuite du flow',
      );
    }

    // Laisser un léger délai pour que la session soit prise en compte
    await new Promise(resolve => setTimeout(resolve, 300));

    // Utiliser le router pour la navigation, fallback sur window.location
    try {
      router.replace(redirectUrl);
    } catch (navigationError) {
      logger.warn(
        {
          error:
            navigationError instanceof Error
              ? navigationError.message
              : String(navigationError),
        },
        'router.replace a échoué, fallback vers window.location',
      );
      if (typeof window !== 'undefined') {
        window.location.assign(redirectUrl);
      }
    }
  };

  return {
    login,
    isLoading,
  };
};
