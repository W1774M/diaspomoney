import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts', './tests/setup.mongo.ts'],
    hookTimeout: 60000,
    // Tous les fichiers partagent la base diaspomoney_test, vidée après chaque test :
    // en parallèle, un fichier effaçait les données d’un autre en cours d’exécution.
    fileParallelism: false,
    testTimeout: 30000,
    include: [
      'tests/api/**/*.test.ts',
      'tests/facades/**/*.test.ts',
      'tests/services/**/*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/cypress/**',
      '**/tests/e2e/**',
      'tests/integration/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});


