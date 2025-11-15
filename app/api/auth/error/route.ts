import { NextRequest, NextResponse } from 'next/server';

/**
 * Route handler pour rediriger immédiatement vers /login avec les paramètres d'erreur
 * Cette route intercepte les redirections NextAuth vers /api/auth/error
 * et redirige immédiatement vers /login sans afficher de page d'erreur
 * 
 * Gère toutes les méthodes HTTP (GET, POST, etc.) pour éviter les erreurs 405
 */
function handleErrorRedirect(request: NextRequest) {
  console.log('[AUTH][error] Request to /api/auth/error, method:', request.method);
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');
  
  console.log('[AUTH][error] Error parameter:', error);
  
  // Construire l'URL de redirection vers /login en utilisant l'origine de la requête
  // Cela garantit qu'on utilise le bon domaine (app.diaspomoney.fr) et non localhost
  const origin = request.headers.get('host') 
    ? `${request.nextUrl.protocol}//${request.headers.get('host')}`
    : request.url.split('/api')[0]; // Fallback: extraire l'origine depuis l'URL
  const loginUrl = new URL('/login', origin);
  
  // Préserver le paramètre d'erreur s'il existe
  if (error) {
    loginUrl.searchParams.set('error', error);
  }
  
  console.log('[AUTH][error] Redirecting to:', loginUrl.toString());
  
  // Rediriger immédiatement (redirection serveur HTTP 307, invisible pour l'utilisateur)
  return NextResponse.redirect(loginUrl, 307);
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

