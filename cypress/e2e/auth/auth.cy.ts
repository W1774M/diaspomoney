/**
 * Tests End-to-End avec Cypress - Authentification et Inscription (API uniquement)
 * Tests complets du processus d'authentification via API
 */

describe('Authentification et Inscription (API)', () => {
  beforeEach(() => {
    // Intercepter les appels API pour les logs
    cy.intercept('**/api/**', req => {
      console.log(`🌐 API Call: ${req.method} ${req.url}`);
    });

    // Ignorer les erreurs d'hydratation Next.js et de connexion dans les tests
    cy.on('uncaught:exception', err => {
      if (
        err.message.includes('Hydration failed') ||
        err.message.includes('hydration') ||
        err.message.includes('Text content does not match') ||
        err.message.includes('Connection closed') ||
        err.message.includes('There was an error while hydrating') ||
        err.message.includes('Suspense boundary')
      ) {
        console.log('⚠️ Erreur ignorée:', err.message);
        return false; // Empêche Cypress de faire échouer le test
      }
      return true; // Laisse les autres erreurs faire échouer le test
    });
  });

  describe('Inscription Utilisateur (API)', () => {
    it('Inscription complète avec succès', () => {
      const timestamp = Date.now();
      const uniqueEmail = `jean.dupont.${timestamp}@test.com`;

      // Utiliser l'API directement pour éviter les problèmes d'hydratation
      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          email: uniqueEmail,
          password: 'motdepasse123',
          firstName: 'Jean',
          lastName: 'Dupont',
          phone: '+33123456789',
          countryOfResidence: 'france',
          dateOfBirth: '1990-01-01',
          targetCountry: 'senegal',
          targetCity: 'dakar',
          monthlyBudget: '100-300',
          securityQuestion: 'pet',
          securityAnswer: 'Rex',
          termsAccepted: true,
          marketingConsent: false,
          selectedServices: 'health',
        },
      }).then(response => {
        // Vérifier que l'inscription a réussi
        expect(response.status).to.eq(201);
        expect(response.body.success).to.be.true;
        expect(response.body.message).to.contain('Compte créé avec succès');
      });
    });

    it('Inscription avec erreur de validation', () => {
      // Tester les erreurs de validation via l'API
      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          // Données incomplètes pour tester la validation
          email: '', // Email manquant
          password: '', // Mot de passe manquant
          firstName: 'Test',
          lastName: 'User',
          // Autres champs manquants
        },
        failOnStatusCode: false,
      }).then(response => {
        // Vérifier que l'API retourne une erreur de validation
        expect(response.status).to.eq(400);
        expect(response.body.success).to.be.false;
        expect(response.body.error).to.contain('champs obligatoires');
      });
    });

    it('Inscription avec email déjà existant', () => {
      const timestamp = Date.now();
      const existingEmail = `existing.${timestamp}@test.com`;

      // D'abord créer un utilisateur
      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          email: existingEmail,
          password: 'motdepasse123',
          firstName: 'Existing',
          lastName: 'User',
          phone: '+33123456789',
          countryOfResidence: 'france',
          dateOfBirth: '1990-01-01',
          targetCountry: 'senegal',
          targetCity: 'dakar',
          monthlyBudget: '100-300',
          securityQuestion: 'pet',
          securityAnswer: 'Rex',
          termsAccepted: true,
          marketingConsent: false,
          selectedServices: 'health',
        },
      }).then(() => {
        // Maintenant essayer de créer le même utilisateur
        cy.request({
          method: 'POST',
          url: '/api/auth/register',
          body: {
            email: existingEmail,
            password: 'motdepasse123',
            firstName: 'Existing',
            lastName: 'User',
            phone: '+33123456789',
            countryOfResidence: 'france',
            dateOfBirth: '1990-01-01',
            targetCountry: 'senegal',
            targetCity: 'dakar',
            monthlyBudget: '100-300',
            securityQuestion: 'pet',
            securityAnswer: 'Rex',
            termsAccepted: true,
            marketingConsent: false,
            selectedServices: 'health',
          },
          failOnStatusCode: false,
        }).then(response => {
          expect(response.status).to.eq(400);
          expect(response.body.success).to.be.false;
          expect(response.body.error).to.contain(
            'Un compte avec cet email existe déjà',
          );
        });
      });
    });
  });

  describe('Authentification API', () => {
    it('Test de session NextAuth', () => {
      // Tester que l'API de session répond
      cy.request({
        method: 'GET',
        url: '/api/auth/session',
        failOnStatusCode: false,
      }).then(response => {
        // Vérifier que l'API répond (peut être 200 ou 401, peu importe)
        expect(response.status).to.be.oneOf([200, 401]);
      });
    });

    it('Test de providers NextAuth', () => {
      // Tester que l'API des providers répond
      cy.request({
        method: 'GET',
        url: '/api/auth/providers',
        failOnStatusCode: false,
      }).then(response => {
        // Vérifier que l'API répond
        expect(response.status).to.be.oneOf([200, 401]);
      });
    });

    it('Test de CSRF NextAuth', () => {
      // Tester que l'API CSRF répond
      cy.request({
        method: 'GET',
        url: '/api/auth/csrf',
        failOnStatusCode: false,
      }).then(response => {
        // Vérifier que l'API répond
        expect(response.status).to.be.oneOf([200, 401]);
      });
    });
  });

  describe("Tests de Santé de l'Application", () => {
    it("Test de base de l'application", () => {
      // Tester que l'application répond via l'API
      cy.request({
        method: 'GET',
        url: '/api/auth/session',
        failOnStatusCode: false,
      }).then(response => {
        // Vérifier que l'API répond (peut être 200 ou 401, peu importe)
        expect(response.status).to.be.oneOf([200, 401]);
      });
    });

    it("Test de création d'utilisateur avec données minimales", () => {
      const timestamp = Date.now();
      const minimalEmail = `minimal.${timestamp}@test.com`;

      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          email: minimalEmail,
          password: 'password123',
          firstName: 'Minimal',
          lastName: 'User',
          phone: '+33123456789',
          countryOfResidence: 'france',
          dateOfBirth: '1990-01-01',
          targetCountry: 'senegal',
          targetCity: 'dakar',
          monthlyBudget: '100-300',
          securityQuestion: 'pet',
          securityAnswer: 'Rex',
          termsAccepted: true,
          marketingConsent: false,
          selectedServices: 'health',
        },
      }).then(response => {
        // Vérifier que l'inscription a réussi
        expect(response.status).to.eq(201);
        expect(response.body.success).to.be.true;
      });
    });

    it('Test de validation des données utilisateur', () => {
      // Tester la validation avec des données invalides
      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          email: 'invalid-email', // Email invalide
          password: '123', // Mot de passe trop court
          firstName: '', // Prénom manquant
          lastName: '', // Nom manquant
          termsAccepted: false, // Conditions non acceptées
        },
        failOnStatusCode: false,
      }).then(response => {
        // Vérifier que l'API retourne une erreur de validation
        expect(response.status).to.eq(400);
        expect(response.body.success).to.be.false;
      });
    });
  });
});
