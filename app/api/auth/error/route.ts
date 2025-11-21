import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { HTTP_REDIRECT_TEMPORARY, ROUTES } from '@/lib/constants/routes';

/**
 * Route handler pour rediriger immédiatement vers /login avec les paramètres d'erreur
 * Centralisation des types et constantes, utilisation du logger custom
 */
function handleErrorRedirect(request: NextRequest) {
  logger.warn(
    {
      method: request.method,
      path: request.nextUrl.pathname,
      query: request.nextUrl.search,
    },
    '[AUTH][error] Request to /api/auth/error'
  );

  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');
  logger.warn({ error }, '[AUTH][error] Error parameter');

  // Détermination de l'origine
  const host = request.headers.get('host') || '';
  // Déterminer le protocole en fonction de l'environnement ou des headers
  const protocol =
    request.nextUrl.protocol ||
    (process.env.NODE_ENV === 'development' ? 'http:' : 'https:');
  const origin = host
    ? `${protocol}//${host}`
    : request.url.split('/api')[0];

  const loginUrl = new URL(ROUTES.LOGIN, origin);

  // Préserver le paramètre d'erreur
  if (error) {
    loginUrl.searchParams.set('error', error);
  }

  logger.info(
    { target: loginUrl.toString() },
    '[AUTH][error] Redirecting to'
  );

  return NextResponse.redirect(loginUrl, HTTP_REDIRECT_TEMPORARY);
}

// Gérer toutes les méthodes HTTP possibles
export async function GET(request: NextRequest) {
  return handleErrorRedirect(request);
}

export async function POST(request: NextRequest) {
  return handleErrorRedirect(request);
}

export async function PUT(request: NextRequest) {
  return handleErrorRedirect(request);
}

export async function DELETE(request: NextRequest) {
  return handleErrorRedirect(request);
}

export async function PATCH(request: NextRequest) {
  return handleErrorRedirect(request);
}

export async function HEAD(request: NextRequest) {
  return handleErrorRedirect(request);
}

export async function OPTIONS(request: NextRequest) {
  return handleErrorRedirect(request);
}
