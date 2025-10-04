import { useNotificationManager } from "@/components/ui/Notification";
import { authActions, useSimpleStore } from "@/store/simple-store";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      // signIn returns void when redirect: false is set, so we can't check result.ok
      // Assume success if no error is thrown
      await handleLoginSuccess();
      return true;
    } catch (error) {
      console.error("Erreur de connexion:", error);
      dispatch(authActions.loginFailure("Une erreur est survenue"));
      addError("Erreur lors de la connexion. Veuillez réessayer.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = async () => {
    // La session NextAuth est maintenant établie côté cookies
    dispatch(authActions.loginSuccess({} as any));
    addSuccess("Connexion réussie ! Redirection en cours...");

    // Attendre un peu pour que useAuth détecte le changement de session
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  return {
    login,
    isLoading,
  };
};
