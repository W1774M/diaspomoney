/**
 * Référencement, en-têtes de sécurité et pages techniques, vérifiés sur le serveur réel.
 */
import { expect, test } from '@playwright/test';

test.describe('Référencement', () => {
  test('chaque page publique déclare sa propre URL canonique', async ({ page }) => {
    for (const path of ['/', '/services/health', '/about', '/privacy-policy']) {
      await page.goto(path);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical, `canonical de ${path}`).toBeTruthy();
      expect(new URL(canonical!).pathname.replace(/\/$/, '') || '/').toBe(path === '/' ? '/' : path);
    }
  });

  test('l’accueil publie des données structurées Organization et WebSite', async ({ page }) => {
    await page.goto('/');
    const json = await page.locator('script[type="application/ld+json"]').first().textContent();
    const types = (JSON.parse(json!)['@graph'] as Array<{ '@type': string }>).map((n) => n['@type']);
    expect(types).toEqual(expect.arrayContaining(['Organization', 'WebSite']));
  });

  test('robots.txt et sitemap.xml sont servis', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.ok()).toBe(true);
    expect(await robots.text()).toContain('Sitemap:');

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).toContain('/services/health');
  });

  test('/privacy redirige définitivement vers /privacy-policy', async ({ request }) => {
    const response = await request.get('/privacy', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()['location']).toBe('/privacy-policy');
  });
});

test.describe('Sécurité', () => {
  test('les en-têtes de sécurité sont présents', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();

    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['permissions-policy']).toContain('camera=()');
  });

  test('une page inconnue répond 404', async ({ page }) => {
    const response = await page.goto('/cette-page-n-existe-pas');
    expect(response?.status()).toBe(404);
  });
});
