/**
 * Accès protégé des environnements dev / rct.
 *
 * Remplace le basic auth Traefik : un mot de passe saisi une fois sur une page
 * dédiée, puis un cookie signé (HMAC-SHA256) valable 30 jours.
 * Actif uniquement si STAGING_ACCESS_PASSWORD et STAGING_ACCESS_SECRET sont définis
 * (jamais en prod, où ces variables sont absentes).
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const STAGING_ACCESS_PATH = '/__acces';
const COOKIE_NAME = 'diaspomoney_staging_access';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

/** Chemins joignables sans mot de passe (appels serveur à serveur). */
const PUBLIC_PATHS = ['/api/stripe/webhook', '/api/health', '/api/maintenance'];

function getConfig(): { password: string; secret: string } | null {
  const password = process.env['STAGING_ACCESS_PASSWORD'];
  const secret = process.env['STAGING_ACCESS_SECRET'];
  return password && secret ? { password, secret } : null;
}

const encoder = new TextEncoder();

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Comparaison en temps constant de deux chaînes. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Jeton = expiration + signature ; changer le mot de passe invalide tous les cookies. */
async function createToken(secret: string, password: string): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE;
  const signature = await hmac(secret, `${expires}.${password}`);
  return `${expires}.${signature}`;
}

async function isValidToken(token: string, secret: string, password: string): Promise<boolean> {
  const [expiresRaw, signature] = token.split('.');
  const expires = Number(expiresRaw);
  if (!signature || !Number.isFinite(expires) || expires < Date.now() / 1000) return false;
  return safeEqual(signature, await hmac(secret, `${expires}.${password}`));
}

function safeNext(value: string | null): string {
  // Uniquement des chemins internes, jamais une URL externe.
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function renderForm(next: string, error: boolean): NextResponse {
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light">
<title>Accès protégé – DiaspoMoney</title>
<style>
  :root { color-scheme: light; accent-color: #F97015; font-family: system-ui, sans-serif; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #FDF8F3; color: #1C1917; }
  main { width: min(100% - 2rem, 22rem); background: #fff; border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 30px rgb(0 0 0 / .08); }
  h1 { font-size: 1.25rem; margin: 0 0 .5rem; }
  p { margin: 0 0 1.5rem; color: #57534E; font-size: .95rem; }
  label { display: block; font-weight: 600; margin-bottom: .4rem; }
  input[type=password] { box-sizing: border-box; width: 100%; padding: .75rem; border: 1px solid #D6D3D1; border-radius: .5rem; font-size: 1rem; }
  input[type=password]:focus-visible { outline: 2px solid #F97015; outline-offset: 1px; }
  button { margin-top: 1rem; width: 100%; padding: .8rem; border: 0; border-radius: .5rem; background: #F97015; color: #fff; font-weight: 700; font-size: 1rem; cursor: pointer; }
  button:focus-visible { outline: 2px solid #1C1917; outline-offset: 2px; }
  .error { color: #B91C1C; font-size: .9rem; margin: .75rem 0 0; }
</style>
</head>
<body>
<main>
  <h1>Accès protégé</h1>
  <p>Cet environnement de test est réservé à l'équipe DiaspoMoney. L'accès est mémorisé 30 jours sur cet appareil.</p>
  <form method="post" action="${STAGING_ACCESS_PATH}">
    <input type="hidden" name="next" value="${escapeHtml(next)}">
    <input type="text" name="username" value="diaspomoney" autocomplete="username" hidden>
    <label for="password">Mot de passe</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required autofocus${error ? ' aria-describedby="error" aria-invalid="true"' : ''}>
    ${error ? '<p id="error" class="error" role="alert">Mot de passe incorrect.</p>' : ''}
    <button type="submit">Entrer</button>
  </form>
</main>
</body>
</html>`;
  return new NextResponse(html, {
    status: error ? 401 : 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

/**
 * À appeler en tête du proxy. Renvoie une réponse si l'accès doit être bloqué
 * ou traité (page de mot de passe, connexion), sinon null pour continuer.
 */
export async function handleStagingAccess(request: NextRequest): Promise<NextResponse | null> {
  const config = getConfig();
  if (!config) return null;

  const { pathname, searchParams } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }

  if (pathname === STAGING_ACCESS_PATH) {
    if (request.method === 'POST') {
      const form = await request.formData();
      const password = String(form.get('password') ?? '');
      const next = safeNext(String(form.get('next') ?? '/'));
      if (!safeEqual(password, config.password)) {
        return renderForm(next, true);
      }
      const response = NextResponse.redirect(new URL(next, request.url), 303);
      response.cookies.set(COOKIE_NAME, await createToken(config.secret, config.password), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      });
      return response;
    }
    return renderForm(safeNext(searchParams.get('next')), false);
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (token && (await isValidToken(token, config.secret, config.password))) {
    return null;
  }

  // Appels API sans cookie : 401 simple, pas de redirection HTML.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Accès protégé' }, { status: 401 });
  }

  const accessUrl = new URL(STAGING_ACCESS_PATH, request.url);
  accessUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(accessUrl, 307);
}
