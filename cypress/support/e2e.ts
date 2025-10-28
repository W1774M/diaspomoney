/**
 * Configuration globale pour les tests E2E Cypress
 */

// Import des commandes personnalisées
import './commands';

// Configuration globale
beforeEach(() => {
  // Intercepter les erreurs non gérées
  cy.on('uncaught:exception', (err, runnable) => {
    // Ne pas faire échouer les tests sur les erreurs non gérées
    // qui ne sont pas liées à notre application
    if (err.message.includes('ResizeObserver loop limit exceeded')) {
      return false;
    }
    return true;
  });

  // Configuration des timeouts
  Cypress.config('defaultCommandTimeout', 10000);
  Cypress.config('requestTimeout', 10000);
  Cypress.config('responseTimeout', 10000);
});

// Configuration des hooks
afterEach(() => {
  // Nettoyage après chaque test
  cy.log('🧹 Nettoyage après le test');
});

// Configuration des erreurs
Cypress.on('fail', (error, runnable) => {
  // Log personnalisé pour les échecs
  cy.log('❌ Test échoué:', error.message);
  throw error;
});
