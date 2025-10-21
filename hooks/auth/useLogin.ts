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
      // Utiliser NextAuth Credentials provider pour créer une session
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      // Vérifier le résultat de la connexion
      if (result?.error) {
        console.error('Erreur de connexion:', result.error);
        dispatch(authActions.loginFailure(result.error));
        addError(
          'Identifiants incorrects. Vérifiez votre email et mot de passe.'
        );
        return false;
      }

      if (result?.ok) {
        await handleLoginSuccess();
        return true;
      }

      // Si pas d'erreur mais pas de succès non plus
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
