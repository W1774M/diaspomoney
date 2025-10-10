import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware pour s'assurer que les utilisateurs OAuth
 * ne sont jamais bloqués par la vérification d'email
 */
export function oauthAuthMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes qui nécessitent une vérification d'email
  const emailVerificationRoutes = [
    "/dashboard",
    "/dashboard/appointments",
    "/dashboard/profile",
    "/dashboard/settings",
  ];

  // Si la route nécessite une vérification d'email
  if (emailVerificationRoutes.some(route => pathname.startsWith(route))) {
    // Vérifier si l'utilisateur a un token de session
    const sessionToken = request.cookies.get("next-auth.session-token")?.value;

    if (sessionToken) {
      // Pour les utilisateurs OAuth, on laisse passer
      // La logique de vérification OAuth se fait dans NextAuth
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

/**
 * Vérifie si un utilisateur est un utilisateur OAuth
 */
export function isOAuthUser(user: any): boolean {
  return (
    user?.oauth && (user.oauth.google?.linked || user.oauth.facebook?.linked)
  );
}

/**
 * Vérifie si un utilisateur OAuth doit être considéré comme vérifié
 */
export function isOAuthUserVerified(user: any): boolean {
  if (!isOAuthUser(user)) return false;

  return (
    user.status === "ACTIVE" &&
    user.isEmailVerified === true &&
    user.emailVerified === true
  );
}
