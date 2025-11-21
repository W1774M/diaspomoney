import { logger } from '@sentry/nextjs';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Proxy Next.js 16
// Gère les redirections HTTPS et l'authentification
export default function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIp = request.headers.get('x-real-ip');
  const xfProto = request.headers.get('x-forwarded-proto');
  
  // Check if host is an IP address or localhost (internal request)
  const isIpAddress = /^\d+\.\d+\.\d+\.\d+(:\d+)?$/.test(host);
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  const isInternalHost = isIpAddress || isLocalhost;
  
  // Detect if request is from Traefik (internal) or external
  // Traefik adds x-forwarded-for and x-real-ip headers
  // If these are missing AND host is IP/localhost, it's an internal request
  const isInternalRequest = (!xForwardedFor && !xRealIp) || isInternalHost;
  
  // ---- HTTPS ENFORCEMENT ONLY ----
  // IMPORTANT: Never redirect between different hostnames
  // Each environment (dev, rct, prod) must work independently
  // Only enforce HTTPS redirect for the SAME hostname
  
  // List of allowed hosts (each environment is independent)
  const allowedHosts = ['app.diaspomoney.fr', 'dev.diaspomoney.fr', 'rct.diaspomoney.fr'];
  const isAllowedHost = allowedHosts.some(allowed => host === allowed || host.startsWith(`${allowed}:`));

    // Only enforce HTTPS redirect for external HTTP requests coming through Traefik
  // CRITICAL: Use the same hostname, never change it
  if (!isInternalRequest && isAllowedHost && xfProto === 'http' && xForwardedFor) {
    // Build URL using the current request hostname to ensure it stays the same
    const currentUrl = request.nextUrl;
    const redirectUrl = new URL(currentUrl.pathname + currentUrl.search, `https://${host}`);
    // Ensure hostname stays the same (no canonical redirect)
    logger.info('[MIDDLEWARE] HTTPS redirect:', {
      from: request.url,
      to: redirectUrl.toString(),
      host,
    });
    return NextResponse.redirect(redirectUrl, 308);
    }
  
  // Explicitly prevent any hostname redirection
  // If host is not in allowed list, just continue (don't redirect)
  
  // Log for debugging (can be removed in production)
  // Log toujours pour diagnostiquer les problèmes de redirection
  logger.info('[MIDDLEWARE] Request:', {
    host,
    xForwardedFor,
    xRealIp,
    xfProto,
    isInternalRequest,
    isAllowedHost,
    url: request.nextUrl.toString(),
    nextPublicAppUrl: process.env['NEXT_PUBLIC_APP_URL'],
    nextAuthUrl: process.env.NEXTAUTH_URL,
  });

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
    pathname.startsWith(path),
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
      // IMPORTANT: Use the same hostname
      const loginUrl = new URL("/login", request.url);
      logger.info('[MIDDLEWARE] Redirecting to login:', {
        from: request.url,
        to: loginUrl.toString(),
        host,
      });
      return NextResponse.redirect(loginUrl);
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
      // IMPORTANT: Use the same hostname
      const dashboardUrl = new URL("/dashboard", request.url);
      logger.info('[MIDDLEWARE] Redirecting to dashboard:', {
        from: request.url,
        to: dashboardUrl.toString(),
        host,
      });
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Continue request and set x-request-id header
  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  return response;
}

// Export config for Next.js proxy
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

