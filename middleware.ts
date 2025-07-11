import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { addSecurityHeaders, securityMiddleware } from "./middleware/security";

export function middleware(request: NextRequest) {
  // 1. Appliquer le middleware de sécurité
  const securityResponse = securityMiddleware(request);
  if (securityResponse) {
    return addSecurityHeaders(securityResponse);
  }

  // 2. Logique d'authentification existante (commentée pour l'instant)
  // const url = new URL(request.url);
  // const path = url.pathname;

  // // Ne pas bloquer les pages /login et /not-authorized
  // if (path === '/login' || path === '/not-authorized') {
  //   return NextResponse.next();
  // }

  // const authCookie = request.cookies.get('auth');

  // // Si l'utilisateur a déjà un cookie "auth=true", on le laisse passer
  // if (authCookie?.value === 'true') {
  //   return NextResponse.next();
  // }

  // // Si pas de cookie "auth=true", redirige vers /login
  // return NextResponse.redirect(new URL('/login', request.url));

  // 3. Ajouter les headers de sécurité à toutes les réponses
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
