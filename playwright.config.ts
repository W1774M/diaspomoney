import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests E2E
 * 
 * Playwright est plus efficace que Cypress car :
 * - Plus rapide (tests parallèles natifs)
 * - Meilleure gestion des navigateurs
 * - Support natif TypeScript
 * - Meilleure intégration avec Next.js
 */
export default defineConfig({
  testDir: './tests/e2e',
  // Comptes de test en base (CI : MongoDB de service, base diaspomoney_test).
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  ...(process.env['CI'] && { workers: 1 }),
  reporter: process.env['CI']
    ? [['list'], ['junit', { outputFile: 'test-results/e2e-junit.xml' }], ['html', { open: 'never' }]]
    : [['list'], ['html']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    // Ignorer les erreurs HTTPS pour localhost
    ignoreHTTPSErrors: true,
  },

  // En CI : Chromium seul (rapide, stable). En local : les trois moteurs.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(process.env['CI']
      ? []
      : [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]),
  ],

  // En CI : build de production déjà construit par le job « build » (comme en prod).
  webServer: {
    command: process.env['CI'] ? 'pnpm start' : 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});