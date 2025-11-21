"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

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
      {children}
    </SessionProvider>
  );
}
