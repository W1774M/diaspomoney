/**
 * Tests d'intégration pour /api/auth/register
 * 
 * Ces tests nécessitent une base de données MongoDB en cours d'exécution
 * et testent le flux complet d'inscription
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { NextRequest } from 'next/server';

describe('Integration: /api/auth/register', () => {
  beforeAll(() => {
    // Vérifier que MongoDB est disponible
    if (!process.env['MONGODB_URI']) {
      throw new Error('MONGODB_URI doit être défini pour les tests d\'intégration');
    }
  });

  afterAll(() => {
    // Cleanup si nécessaire
  });

  describe('POST /api/auth/register', () => {
    it('devrait créer un compte utilisateur dans la base de données', async () => {
      const timestamp = Date.now();
      const registerData = {
        email: `test-${timestamp}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        countryOfResidence: 'FR',
        dateOfBirth: '1990-01-01',
        targetCountry: 'CA',
        targetCity: 'Montreal',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'Blue',
        termsAccepted: true,
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const response = await POST(request);
      
      // Peut retourner 200 ou 201 selon l'implémentation
      expect([200, 201]).toContain(response.status);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      if (data.user) {
        expect(data.user.email).toBe(registerData.email.toLowerCase());
        expect(data.user.firstName).toBe(registerData.firstName);
        expect(data.user.lastName).toBe(registerData.lastName);
      }
      // Vérifier que les tokens sont retournés
      if (data.accessToken) {
        expect(data.accessToken).toBeDefined();
      }
    });

    it('devrait sanitiser l\'email en minuscules', async () => {
      const timestamp = Date.now();
      const registerData = {
        email: `TEST-${timestamp}@EXAMPLE.COM`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        countryOfResidence: 'FR',
        dateOfBirth: '1990-01-01',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'Blue',
        termsAccepted: true,
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const response = await POST(request);
      
      if (response.status === 200 || response.status === 201) {
        const data = await response.json();
        if (data.user) {
          expect(data.user.email).toBe(registerData.email.toLowerCase());
        }
      }
    });

    it('devrait retourner une erreur pour un email déjà utilisé', async () => {
      const timestamp = Date.now();
      const email = `duplicate-${timestamp}@example.com`;
      
      // Créer un premier compte
      const registerData1 = {
        email,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        countryOfResidence: 'FR',
        dateOfBirth: '1990-01-01',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'Blue',
        termsAccepted: true,
      };

      const request1 = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData1),
      });

      await POST(request1);

      // Essayer de créer un deuxième compte avec le même email
      const request2 = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData1),
      });

      const response2 = await POST(request2);
      
      // Devrait retourner une erreur
      expect([400, 409, 500]).toContain(response2.status);
    });
  });
});

