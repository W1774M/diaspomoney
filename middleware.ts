import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
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
}

export const config = {
  matcher: ['/:path*'], // Intercepte toutes les pages
};
