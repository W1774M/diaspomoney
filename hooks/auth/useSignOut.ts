"use client";

import { signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function useSignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const signOut = async () => {
    if (isSigningOut) return; // Éviter les déconnexions multiples

    setIsSigningOut(true);

    try {
      // console.log("[useSignOut] Déconnexion en cours...");

      // Déconnecter la session NextAuth
      await nextAuthSignOut({
        redirect: false,
        callbackUrl: "/login",
      });

      // console.log("[useSignOut] Session NextAuth déconnectée");

      // Nettoyer le localStorage/sessionStorage si nécessaire
      if (typeof window !== "undefined") {
        // Nettoyer les données locales
        localStorage.removeItem("user-session");
        sessionStorage.clear();

        // Nettoyer les cookies de session si nécessaire
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          if (name.includes("next-auth") || name.includes("session")) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      }

      // console.log("[useSignOut] Données locales nettoyées");

      // Rediriger vers la page de connexion
      router.push("/login");

      // Forcer un rechargement pour s'assurer que tout est nettoyé
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
    } catch (error) {
      console.error("[useSignOut] Erreur lors de la déconnexion:", error);

      // En cas d'erreur, forcer la redirection
      router.push("/login");
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
    } finally {
      setIsSigningOut(false);
    }
  };

  return {
    signOut,
    isSigningOut,
  };
}
