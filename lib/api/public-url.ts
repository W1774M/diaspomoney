import type { NextRequest } from 'next/server';

/**
 * Détermine l'URL publique (origin) vue par l'utilisateur final.
 * Utile derrière Traefik / reverse-proxy (x-forwarded-proto/host).
 *
 * Exemple: https://diaspomoney.fr
 */
export function getPublicBaseUrl(request: NextRequest): string {
  // En prod, on DOIT éviter de dériver le domaine depuis Host/X-Forwarded-Host
  // (ex: si l'app est accessible via plusieurs domaines, ou si un sous-domaine
  // est utilisé côté client). On préfère donc une source de vérité configurée.
  const configuredBaseUrl = normalizeBaseUrl(
    process.env['NEXTAUTH_URL'] ||
      process.env['NEXT_PUBLIC_APP_URL'] ||
      process.env['APP_URL'] ||
      process.env['NEXT_PUBLIC_URL'] ||
      process.env['NEXT_PUBLIC_BASE_URL'] ||
      process.env['PUBLIC_URL'] ||
      // Certains environnements exposent un domaine nu (sans schéma)
      // via DOMAIN/PROD_DOMAIN. On le transforme en URL HTTPS valide.
      (process.env['NODE_ENV'] === 'production'
        ? toHttpsUrlFromDomain(
            process.env['PROD_DOMAIN'] || process.env['DOMAIN'] || '',
          )
        : '') ||
      '',
  );
  if (configuredBaseUrl) return configuredBaseUrl;

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

function normalizeBaseUrl(value: string): string | null {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;

  try {
    // Autoriser des valeurs sans schéma, ex: "diaspomoney.fr"
    const u = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

function toHttpsUrlFromDomain(domain: string): string {
  const d = (domain || '').trim();
  if (!d) return '';
  return d.includes('://') ? d : `https://${d}`;
}


