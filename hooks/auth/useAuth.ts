"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  status: string;
  avatar: {
    image: string;
    name: string;
  };
}

interface Session {
  user: User;
  expires: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionData = localStorage.getItem("user-session");
        if (sessionData) {
          const session: Session = JSON.parse(sessionData);

          // Vérifier si la session n'est pas expirée
          if (new Date(session.expires) > new Date()) {
            // Vérifier le statut de l'utilisateur
            if (session.user.status === "ACTIVE") {
              setUser(session.user);
              setIsAuthenticated(true);
            } else {
              // Utilisateur non actif, supprimer la session
              console.warn(
                `Session supprimée pour utilisateur ${session.user.email} avec statut ${session.user.status}`
              );
              localStorage.removeItem("user-session");
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            // Session expirée, la supprimer
            localStorage.removeItem("user-session");
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de session:", error);
        localStorage.removeItem("user-session");
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Vérifier la session au montage
    checkSession();

    // Écouter les changements de localStorage pour détecter les connexions/déconnexions
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user-session") {
        checkSession();
      }
    };

    // Écouter les événements de stockage (pour les changements dans d'autres onglets)
    window.addEventListener("storage", handleStorageChange);

    // Écouter les événements personnalisés pour les changements dans le même onglet
    const handleCustomStorageChange = () => {
      checkSession();
    };

    window.addEventListener("user-session-changed", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "user-session-changed",
        handleCustomStorageChange
      );
    };
  }, []);

  const signOut = () => {
    localStorage.removeItem("user-session");
    setUser(null);
    setIsAuthenticated(false);
    // Déclencher l'événement personnalisé pour notifier les autres composants
    window.dispatchEvent(new CustomEvent("user-session-changed"));
    router.push("/login");
  };

  const isAdmin = () => user?.roles.includes("ADMIN") || false;
  const isProvider = () => user?.roles.includes("PROVIDER") || false;
  const isCSM = () => user?.roles.includes("CSM") || false;
  const isCustomer = () => user?.roles.includes("CUSTOMER") || false;

  return {
    user,
    isLoading,
    isAuthenticated,
    signOut,
    isAdmin,
    isProvider,
    isCSM,
    isCustomer,
    status: isLoading
      ? "loading"
      : isAuthenticated
        ? "authenticated"
        : "unauthenticated",
  };
}
