import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { coverageExclude, coverageInclude } from './vitest.coverage';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.integration.ts', './tests/setup.mongo.ts'],
    hookTimeout: 60000,
    // Tous les fichiers partagent la base diaspomoney_test, vidée après chaque test :
    // en parallèle, un fichier effaçait les données d’un autre en cours d’exécution.
    fileParallelism: false,
    testTimeout: 30000, // 30 secondes pour les tests d'intégration
    include: ['tests/integration/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: coverageInclude,
      exclude: coverageExclude,
      reporter: ['text-summary', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});

