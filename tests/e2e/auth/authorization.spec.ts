/**
 * Tests E2E du système d'autorisation (navigateur réel, build de production).
 *
 * Bonnes pratiques : aucune attente « networkidle » (le dashboard interroge le serveur en
 * continu) ; chaque scénario attend un repère visible — le titre de la page autorisée, ou
 * l'URL de redirection — via des assertions qui se réessaient seules.
 * Les comptes de test sont créés en base par tests/e2e/global-setup.ts.
 */
import { expect, test } from '@playwright/test';
import { clearSession, expectRedirect, loginAs } from './helpers';

/** Redirection appliquée par AuthorizedRoute quand le rôle ne convient pas. */
const REFUSED = /\/dashboard$/;

test.describe("Système d'autorisation E2E", () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  test.describe('Utilisateur non authentifié', () => {
    for (const path of ['/dashboard/specialities', '/dashboard/admin', '/dashboard/settings/faq']) {
      test(`est redirigé vers /login depuis ${path}`, async ({ page }) => {
        await page.goto(path);
        await expectRedirect(page, '/login');
      });
    }
  });

  test.describe('Rôle ADMIN', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'admin');
    });

    test('accède à /dashboard/specialities', async ({ page }) => {
      await page.goto('/dashboard/specialities');
      await expect(page.getByRole('heading', { level: 1, name: 'Spécialités' })).toBeVisible();
      await expect(page).toHaveURL(/\/dashboard\/specialities$/);
    });

    test('accède au tableau de bord administrateur', async ({ page }) => {
      await page.goto('/dashboard/admin');
      await expect(page.getByText('Tableau de bord administrateur')).toBeVisible();
      await expect(page).toHaveURL(/\/dashboard\/admin$/);
    });

    test('voit le bouton « Nouveau prestataire »', async ({ page }) => {
      await page.goto('/dashboard/providers');
      await expect(page.getByRole('heading', { level: 1, name: 'Gestion des Prestataires' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Nouveau prestataire' })).toBeVisible();
    });
  });

  test.describe('Rôle CSM', () => {
    test('accède à /dashboard/providers', async ({ page }) => {
      await loginAs(page, 'csm');
      await page.goto('/dashboard/providers');
      await expect(page.getByRole('heading', { level: 1, name: 'Gestion des Prestataires' })).toBeVisible();
      await expect(page).toHaveURL(/\/dashboard\/providers$/);
    });
  });

  test.describe('Rôle CUSTOMER', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'customer');
    });

    test('est renvoyé vers /dashboard depuis une page ADMIN', async ({ page }) => {
      await page.goto('/dashboard/specialities');
      await expect(page).toHaveURL(REFUSED);
      await expect(page.getByRole('heading', { level: 1, name: 'Spécialités' })).toBeHidden();
    });

    test('est renvoyé vers /dashboard depuis la gestion des prestataires', async ({ page }) => {
      await page.goto('/dashboard/providers');
      await expect(page).toHaveURL(REFUSED);
      await expect(page.getByRole('link', { name: 'Nouveau prestataire' })).toBeHidden();
    });

    test('accède à la FAQ (page réservée aux utilisateurs connectés)', async ({ page }) => {
      await page.goto('/dashboard/settings/faq');
      await expect(page.getByRole('heading', { level: 1, name: /FAQ par rôle/ })).toBeVisible();
      await expect(page).toHaveURL(/\/dashboard\/settings\/faq$/);
    });
  });

  test.describe('Vérification de propriété (ownership)', () => {
    test.fixme('accès autorisé au propriétaire d’une ressource', async () => {
      // Nécessite une ressource (réservation) créée pour l'utilisateur de test dans global-setup.
    });

    test.fixme('accès refusé à une ressource d’un autre utilisateur', async () => {
      // Nécessite une ressource appartenant à un autre utilisateur.
    });
  });
});
