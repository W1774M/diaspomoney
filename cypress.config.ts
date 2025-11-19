import { defineConfig } from 'cypress';
import { logger } from '@/lib/logger';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, _config) {
      // Configuration des plugins
      on('task', {
        log(message) {
          logger.info(message);
          return null;
        },
      });
    },
    env: {
      // Variables d'environnement pour les tests
      apiUrl: 'http://localhost:3000/api',
      testUser: {
        email: 'test@diaspomoney.com',
        password: 'password123',
      },
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});
