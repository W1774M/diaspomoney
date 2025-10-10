import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect, useState } from "react";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  countryOfResidence?: string;
  targetCountry?: string;
  targetCity?: string;
  monthlyBudget?: string;
  isOAuthUser?: boolean;
}

export function useOAuthProfileCheck() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.email || isChecking) return;

    const checkProfile = async () => {
      setIsChecking(true);
      try {
        const response = await fetch("/api/auth/user-profile");
        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);

          // Vérifier si l'utilisateur OAuth doit compléter son profil
          const isOAuthUser =
            profile.oauth &&
            (profile.oauth.google?.linked || profile.oauth.facebook?.linked);

          const needsCompletion =
            isOAuthUser &&
            (!profile.phone ||
              !profile.countryOfResidence ||
              !profile.targetCountry);

          setNeedsProfileCompletion(needsCompletion);
        }
      } catch (error) {
        console.error("Erreur vérification profil:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkProfile();
  }, [isAuthenticated, user?.email, isChecking]);

  return {
    needsProfileCompletion,
    userProfile,
    isChecking: isChecking || isLoading,
  };
}
