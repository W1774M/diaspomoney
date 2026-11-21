/**
 * Fixtures pour les tests end-to-end
 * Données de test et utilitaires
 */

import { test as base, expect } from '@playwright/test';

// Types pour les fixtures
export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  countryOfResidence: string;
  dateOfBirth: string;
  targetCountry: string;
  targetCity: string;
  monthlyBudget: string;
  securityQuestion: string;
  securityAnswer: string;
  termsAccepted: boolean;
  marketingConsent: boolean;
  selectedServices: string;
}

export interface TestFixtures {
  testUser: TestUser;
  existingUser: TestUser;
  oauthUser: Partial<TestUser>;
}

// Données de test
const testUserData: TestUser = {
  email: 'test.user@example.com',
  password: 'motdepasse123',
  firstName: 'Test',
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
};

const existingUserData: TestUser = {
  email: 'existing@test.com',
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
};

const oauthUserData: Partial<TestUser> = {
  email: 'oauth.user@example.com',
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
};

// Fonctions utilitaires
export async function createTestUser(request: any, userData: TestUser) {
  const response = await request.post('/api/auth/register', {
    data: userData,
  });

  if (response.status() === 201) {
    const data = await response.json();
    return { success: true, data };
  } else {
    const error = await response.json();
    return { success: false, error };
  }
}

export async function loginUser(request: any, email: string, password: string) {
  const response = await request.post('/api/auth/login', {
    data: { email, password },
  });

  if (response.status() === 200) {
    const data = await response.json();
    return { success: true, data };
  } else {
    const error = await response.json();
    return { success: false, error };
  }
}

export async function cleanupTestUser(_request: any, email: string) {
  // Fonction pour nettoyer un utilisateur de test
  // À implémenter selon votre logique de nettoyage
  console.log(`🧹 Nettoyage de l'utilisateur: ${email}`);
}

// Extensions des tests avec fixtures
export const test = base.extend<TestFixtures>({
  testUser: async ({}, use) => {
    await use(testUserData);
  },

  existingUser: async ({}, use) => {
    await use(existingUserData);
  },

  oauthUser: async ({}, use) => {
    await use(oauthUserData);
  },
});

export { expect };
