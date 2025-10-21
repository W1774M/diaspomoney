import { useAuth } from '@/hooks/auth/useAuth';

// interface UserProfile {
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone?: string;
//   countryOfResidence?: string;
//   targetCountry?: string;
//   targetCity?: string;
//   monthlyBudget?: string;
//   isOAuthUser?: boolean;
// }

export function useOAuthProfileCheck() {
  const { isLoading } = useAuth();

  // Désactiver temporairement la vérification OAuth pour éviter la boucle infinie
  return {
    needsProfileCompletion: false,
    userProfile: null,
    isChecking: isLoading,
  };
}
