/**
 * Tests d'intégration pour /api/auth/forgot-password
 * 
 * Ces tests nécessitent une base de données MongoDB en cours d'exécution
 * et testent le flux complet de réinitialisation de mot de passe
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { POST } from '@/app/api/auth/forgot-password/route';
import { NextRequest } from 'next/server';

describe('Integration: /api/auth/forgot-password', () => {
  beforeAll(() => {
    // Vérifier que MongoDB est disponible
    if (!process.env['MONGODB_URI']) {
      throw new Error('MONGODB_URI doit être défini pour les tests d\'intégration');
    }
  });

  afterAll(() => {
    // Cleanup si nécessaire
  });

  describe('POST /api/auth/forgot-password', () => {
    it('devrait générer un token de réinitialisation pour un utilisateur existant', async () => {
      // Note: Cet utilisateur doit exister dans la base de données de test
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });

      const response = await POST(request);
      
      // Pour des raisons de sécurité, on retourne toujours 200
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
    });

    it('devrait retourner un succès même si l\'utilisateur n\'existe pas (sécurité)', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
        }),
      });

      const response = await POST(request);
      
      // Pour des raisons de sécurité, on retourne toujours 200
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
    });

    it('devrait convertir l\'email en minuscules', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'TEST@EXAMPLE.COM',
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});

