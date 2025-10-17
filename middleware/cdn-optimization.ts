/**
 * Middleware CDN Optimization - DiaspoMoney
 * Optimisation automatique des assets avec CDN
 * Basé sur la charte de développement Company-Grade
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAssetURL, getCacheRules } from '@/config/cdn';

// Configuration des règles de cache
const CACHE_RULES = getCacheRules();

// Fonction pour déterminer le type de fichier
function getFileType(pathname: string): string | null {
  const extension = pathname.split('.').pop()?.toLowerCase();

  if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'avif'].includes(extension || '')) {
    return 'images';
  }
  if (extension === 'css') return 'css';
  if (extension === 'js') return 'js';
  if (['woff', 'woff2', 'ttf', 'otf'].includes(extension || '')) return 'fonts';
  if (['pdf', 'doc', 'docx'].includes(extension || '')) return 'documents';

  return null;
}

// Fonction pour appliquer les règles de cache
function applyCacheHeaders(response: NextResponse, fileType: string): NextResponse {
  const rule = CACHE_RULES.find(r => {
    const extensions = r.pattern.split(',').map(p => p.replace('*', '').replace('.', ''));
    return extensions.some(ext => response.url.includes(`.${ext}`));
  });

  if (rule) {
    response.headers.set('Cache-Control', `public, max-age=${rule.ttl}, immutable`);
    response.headers.set('CDN-Cache-Control', `max-age=${rule.ttl}`);
    response.headers.set('Vary', 'Accept-Encoding');
  }

  return response;
}

// Fonction pour optimiser les images
function optimizeImageRequest(request: NextRequest): NextRequest {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Vérifier si c'est une image
  if (!pathname.match(/\.(jpg|jpeg|png|webp|gif|avif)$/i)) {
    return request;
  }

  // Extraire les paramètres d'optimisation
  const widthStr = url.searchParams.get('w');
  const heightStr = url.searchParams.get('h');
  const qualityStr = url.searchParams.get('q');
  const format = url.searchParams.get('f') as
    | "jpg"
    | "png"
    | "webp"
    | "avif"
    | undefined
    | null; // typing properly per lint

  // Si des paramètres d'optimisation sont présents, rediriger vers CDN
  if (widthStr || heightStr || qualityStr || format) {
    const width = typeof widthStr === "string" ? Number(widthStr) : undefined;
    const height = typeof heightStr === "string" ? Number(heightStr) : undefined;
    const quality = typeof qualityStr === "string" ? Number(qualityStr) : undefined;

    const optimizedUrl = getAssetURL(pathname, {
      width: width !== undefined && !isNaN(width) ? width : undefined,
      height: height !== undefined && !isNaN(height) ? height : undefined,
      quality: quality !== undefined && !isNaN(quality) ? quality : undefined,
      format: format && ["jpg", "png", "webp", "avif"].includes(format) ? format : undefined,
    });

    // Créer une nouvelle requête avec l'URL optimisée
    const newUrl = new URL(optimizedUrl, url.origin);
    newUrl.search = url.search;

    return new Request(newUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      // preserve other props? Not needed for GET
      redirect: request.redirect,
      // Keep as close as possible
    }) as unknown as NextRequest; // NextRequest type compatibility hack
  }

  return request;
}

// Fonction pour ajouter les headers de sécurité
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Headers de sécurité
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Headers de performance
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  return response;
}

// Fonction pour gérer la compression
function handleCompression(request: NextRequest, response: NextResponse): NextResponse {
  // Note: Normally, compression is handled by Next.js or the CDN,
  // not at the middleware level in Next.js 13+
  // This is only setting a header; actual compression is not handled here.
  const acceptEncoding = request.headers.get('accept-encoding') || '';

  if (acceptEncoding.includes('br')) {
    response.headers.set('Content-Encoding', 'br');
  } else if (acceptEncoding.includes('gzip')) {
    response.headers.set('Content-Encoding', 'gzip');
  }

  return response;
}

// Middleware principal
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorer les routes API et les pages internes Next.js
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // Gérer les assets statiques
  if (
    pathname.startsWith('/static/') ||
    pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|otf|pdf)$/i)
  ) {
    const staticFileType = getFileType(pathname);

    if (staticFileType) {
      // Rediriger vers CDN pour les assets optimisés
      const cdnUrl = getAssetURL(pathname);

      if (cdnUrl !== pathname) {
        return NextResponse.redirect(cdnUrl, 301);
      }
    }
  }

  // Optimiser les requêtes d'images
  const optimizedRequest = optimizeImageRequest(request);

  // Créer la réponse
  const response = NextResponse.next();

  // Appliquer les headers de cache
  const mainFileType = getFileType(pathname);
  if (mainFileType) {
    applyCacheHeaders(response, mainFileType);
  }

  // Ajouter les headers de sécurité
  addSecurityHeaders(response);

  // Gérer la compression
  handleCompression(request, response);

  return response;
}

// Configuration du middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
