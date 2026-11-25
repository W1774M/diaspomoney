"use client";

import * as Sentry from "@sentry/nextjs";
import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";

/** Rattache les erreurs Sentry du navigateur à l'utilisateur (identifiant interne seul). */
function SentryUser() {
  const { data } = useSession();
  const userId = (data?.user as { id?: string } | undefined)?.id;
  useEffect(() => {
    Sentry.setUser(userId ? { id: String(userId) } : null);
  }, [userId]);
  return null;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // STRATÉGIE: Ne pas passer baseUrl à SessionProvider
  // NextAuth utilisera NEXTAUTH_URL pour les URLs absolues nécessaires (callbacks OAuth)
  // Mais le callback redirect() retourne toujours des chemins relatifs
  // Kubernetes/Traefik gère le routage entre les environnements
  return (
    <SessionProvider 
      refetchInterval={0} // Désactiver le refetch automatique pour éviter les appels multiples
      refetchOnWindowFocus={false} // Désactiver pour éviter les timeouts
      basePath="/api/auth"
      // Ne pas passer baseUrl - NextAuth utilisera NEXTAUTH_URL pour les callbacks OAuth uniquement
      // Les redirections internes sont toujours relatives grâce au callback redirect()
    >
      <SentryUser />
      {children}
    </SessionProvider>
  );
}
