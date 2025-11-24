/**
 * Helpers pour les tests E2E d'autorisation
 * 
 * Fonctions utilitaires pour :
 * - Se connecter avec différents rôles
 * - Vérifier les autorisations
 * - Nettoyer les sessions
 */

import { Page, expect } from '@playwright/test';
import { ROLES } from '@/lib/constants';

export interface TestUser {
  email: string;
  password: string;
  roles: string[];
}

export const testUsers: Record<string, TestUser> = {
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    roles: [ROLES.ADMIN],
  },
  csm: {
    email: 'csm@test.com',
    password: 'password123',
    roles: [ROLES.CSM],
  },
  provider: {
    email: 'provider@test.com',
    password: 'password123',
    roles: [ROLES.PROVIDER],
  },
  customer: {
    email: 'customer@test.com',
    password: 'password123',
    roles: [ROLES.CUSTOMER],
  },
};

/**
 * Se connecter avec un utilisateur de test
 * 
 * @param page - Instance de la page Playwright
 * @param userType - Type d'utilisateur (admin, csm, provider, customer)
 * @param options - Options supplémentaires (waitForNavigation, timeout)
 */
export async function loginAs(
  page: Page,
  userType: keyof typeof testUsers,
  options: { waitForNavigation?: boolean; timeout?: number } = {},
) {
  const { waitForNavigation = true, timeout = 10000 } = options;
  const user = testUsers[userType];

  if (!user) {
    throw new Error(`User type "${userType}" not found in testUsers`);
  }

  await page.goto('/login');

  // Attendre que le formulaire soit chargé
  await page.waitForSelector('#email', { state: 'visible' });
  await page.waitForSelector('#password', { state: 'visible' });

  // Remplir le formulaire de connexion avec les IDs spécifiques
  await page.fill('#email', user.email);
  await page.fill('#password', user.password);

  // Cliquer sur le bouton de connexion (chercher par texte pour plus de robustesse)
  const submitButton = page.getByRole('button', { name: /se connecter|connexion/i });
  await submitButton.click();

  // Attendre la redirection vers le dashboard si demandé
  if (waitForNavigation) {
    await page.waitForURL('**/dashboard**', { timeout });
  }
}

/**
 * Se déconnecter
 */
export async function logout(page: Page) {
  // Chercher le bouton de déconnexion (peut être dans un menu)
  const logoutButton = page.getByRole('button', { name: /déconnexion|logout|sign out/i });
  
  if (await logoutButton.isVisible().catch(() => false)) {
    await logoutButton.click();
  } else {
    // Alternative: supprimer les cookies et le localStorage
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  }
  
  // Attendre la redirection vers login
  await page.waitForURL('**/login**', { timeout: 5000 });
}

/**
 * Vérifier qu'on est redirigé vers une URL spécifique
 */
export async function expectRedirect(
  page: Page,
  expectedUrl: string | RegExp,
  timeout = 5000,
) {
  if (typeof expectedUrl === 'string') {
    await page.waitForURL(`**${expectedUrl}**`, { timeout });
    expect(page.url()).toContain(expectedUrl);
  } else {
    await page.waitForURL(expectedUrl, { timeout });
    expect(page.url()).toMatch(expectedUrl);
  }
}

/**
 * Vérifier qu'un message d'erreur d'autorisation s'affiche
 */
export async function expectAuthorizationError(page: Page, timeout = 5000) {
  const errorMessage = page.getByText(/Accès non autorisé|non autorisé|unauthorized/i);
  await expect(errorMessage).toBeVisible({ timeout });
}

/**
 * Vérifier qu'un élément est visible uniquement pour certains rôles
 */
export async function expectElementVisibleForRole(
  page: Page,
  selector: string,
  shouldBeVisible: boolean,
) {
  const element = page.locator(selector);
  
  if (shouldBeVisible) {
    await expect(element).toBeVisible({ timeout: 5000 });
  } else {
    await expect(element).not.toBeVisible();
  }
}

/**
 * Nettoyer complètement la session
 */
export async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Vérifier qu'on est sur une page spécifique
 */
export async function expectPage(page: Page, expectedPath: string, timeout = 5000) {
  await page.waitForURL(`**${expectedPath}**`, { timeout });
  expect(page.url()).toContain(expectedPath);
}

/**
 * Attendre qu'un élément soit visible avec un sélecteur spécifique
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options: { timeout?: number; state?: 'visible' | 'attached' | 'detached' | 'hidden' } = {},
) {
  const { timeout = 5000, state = 'visible' } = options;
  await page.waitForSelector(selector, { timeout, state });
}

/**
 * Vérifier qu'un texte est présent sur la page
 */
export async function expectText(page: Page, text: string | RegExp, timeout = 5000) {
  const locator = typeof text === 'string' ? page.getByText(text) : page.getByText(text);
  await expect(locator).toBeVisible({ timeout });
}

/**
 * Vérifier qu'un bouton est visible et cliquable
 */
export async function expectButtonVisible(
  page: Page,
  buttonText: string | RegExp,
  timeout = 5000,
) {
  const button = typeof buttonText === 'string'
    ? page.getByRole('button', { name: buttonText })
    : page.getByRole('button', { name: buttonText });
  await expect(button).toBeVisible({ timeout });
  await expect(button).toBeEnabled();
}

/**
 * Vérifier qu'un bouton n'est pas visible (pour les utilisateurs non autorisés)
 */
export async function expectButtonNotVisible(
  page: Page,
  buttonText: string | RegExp,
) {
  const button = typeof buttonText === 'string'
    ? page.getByRole('button', { name: buttonText })
    : page.getByRole('button', { name: buttonText });
  await expect(button).not.toBeVisible();
}
