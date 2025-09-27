import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotificationManager } from "@/components/ui/Notification";
import { authActions, useDispatch } from "@/store/simple-store";

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  user?: any;
  error?: string;
  status?: string;
}

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const { addSuccess, addError, addWarning, addInfo } = useNotificationManager();

  const login = async (data: LoginData): Promise<boolean> => {
    setIsLoading(true);
    dispatch(authActions.loginStart());

    try {
      // Appel à l'API de login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: LoginResponse = await response.json();

      if (response.ok && result.success) {
        // Connexion réussie
        await handleLoginSuccess(result.user);
        return true;
      } else {
        // Gestion des erreurs
        handleLoginError(result);
        return false;
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      dispatch(authActions.loginFailure("Une erreur est survenue"));
      addError("Erreur lors de la connexion. Veuillez réessayer.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = async (user: any) => {
    // Créer une session locale
    const session = {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        roles: user.roles,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    };

    // Sauvegarder en localStorage
    localStorage.setItem("user-session", JSON.stringify(session));

    // Déclencher l'événement personnalisé pour notifier les autres composants
    window.dispatchEvent(new CustomEvent("user-session-changed"));

    // Dispatch success action
    dispatch(authActions.loginSuccess(user));

    addSuccess("Connexion réussie ! Redirection en cours...");

    // Redirection vers le dashboard
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  const handleLoginError = (result: LoginResponse) => {
    if (result.status === "INACTIVE") {
      dispatch(authActions.loginFailure("COMPTE_INACTIF"));
      addWarning(
        "Votre compte n'est pas encore activé. Veuillez vérifier votre boîte mail et cliquer sur le lien de vérification envoyé par DiaspoMoney."
      );
    } else if (result.status === "PENDING") {
      dispatch(authActions.loginFailure("COMPTE_EN_ATTENTE"));
      addInfo(
        "Votre compte est en cours de vérification par notre équipe DiaspoMoney. Veuillez patienter, nous vous contacterons bientôt."
      );
    } else if (result.status === "SUSPENDED") {
      dispatch(authActions.loginFailure("COMPTE_SUSPENDU"));
      addError(
        "Votre accès a été refusé car votre compte est suspendu. Veuillez contacter notre support pour plus d'informations."
      );
    } else {
      // Erreur générique
      dispatch(authActions.loginFailure(result.error || "Email ou mot de passe incorrect"));
      addError(result.error || "Email ou mot de passe incorrect");
    }
  };

  return {
    login,
    isLoading,
  };
};
