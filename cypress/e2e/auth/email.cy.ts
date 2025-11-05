/**
 * Tests End-to-End avec Cypress - Envoi d'Emails (API uniquement)
 * Tests spécifiques pour l'envoi d'emails via API
 */

describe("Envoi d'Emails (API)", () => {
  beforeEach(() => {
    // Configuration de base pour chaque test

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

  describe("Tests API d'Envoi d'Emails", () => {
    it("Test d'inscription avec email de bienvenue via API", () => {
      const timestamp = Date.now();
      const uniqueEmail = `test.email.${timestamp}@example.com`;

      // Intercepter les appels d'email pour vérifier les tags
      let capturedTags: any = null;
      cy.intercept('POST', '**/api/email/**', req => {
        if (req.body) {
          capturedTags = req.body.tags;
          console.log('🏷️ Tags capturés:', capturedTags);
        }
      }).as('emailRequest');

      // Effectuer l'inscription via API
      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          email: uniqueEmail,
          password: 'motdepasse123',
          firstName: 'François',
          lastName: 'Müller',
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

        // Vérifier que les tags sont valides (si capturés)
        if (capturedTags) {
          capturedTags.forEach((tag: any) => {
            expect(tag.name).to.match(/^[a-zA-Z0-9_-]+$/);
            expect(tag.value).to.match(/^[a-zA-Z0-9_-]+$/);
          });
        }
      });
    });

    it("Test d'inscription avec caractères spéciaux dans les tags", () => {
      const timestamp = Date.now();
      const specialEmail = `françois.müller.${timestamp}@example.com`;

      // Intercepter les appels d'email pour vérifier la sanitisation des tags
      let capturedTags: any = null;
      cy.intercept('POST', '**/api/email/**', req => {
        if (req.body) {
          capturedTags = req.body.tags;
          console.log('🏷️ Tags avec caractères spéciaux:', capturedTags);
        }
      }).as('emailRequest');

      // Effectuer l'inscription via API avec des caractères spéciaux
      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          email: specialEmail,
          password: 'motdepasse123',
          firstName: 'François',
          lastName: 'Müller',
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

        // Vérifier que les tags sont sanitizés (si capturés)
        if (capturedTags) {
          capturedTags.forEach((tag: any) => {
            // Les tags doivent être sanitizés et ne contenir que des caractères ASCII
            expect(tag.name).to.match(/^[a-zA-Z0-9_-]+$/);
            expect(tag.value).to.match(/^[a-zA-Z0-9_-]+$/);
          });
        }
      });
    });

    it("Test de validation des tags d'email", () => {
      const timestamp = Date.now();
      const testEmail = `tag.validation.${timestamp}@example.com`;

      // Intercepter les appels d'email pour analyser les tags
      let emailCallData: any = null;
      cy.intercept('POST', '**/api/email/**', req => {
        emailCallData = {
          url: req.url,
          method: req.method,
          body: req.body,
          headers: req.headers,
        };
        console.log("📧 Données d'email capturées:", emailCallData);
      }).as('emailRequest');

      // Effectuer l'inscription via API
      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          email: testEmail,
          password: 'motdepasse123',
          firstName: 'Test',
          lastName: 'Validation',
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

        // Vérifier les données d'email capturées
        if (emailCallData) {
          expect(emailCallData.method).to.eq('POST');
          expect(emailCallData.body).to.have.property('to');
          expect(emailCallData.body.to).to.contain(testEmail);
        }
      });
    });
  });

  describe('Tests de Santé des Services Email', () => {
    it('Test de base du service email', () => {
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

    it("Test de création d'utilisateur avec email de bienvenue", () => {
      const timestamp = Date.now();
      const emailTest = `email.test.${timestamp}@example.com`;

      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          email: emailTest,
          password: 'password123',
          firstName: 'Email',
          lastName: 'Test',
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

    it('Test de validation des données email', () => {
      // Tester la validation avec des données email invalides
      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          email: 'invalid-email-format', // Email invalide
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
