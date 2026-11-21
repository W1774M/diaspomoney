/**
 * Parcours publics de la page d'accueil.
 *
 * Bonnes pratiques suivies : sélecteurs par rôle et nom accessible (comme un utilisateur
 * ou un lecteur d'écran), assertions auto-attendantes (pas de délai fixe), chaque test
 * part d'un contexte vierge (cookies et localStorage isolés par Playwright).
 */
import { expect, test, type Page } from '@playwright/test';

/** Choix de cookies déjà fait : le bandeau ne recouvre pas la page (hors tests du bandeau). */
async function withConsentDecided(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('diaspomoney.consent', JSON.stringify({ analytics: 'denied', date: Date.now() }));
  });
}

test.describe('Accueil', () => {
  test.beforeEach(({ page }) => withConsentDecided(page));

  test('affiche le titre, la navigation et le pied de page', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/DiaspoMoney/);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /cliniques partenaires/i })).toBeVisible();
  });

  test('le lien d’évitement mène au contenu principal', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: 'Aller au contenu' });
    await expect(skipLink).toBeFocused();
    await skipLink.press('Enter');
    await expect(page).toHaveURL(/#contenu$/);
  });

  test('le bandeau défilant peut être mis en pause', async ({ page }) => {
    await page.goto('/');

    const pause = page.getByRole('button', { name: 'Mettre en pause le défilement' }).first();
    await pause.click();
    await expect(page.getByRole('button', { name: 'Reprendre le défilement' }).first()).toBeVisible();
  });
});

// Le bandeau des cliniques défile en continu : on joue ces parcours avec « mouvement réduit »
// (préférence système respectée par le site), où les cartes sont immobiles et défilables.
test.describe('Cliniques partenaires (mouvement réduit)', () => {
  test.use({ reducedMotion: 'reduce' });
  test.beforeEach(({ page }) => withConsentDecided(page));

  test('une carte de clinique ouvre son détail dans une modale fermable au clavier', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Cliniques partenaires' });
    await section.getByRole('button', { name: 'CLINIQUE SAINT PETERSBOURG' }).first().click();

    const dialog = page.getByRole('dialog', { name: 'CLINIQUE SAINT PETERSBOURG' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Médecin généraliste : 19€')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('« Choisir cette clinique » mène à la réservation santé', async ({ page }) => {
    await page.goto('/');

    const section = page.getByRole('region', { name: 'Cliniques partenaires' });
    await section.getByRole('button', { name: 'CLINIQUE SAINT PETERSBOURG' }).first().click();
    await page.getByRole('button', { name: 'Choisir cette clinique' }).click();

    await expect(page).toHaveURL(/\/services\/health\?clinic=clinique-saint-petersbourg/);
  });
});

test.describe('Cookies (CNIL)', () => {
  test('aucun traceur Google avant le choix, refus mémorisé', async ({ page }) => {
    const gtmRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('googletagmanager.com')) gtmRequests.push(request.url());
    });

    await page.goto('/');
    const banner = page.getByRole('region', { name: 'Vos choix sur les cookies' });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('button', { name: 'Accepter' })).toBeVisible();

    await banner.getByRole('button', { name: 'Refuser' }).click();
    await expect(banner).toBeHidden();

    await page.reload();
    await expect(page.getByRole('region', { name: 'Vos choix sur les cookies' })).toBeHidden();
    expect(gtmRequests).toEqual([]);
  });

  test('« Gérer les cookies » rouvre le bandeau', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Refuser' }).click();

    await page.getByRole('button', { name: 'Gérer les cookies' }).click();
    await expect(page.getByRole('region', { name: 'Vos choix sur les cookies' })).toBeVisible();
  });
});
