import type { NextRequest } from 'next/server';

/**
 * Détermine l'URL publique (origin) vue par l'utilisateur final.
 * Utile derrière Traefik / reverse-proxy (x-forwarded-proto/host).
 *
 * Exemple: https://diaspomoney.fr
 */
export function getPublicBaseUrl(request: NextRequest): string {
  const url = new URL(request.url);

  const xfProtoRaw = request.headers.get('x-forwarded-proto');
  const xfHostRaw = request.headers.get('x-forwarded-host');
  const hostRaw = request.headers.get('host');

  const proto =
    (xfProtoRaw?.split(',')[0] || url.protocol.replace(':', '') || 'https').trim();

  const host =
    (xfHostRaw?.split(',')[0] || hostRaw || url.host).trim();

  return `${proto}://${host}`;
}


