/**
 * Helpers pour les tests E2E d'autorisation
 * 
 * Fonctions utilitaires pour :
 * - Se connecter avec différents rôles
 * - Vérifier les autorisations
 * - Nettoyer les sessions
 */

import { Page, expect } from '@playwright/test';
import { encode, type JWT } from 'next-auth/jwt';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { ROLES } from '@/lib/constants';
import { getNextAuthSecret } from '@/lib/auth/next-auth-secret';

function loadTestEnv(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const envFile = readFileSync(envPath, 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) {
      continue;
    }

    const key = match[1];
    const rawValue = match[2] ?? '';
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    const value = rawValue.replace(/^\${([A-Z0-9_]+)}$/, (_, envKey: string) => (
      process.env[envKey] ?? ''
    ));
    process.env[key] = value;
  }
}

loadTestEnv();

export interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string;
  roles: string[];
}

export const testUsers: Record<string, TestUser> = {
  admin: {
    id: 'e2e-admin-user',
    name: 'E2E Admin',
    email: 'admin@test.com',
    password: 'password123',
    roles: [ROLES.ADMIN],
  },
  csm: {
    id: 'e2e-csm-user',
    name: 'E2E CSM',
    email: 'csm@test.com',
    password: 'password123',
    roles: [ROLES.CSM],
  },
  provider: {
    id: 'e2e-provider-user',
    name: 'E2E Provider',
    email: 'provider@test.com',
    password: 'password123',
    roles: [ROLES.PROVIDER],
  },
  customer: {
    id: 'e2e-customer-user',
    name: 'E2E Customer',
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
  options: { redirectTo?: string } = {},
) {
  const user = testUsers[userType];

  if (!user) {
    throw new Error(`User type "${userType}" not found in testUsers`);
  }

  const secret = getNextAuthSecret();
  if (!secret) {
    throw new Error('AUTH_SECRET or NEXTAUTH_SECRET must be configured for E2E auth helpers');
  }

  const primaryRole = user.roles[0] ?? ROLES.CUSTOMER;
  const token: JWT = {
    sub: user.id,
    userId: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
    role: primaryRole,
  };

  const sessionToken = await encode({
    token,
    secret,
  });

  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: sessionToken,
      url: 'http://localhost:3000',
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
    },
  ]);

  if (options.redirectTo) {
    await page.goto(options.redirectTo);
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
