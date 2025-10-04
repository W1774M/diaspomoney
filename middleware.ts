import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier si l'utilisateur est sur une page protégée
  const protectedPaths = ["/dashboard"];
  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path)
  );

  // Si c'est une page protégée, vérifier le token de session
  if (isProtectedPath) {
    // Supporter les cookies de session NextAuth v4 et Auth.js v5
    const sessionToken =
      request.cookies.get("next-auth.session-token") ||
      request.cookies.get("__Secure-next-auth.session-token") ||
      request.cookies.get("authjs.session-token") ||
      request.cookies.get("__Secure-authjs.session-token");

    // Si pas de token, rediriger vers login
    if (!sessionToken) {
      // console.log("[Middleware] No session token, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Si sur login et déjà authentifié, rediriger vers dashboard
  if (pathname === "/login") {
    // Supporter les cookies de session NextAuth v4 et Auth.js v5
    const sessionToken =
      request.cookies.get("next-auth.session-token") ||
      request.cookies.get("__Secure-next-auth.session-token") ||
      request.cookies.get("authjs.session-token") ||
      request.cookies.get("__Secure-authjs.session-token");

    if (sessionToken) {
      // console.log(
      //   "[Middleware] User already authenticated, redirecting to dashboard"
      // );
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
