import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Proxy function (replaces middleware in Next.js 16)
export function proxy(request: NextRequest) {
  // ---- CANONICAL HOST + HTTPS ENFORCEMENT (Production only) ----
  // Only enforce canonical host and HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    const url = request.nextUrl.clone();
    const xfProto = request.headers.get('x-forwarded-proto');
    const host = request.headers.get('host') || '';

    const canonicalHost = 'app.diaspomoney.fr';

    // Enforce canonical host
    if (host && host !== canonicalHost) {
      url.host = canonicalHost;
      url.protocol = 'https:';
      return NextResponse.redirect(url, 308);
    }

    // Enforce https when behind proxy
    if (xfProto === 'http') {
      url.protocol = 'https:';
      return NextResponse.redirect(url, 308);
    }
  }

  // ---- ACCESS CONTROL & SESSION CHECKS ----
  // Attach a request-id (existing or generated) to the response
  const incomingReqId = request.headers.get("x-request-id");
  const requestId =
    incomingReqId ||
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random()}`;

  const { pathname } = request.nextUrl;

  // Check if this is a protected path
  const protectedPaths = ["/dashboard"];
  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path)
  );

  // If protected path, check for session token
  if (isProtectedPath) {
    const sessionToken =
      request.cookies.get("next-auth.session-token") ||
      request.cookies.get("__Secure-next-auth.session-token") ||
      request.cookies.get("authjs.session-token") ||
      request.cookies.get("__Secure-authjs.session-token");

    if (!sessionToken) {
      // Not authenticated, redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If on login and already authenticated, redirect to dashboard
  if (pathname === "/login") {
    const sessionToken =
      request.cookies.get("next-auth.session-token") ||
      request.cookies.get("__Secure-next-auth.session-token") ||
      request.cookies.get("authjs.session-token") ||
      request.cookies.get("__Secure-authjs.session-token");
    if (sessionToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Continue request and set x-request-id header
  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  return response;
}

// Unified config for all relevant paths
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

