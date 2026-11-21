/**
 * Tests E2E pour le système d'autorisation
 * 
 * Ces tests vérifient le comportement complet du système d'autorisation
 * dans un environnement réel avec un navigateur.
 * 
 * Scénarios testés :
 * - Redirections pour utilisateurs non authentifiés
 * - Messages d'erreur pour permissions insuffisantes
 * - Accès aux pages avec différents rôles
 * - Comportement des composants d'autorisation
 */

import { test, expect } from '@playwright/test';
import {
  clearSession,
  expectRedirect,
  loginAs,
} from './helpers';

test.describe('Système d\'autorisation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Nettoyer la session avant chaque test
    await clearSession(page);
  });

  test.describe('Redirections pour utilisateurs non authentifiés', () => {
    test('devrait rediriger vers /login depuis une page protégée', async ({
      page,
    }) => {
      await page.goto('/dashboard/specialities');
      await expectRedirect(page, '/login');
    });

    test('devrait rediriger vers /login depuis une page admin', async ({
      page,
    }) => {
      await page.goto('/dashboard/admin');
      await expectRedirect(page, '/login');
    });

    test('devrait rediriger vers /login depuis une page avec authentification uniquement', async ({
      page,
    }) => {
      await page.goto('/dashboard/settings/faq');
      await expectRedirect(page, '/login');
    });
  });

  test.describe('Accès aux pages avec rôle ADMIN', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'admin');
    });

    test('devrait accéder à /dashboard/specialities en tant qu\'admin', async ({
      page,
    }) => {
      await page.goto('/dashboard/specialities');
      await page.waitForLoadState('networkidle');

      expect(page.url()).not.toContain('/login');
      expect(page.url()).toContain('/dashboard/specialities');
    });

    test('devrait accéder à /dashboard/admin en tant qu\'admin', async ({
      page,
    }) => {
      await page.goto('/dashboard/admin');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).not.toContain('/login');
      expect(page.url()).toContain('/dashboard/admin');
    });
  });

  test.describe('Messages d\'erreur pour permissions insuffisantes', () => {
    test('devrait afficher un message d\'erreur pour un CUSTOMER accédant à une page ADMIN', async ({
      page,
    }) => {
      await loginAs(page, 'customer');
      await page.goto('/dashboard/specialities');
      
      await page.waitForLoadState('networkidle');
      
      // Vérifier si on est redirigé ou si un message d'erreur s'affiche
      const errorMessage = page.getByText(/Accès non autorisé|non autorisé/i);
      
      // Soit on est redirigé, soit on voit le message d'erreur
      const isRedirected = page.url().endsWith('/dashboard');
      const hasErrorMessage = await errorMessage.isVisible().catch(() => false);
      
      expect(isRedirected || hasErrorMessage).toBeTruthy();
    });
  });

  test.describe('Comportement des composants AuthorizedContent', () => {
    test('devrait afficher les boutons admin uniquement pour les admins', async ({
      page,
    }) => {
      await loginAs(page, 'admin');
      await page.goto('/dashboard/providers');
      await page.waitForLoadState('networkidle');
      
      await expect(page.getByRole('link', { name: /nouveau prestataire|ajouter un prestataire/i })).toBeVisible();
    });

    test('ne devrait pas afficher les boutons admin pour les non-admins', async ({
      page,
    }) => {
      await loginAs(page, 'customer');
      await page.goto('/dashboard/providers');
      await page.waitForLoadState('networkidle');
      
      // Le bouton admin ne devrait pas être visible
      const adminButton = page.getByRole('link', { name: /nouveau prestataire|ajouter un prestataire/i });
      const isVisible = await adminButton.isVisible().catch(() => false);
      
      // Si on n'est pas admin, le bouton ne devrait pas être visible
      // (ou on est redirigé)
      expect(page.url().endsWith('/dashboard') || !isVisible).toBeTruthy();
    });
  });

  test.describe('Pages avec rôles multiples', () => {
    test('devrait accéder à /dashboard/providers en tant qu\'ADMIN', async ({
      page,
    }) => {
      await loginAs(page, 'admin');
      await page.goto('/dashboard/providers');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).not.toContain('/login');
      expect(page.url()).toContain('/dashboard/providers');
    });

    test('devrait accéder à /dashboard/providers en tant qu\'CSM', async ({
      page,
    }) => {
      await loginAs(page, 'csm');
      await page.goto('/dashboard/providers');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).not.toContain('/login');
      expect(page.url()).toContain('/dashboard/providers');
    });

    test('ne devrait pas accéder à /dashboard/providers en tant que CUSTOMER', async ({
      page,
    }) => {
      await loginAs(page, 'customer');
      await page.goto('/dashboard/providers');
      await page.waitForLoadState('networkidle');
      
      // Devrait être redirigé ou voir un message d'erreur
      const isRedirected = page.url().endsWith('/dashboard');
      const errorMessage = page.getByText(/Accès non autorisé/i);
      const hasError = await errorMessage.isVisible().catch(() => false);
      
      expect(isRedirected || hasError).toBeTruthy();
    });
  });

  test.describe('Pages avec authentification uniquement', () => {
    test('devrait accéder à /dashboard/settings/faq si authentifié', async ({
      page,
    }) => {
      await loginAs(page, 'customer');
      await page.goto('/dashboard/settings/faq');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).not.toContain('/login');
      expect(page.url()).toContain('/dashboard/settings/faq');
    });
  });

  test.describe('Vérification de propriété (ownership)', () => {
    test.skip('devrait permettre l\'accès si l\'utilisateur est propriétaire', async () => {
      test.skip(true, 'Nécessite une fixture de ressource possédée par l’utilisateur de test.');
    });

    test.skip('ne devrait pas permettre l\'accès si l\'utilisateur n\'est pas propriétaire', async () => {
      test.skip(true, 'Nécessite une fixture de ressource possédée par un autre utilisateur.');
    });
  });
});

