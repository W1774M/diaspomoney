import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect, useState } from "react";

interface OAuthStatus {
  isOAuthUser: boolean;
  isVerified: boolean;
  needsEmailVerification: boolean;
  provider: string | null;
}

export function useOAuthStatus() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [oauthStatus, setOAuthStatus] = useState<OAuthStatus>({
    isOAuthUser: false,
    isVerified: false,
    needsEmailVerification: false,
    provider: null,
  });

  useEffect(() => {
    if (!isAuthenticated || !user || isLoading) {
      setOAuthStatus({
        isOAuthUser: false,
        isVerified: false,
        needsEmailVerification: false,
        provider: null,
      });
      return;
    }

    // Vérifier si c'est un utilisateur OAuth
    const isOAuthUser =
      user.oauth && (user.oauth.google?.linked || user.oauth.facebook?.linked);

    // Déterminer le provider
    let provider: string | null = null;
    if (user.oauth?.google?.linked) provider = "google";
    else if (user.oauth?.facebook?.linked) provider = "facebook";

    // Vérifier si l'utilisateur est vérifié
    const isVerified =
      user.status === "ACTIVE" &&
      (user as any).isEmailVerified === true &&
      (user as any).emailVerified === true;

    // Pour les utilisateurs OAuth, ils ne devraient jamais avoir besoin de vérification d'email
    const needsEmailVerification = !isOAuthUser && !isVerified;

    setOAuthStatus({
      isOAuthUser: Boolean(isOAuthUser),
      isVerified: Boolean(isVerified),
      needsEmailVerification: Boolean(needsEmailVerification),
      provider,
    });
  }, [isAuthenticated, user, isLoading]);

  return oauthStatus;
}
