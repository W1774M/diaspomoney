import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { handleStagingAccess, STAGING_ACCESS_PATH } from '@/lib/staging-access';

const BASE = 'https://dev.diaspomoney.fr';

function post(password: string, next = '/services') {
  return new NextRequest(`${BASE}${STAGING_ACCESS_PATH}`, {
    method: 'POST',
    body: new URLSearchParams({ password, next }),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  });
}

describe('handleStagingAccess', () => {
  beforeEach(() => {
    process.env['STAGING_ACCESS_PASSWORD'] = 'bon-mot-de-passe';
    process.env['STAGING_ACCESS_SECRET'] = 'secret-de-test';
  });

  afterEach(() => {
    delete process.env['STAGING_ACCESS_PASSWORD'];
    delete process.env['STAGING_ACCESS_SECRET'];
  });

  it('ne fait rien quand les variables ne sont pas définies (prod)', async () => {
    delete process.env['STAGING_ACCESS_PASSWORD'];
    expect(await handleStagingAccess(new NextRequest(`${BASE}/`))).toBeNull();
  });

  it('redirige une page sans cookie vers la page d’accès en gardant la destination', async () => {
    const response = await handleStagingAccess(new NextRequest(`${BASE}/services?x=1`));
    expect(response?.status).toBe(307);
    const location = new URL(response!.headers.get('location')!);
    expect(location.pathname).toBe(STAGING_ACCESS_PATH);
    expect(location.searchParams.get('next')).toBe('/services?x=1');
  });

  it('répond 401 en JSON pour une API sans cookie, mais laisse passer le webhook Stripe', async () => {
    expect((await handleStagingAccess(new NextRequest(`${BASE}/api/partners`)))?.status).toBe(401);
    expect(
      await handleStagingAccess(new NextRequest(`${BASE}/api/stripe/webhook`, { method: 'POST' })),
    ).toBeNull();
  });

  it('refuse un mauvais mot de passe', async () => {
    const response = await handleStagingAccess(post('faux'));
    expect(response?.status).toBe(401);
    expect(response?.cookies.get('diaspomoney_staging_access')).toBeUndefined();
  });

  it('pose un cookie de 30 jours avec le bon mot de passe, puis laisse passer', async () => {
    const response = await handleStagingAccess(post('bon-mot-de-passe'));
    expect(response?.status).toBe(303);
    expect(new URL(response!.headers.get('location')!).pathname).toBe('/services');

    const cookie = response!.cookies.get('diaspomoney_staging_access');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.maxAge).toBe(60 * 60 * 24 * 30);

    const next = new NextRequest(`${BASE}/dashboard`, {
      headers: { cookie: `diaspomoney_staging_access=${cookie!.value}` },
    });
    expect(await handleStagingAccess(next)).toBeNull();
  });

  it('refuse un cookie falsifié et une redirection vers un autre site', async () => {
    const forged = new NextRequest(`${BASE}/`, {
      headers: { cookie: `diaspomoney_staging_access=9999999999.abc` },
    });
    expect((await handleStagingAccess(forged))?.status).toBe(307);

    const response = await handleStagingAccess(post('bon-mot-de-passe', '//evil.example'));
    expect(new URL(response!.headers.get('location')!).origin).toBe(BASE);
  });
});
