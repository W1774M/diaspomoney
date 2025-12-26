import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Tests client: pas de dépendance Mongo (évite les timeouts/host docker `mongodb`)
    setupFiles: ['./tests/setup.ts'],
    hookTimeout: 60000,
    testTimeout: 30000,
    include: [
      // Tests "client-side" (React/components/hooks)
      // NB: pas de "brace expansion" ici (ex: {ts,tsx}) car selon versions/outils,
      // Vitest peut l'ignorer et retomber sur ses patterns par défaut (=> exécute tout).
      'tests/components/**/*.test.ts',
      'tests/components/**/*.test.tsx',
      'tests/hooks/**/*.test.ts',
      'tests/hooks/**/*.test.tsx',
      'tests/lib/**/*.test.ts',
      'tests/lib/**/*.test.tsx',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/cypress/**',
      '**/tests/e2e/**', // Exclure les tests E2E (Playwright)
      // Ne pas exécuter les tests serveur/integration dans la config jsdom
      'tests/api/**',
      'tests/facades/**',
      'tests/services/**',
      'tests/integration/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/.next/**',
        '**/cypress/**',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});

