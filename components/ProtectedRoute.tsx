"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  fallback = null,
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();
  const { isOAuthUser } = useOAuthStatus();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    // Vérifier si l'utilisateur est actif
    if (!isLoading && isAuthenticated && user && user.status !== "ACTIVE") {
      // Pour les utilisateurs OAuth, ils sont toujours considérés comme actifs
      if (isOAuthUser) {
        // Les utilisateurs OAuth ne devraient jamais être bloqués
        return;
      }

      // Rediriger vers la page appropriée selon le statut
      if (user.status === "INACTIVE") {
        router.push("/verify-email");
        return;
      } else if (user.status === "PENDING") {
        router.push("/login?status=pending");
        return;
      } else if (user.status === "SUSPENDED") {
        router.push("/login?status=suspended");
        return;
      }
    }

    if (!isLoading && isAuthenticated && requireAdmin && !isAdmin()) {
      router.push("/dashboard");
      return;
    }
  }, [
    isAuthenticated,
    isLoading,
    requireAdmin,
    isAdmin,
    router,
    user,
    isOAuthUser,
  ]);

  // Afficher un message de chargement pendant la vérification
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  // Ne pas afficher le contenu si non connecté, utilisateur non actif, ou si admin requis mais non admin
  if (
    !isAuthenticated ||
    (user && user.status !== "ACTIVE" && !isOAuthUser) ||
    (requireAdmin && !isAdmin())
  ) {
    return fallback;
  }

  return <>{children}</>;
}
function useOAuthStatus(): { isOAuthUser: any } {
  throw new Error("Function not implemented.");
}
