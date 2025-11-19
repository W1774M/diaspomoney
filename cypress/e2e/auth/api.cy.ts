/**
 * Tests End-to-End avec Cypress - API Authentication
 * Tests des endpoints d'authentification
 */

describe('API Authentication', () => {
  beforeEach(() => {
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
  it('POST /api/auth/register - Inscription réussie', () => {
    const timestamp = Date.now();
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        email: `api.test.${timestamp}@example.com`,
        password: 'motdepasse123',
        firstName: 'API',
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
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
      expect(response.body.user).to.exist;
      expect(response.body.user.email).to.eq(
        `api.test.${timestamp}@example.com`,
      );
      expect(response.body.message).to.contain('Compte créé avec succès');
    });
  });

  it('POST /api/auth/register - Email déjà existant', () => {
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

  it('POST /api/auth/register - Données manquantes', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        email: 'incomplete@test.com',
        // Manque firstName, lastName, etc.
      },
      failOnStatusCode: false,
    }).then(response => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
      expect(response.body.error).to.contain(
        'Tous les champs obligatoires doivent être remplis',
      );
    });
  });

  it('POST /api/auth/register - Mot de passe trop court', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        email: 'shortpass@test.com',
        password: '123', // Trop court
        firstName: 'Short',
        lastName: 'Pass',
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
        'Le mot de passe doit contenir au moins 8 caractères',
      );
    });
  });

  it('POST /api/auth/register - Conditions non acceptées', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        email: 'noterms@test.com',
        password: 'motdepasse123',
        firstName: 'No',
        lastName: 'Terms',
        phone: '+33123456789',
        countryOfResidence: 'france',
        dateOfBirth: '1990-01-01',
        targetCountry: 'senegal',
        targetCity: 'dakar',
        monthlyBudget: '100-300',
        securityQuestion: 'pet',
        securityAnswer: 'Rex',
        termsAccepted: false, // Non accepté
        marketingConsent: false,
        selectedServices: 'health',
      },
      failOnStatusCode: false,
    }).then(response => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
      expect(response.body.error).to.contain(
        "Vous devez accepter les conditions d'utilisation",
      );
    });
  });

  it('POST /api/auth/register - Inscription OAuth', () => {
    const timestamp = Date.now();
    const oauthEmail = `oauth.test.${timestamp}@example.com`;

    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        email: oauthEmail,
        firstName: 'OAuth',
        lastName: 'User',
        phone: '+33123456789',
        countryOfResidence: 'france',
        dateOfBirth: '1990-01-01',
        targetCountry: 'senegal',
        targetCity: 'dakar',
        monthlyBudget: '100-300',
        termsAccepted: true,
        marketingConsent: false,
        selectedServices: 'health',
        oauth: {
          provider: 'google',
          providerAccountId: 'google_123456',
        },
        // Pas de password pour OAuth
      },
    }).then(response => {
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
      expect(response.body.user).to.exist;
      expect(response.body.user.email).to.eq(oauthEmail);
    });
  });

  it('GET /api/users/me - Récupération profil utilisateur', () => {
    const timestamp = Date.now();
    const profileEmail = `profile.test.${timestamp}@example.com`;

    // D'abord s'inscrire
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        email: profileEmail,
        password: 'motdepasse123',
        firstName: 'Profile',
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
    }).then(registerResponse => {
      expect(registerResponse.status).to.eq(201);

      // Utiliser le token pour récupérer le profil
      cy.request({
        method: 'GET',
        url: '/api/users/me',
        headers: {
          Authorization: `Bearer ${registerResponse.body.accessToken}`,
        },
      }).then(profileResponse => {
        expect(profileResponse.status).to.eq(200);
        expect(profileResponse.body.user).to.exist;
        expect(profileResponse.body.user.email).to.eq(profileEmail);
        expect(profileResponse.body.user.name).to.eq('Profile Test');
      });
    });
  });

  it('POST /api/auth/complete-profile - Complétion profil', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/complete-profile',
      body: {
        phone: '+33123456789',
        countryOfResidence: 'france',
        targetCountry: 'senegal',
        targetCity: 'dakar',
        monthlyBudget: '100-300',
      },
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
    });
  });
});
