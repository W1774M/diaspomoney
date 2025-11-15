import { useNotificationManager } from '@/components/ui/Notification';
import { authActions, useSimpleStore } from '@/store/simple-store';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LoginData {
  email: string;
  password: string;
}

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useSimpleStore(state => state.dispatch);
  const router = useRouter();
  // const { refreshAuth } = useAuth();
  const { addSuccess, addError } = useNotificationManager();

  const login = async (data: LoginData): Promise<boolean> => {
    setIsLoading(true);
    dispatch(authActions.loginStart());

    try {
      console.log('[useLogin] Tentative de connexion pour:', data.email);
      
      // Utiliser NextAuth Credentials provider pour créer une session
      // Spécifier explicitement callbackUrl pour éviter les redirections non désirées
      let result;
      try {
        // Construire callbackUrl de manière sécurisée
        const callbackUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/dashboard`
          : '/dashboard';
        
        result = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
          callbackUrl: callbackUrl,
        });
        console.log('[useLogin] signIn appelé avec succès');
      } catch (signInError: any) {
        console.error('[useLogin] Erreur lors de l\'appel à signIn:', signInError);
        // Si l'erreur est liée à une URL invalide, essayer sans callbackUrl
        if (signInError?.message?.includes('Invalid URL') || signInError?.message?.includes('Failed to construct')) {
          console.warn('[useLogin] Tentative sans callbackUrl...');
          try {
            result = await signIn('credentials', {
              email: data.email,
              password: data.password,
              redirect: false,
            });
          } catch (retryError) {
            console.error('[useLogin] Erreur lors de la tentative de reconnexion:', retryError);
            throw retryError;
          }
        } else {
          throw signInError;
        }
      }

      // Vérifier le résultat de la connexion
      // Dans NextAuth v5, signIn peut retourner undefined dans certains cas
      console.log('[useLogin] Résultat de signIn:', result);
      console.log('[useLogin] Type de résultat:', typeof result);
      console.log('[useLogin] Résultat détaillé:', JSON.stringify(result, null, 2));
      
      // Vérifier si result est un objet vide ou avec toutes les propriétés undefined
      if (result && typeof result === 'object') {
        const hasAnyValue = Object.values(result).some(val => val !== undefined && val !== null);
        if (!hasAnyValue) {
          console.warn('[useLogin] signIn a retourné un objet vide, traitement comme undefined');
          result = undefined;
        }
      }
      
      // Si result est undefined ou toutes les propriétés sont undefined, vérifier la session directement
      if (result === undefined || result === null || 
          (result.ok === undefined && result.error === undefined && result.url === undefined)) {
        console.warn('[useLogin] signIn a retourné undefined, vérification de la session...');
        
        // Attendre un peu pour que la session soit créée
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Vérifier la session en appelant l'API directement
        try {
          const sessionResponse = await fetch('/api/auth/session');
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            if (sessionData?.user) {
              console.log('[useLogin] Session créée avec succès:', sessionData.user.email);
              await handleLoginSuccess();
              return true;
            }
          } else {
            console.error('[useLogin] Erreur lors de la vérification de la session:', sessionResponse.status);
            const errorText = await sessionResponse.text();
            console.error('[useLogin] Détails de l\'erreur:', errorText);
          }
        } catch (sessionError) {
          console.error('[useLogin] Erreur lors de la vérification de la session:', sessionError);
        }
        
        // Si on arrive ici, la connexion a probablement échoué
        dispatch(authActions.loginFailure('Connexion échouée'));
        addError('Erreur lors de la connexion. Veuillez réessayer.');
        return false;
      }
      
      // Si NextAuth a retourné une URL de redirection avec localhost, la corriger
      if (result?.url && result.url.includes('localhost')) {
        console.warn('[useLogin] NextAuth a retourné une URL avec localhost, correction nécessaire');
        // Extraire le chemin de l'URL et ignorer le domaine localhost
        try {
          const urlObj = new URL(result.url);
          const correctedPath = urlObj.pathname + urlObj.search;
          console.log('[useLogin] Chemin corrigé:', correctedPath);
          // Ne pas utiliser cette URL, on utilisera router.push avec le chemin relatif
        } catch (e) {
          console.warn('[useLogin] Impossible de parser l\'URL:', result.url);
        }
      }
      
      // Si NextAuth a retourné une URL de redirection (vers /api/auth/error), l'ignorer
      // car on gère les erreurs côté client avec des toasts
      if (result?.url && result.url.includes('/api/auth/error')) {
        console.warn('[useLogin] NextAuth a tenté de rediriger vers /api/auth/error');
        console.warn('[useLogin] URL complète:', result.url);
        
        // Extraire le code d'erreur de l'URL si disponible
        try {
          const urlObj = new URL(result.url);
          const errorParam = urlObj.searchParams.get('error');
          console.warn('[useLogin] Code d\'erreur extrait:', errorParam);
        } catch (e) {
          console.warn('[useLogin] Impossible d\'extraire l\'erreur de l\'URL');
        }
        
        // Ne pas suivre cette redirection, traiter comme une erreur
        dispatch(authActions.loginFailure('CredentialsSignin'));
        addError('Identifiants incorrects. Vérifiez votre email et mot de passe.');
        return false;
      }
      
      if (result?.error) {
        console.error('[useLogin] Erreur de connexion:', result.error);
        console.error('[useLogin] Détails de l\'erreur:', {
          error: result.error,
          url: result.url,
          status: result.status,
        });
        
        dispatch(authActions.loginFailure(result.error));
        
        // Message d'erreur spécifique selon le type d'erreur
        const errorMessage = result.error === 'CredentialsSignin' 
          ? 'Identifiants incorrects. Vérifiez votre email et mot de passe.'
          : result.error === 'Callback'
          ? 'Erreur lors de la validation de la connexion. Veuillez réessayer.'
          : `Erreur lors de la connexion: ${result.error}. Veuillez réessayer.`;
        
        addError(errorMessage);
        return false;
      }

      if (result?.ok) {
        console.log('[useLogin] Connexion réussie, redirection vers /dashboard');
        await handleLoginSuccess();
        return true;
      }

      // Si pas d'erreur mais pas de succès non plus (cas rare)
      console.warn('[useLogin] Résultat inattendu:', result);
      dispatch(authActions.loginFailure('Connexion échouée'));
      addError('Erreur lors de la connexion. Veuillez réessayer.');
      return false;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      dispatch(authActions.loginFailure('Une erreur est survenue'));
      addError('Erreur lors de la connexion. Veuillez réessayer.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = async () => {
    // La session NextAuth est maintenant établie côté cookies
    dispatch(authActions.loginSuccess({} as any));
    addSuccess('Connexion réussie ! Redirection en cours...');

    // Vérifier s'il y a une URL de callback stockée
    const callbackUrl = sessionStorage.getItem('authCallbackUrl');
    const redirectUrl = callbackUrl || '/dashboard';

    // Nettoyer l'URL de callback du sessionStorage
    if (callbackUrl) {
      sessionStorage.removeItem('authCallbackUrl');
    }

    // Redirection vers l'URL appropriée
    router.push(redirectUrl);
  };

  return {
    login,
    isLoading,
  };
};
