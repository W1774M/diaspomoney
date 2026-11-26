import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests E2E
 *
 * En local, le serveur d'E2E est sur le port 3100 et la base diaspomoney_test
 * (Mongo du port 27018). Il ne reprend pas le `pnpm dev` du port 3000, qui peut
 * pointer vers une autre base : les comptes créés par global-setup y seraient invisibles.
 */
const ci = !!process.env['CI'];
const port = ci ? process.env['PORT'] || '3000' : '3100';
const baseURL = `http://localhost:${port}`;
const e2eMongo = 'mongodb://127.0.0.1:27018/diaspomoney_test';
const e2eSecret = 'e2e-local-secret-not-used-anywhere-else';

if (!ci) {
  process.env['MONGODB_URI'] = e2eMongo;
  process.env['AUTH_SECRET'] = e2eSecret;
  process.env['NEXTAUTH_SECRET'] = e2eSecret;
  process.env['NEXTAUTH_URL'] = baseURL;
  process.env['E2E_BASE_URL'] = baseURL;
}

export default defineConfig({
  testDir: './tests/e2e',
  // Comptes de test en base (CI : MongoDB de service, base diaspomoney_test).
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: ci,
  retries: ci ? 2 : 0,
  workers: 1,
  reporter: ci
    ? [['list'], ['junit', { outputFile: 'test-results/e2e-junit.xml' }], ['html', { open: 'never' }]]
    : [['list'], ['html']],
  use: {
    baseURL,
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
    ...(ci
      ? []
      : [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]),
  ],

  // En CI : build de production déjà construit par le job « build » (comme en prod).
  webServer: {
    command: ci ? 'pnpm start' : 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !ci,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      ...process.env,
      PORT: port,
      MONGODB_URI: ci ? process.env['MONGODB_URI'] || e2eMongo : e2eMongo,
      AUTH_SECRET: ci ? process.env['AUTH_SECRET'] || e2eSecret : e2eSecret,
      NEXTAUTH_SECRET: ci ? process.env['NEXTAUTH_SECRET'] || e2eSecret : e2eSecret,
      NEXTAUTH_URL: baseURL,
    },
  },
});