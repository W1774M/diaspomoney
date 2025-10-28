/**
 * Commandes personnalisées Cypress pour DiaspoMoney
 */

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Créer un utilisateur de test
       * @param userData - Données de l'utilisateur
       */
      createTestUser(userData: any): Chainable<any>;

      /**
       * Se connecter avec des identifiants
       * @param email - Email de l'utilisateur
       * @param password - Mot de passe
       */
      loginUser(email: string, password: string): Chainable<any>;

      /**
       * Nettoyer un utilisateur de test
       * @param email - Email de l'utilisateur à nettoyer
       */
      cleanupTestUser(email: string): Chainable<void>;

      /**
       * Attendre qu'un email soit envoyé
       * @param timeout - Timeout en millisecondes
       */
      waitForEmail(timeout?: number): Chainable<void>;

      /**
       * Vérifier les tags d'email
       * @param tags - Tags à vérifier
       */
      verifyEmailTags(tags: any[]): Chainable<void>;
    }
  }
}

// Commande pour créer un utilisateur de test
Cypress.Commands.add('createTestUser', userData => {
  return cy
    .request({
      method: 'POST',
      url: '/api/auth/register',
      body: userData,
      failOnStatusCode: false,
    })
    .then(response => {
      if (response.status === 201) {
        cy.log('✅ Utilisateur créé avec succès');
        return cy.wrap({ success: true, data: response.body });
      } else {
        cy.log("❌ Erreur lors de la création de l'utilisateur");
        return cy.wrap({ success: false, error: response.body });
      }
    });
});

// Commande pour se connecter
Cypress.Commands.add('loginUser', (email, password) => {
  return cy
    .request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email, password },
      failOnStatusCode: false,
    })
    .then(response => {
      if (response.status === 200) {
        cy.log('✅ Connexion réussie');
        return cy.wrap({ success: true, data: response.body });
      } else {
        cy.log('❌ Erreur de connexion');
        return cy.wrap({ success: false, error: response.body });
      }
    });
});

// Commande pour nettoyer un utilisateur
Cypress.Commands.add('cleanupTestUser', email => {
  cy.log(`🧹 Nettoyage de l'utilisateur: ${email}`);
  // Ici on pourrait ajouter du code pour nettoyer la DB de test
  // Par exemple, supprimer l'utilisateur de la base de données
});

// Commande pour attendre un email
Cypress.Commands.add('waitForEmail', (timeout = 5000) => {
  cy.log("📧 Attente de l'envoi d'email...");
  cy.wait(timeout);
});

// Commande pour vérifier les tags d'email
Cypress.Commands.add('verifyEmailTags', tags => {
  tags.forEach(tag => {
    expect(tag.name).to.match(/^[a-zA-Z0-9_-]+$/);
    expect(tag.value).to.match(/^[a-zA-Z0-9_-]+$/);
  });
  cy.log("✅ Tags d'email valides");
});

export {};
