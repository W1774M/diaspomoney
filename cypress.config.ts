import { defineConfig } from 'cypress';

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
    setupNodeEvents(on, config) {
      // Configuration des plugins
      on('task', {
        log(message) {
          console.log(message);
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
