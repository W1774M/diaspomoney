"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Utiliser l'URL de base depuis l'environnement ou détecter depuis le client
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env['NEXT_PUBLIC_API_URL'] || process.env['NEXTAUTH_URL'] || 'https://app.diaspomoney.fr');
  
  return (
    <SessionProvider 
      refetchInterval={0} // Désactiver le refetch automatique pour éviter les appels multiples
      refetchOnWindowFocus={false} // Désactiver pour éviter les timeouts
      basePath="/api/auth"
      baseUrl={baseUrl}
    >
      {children}
    </SessionProvider>
  );
}
