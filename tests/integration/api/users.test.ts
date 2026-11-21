/**
 * Tests d'intégration pour /api/users
 * 
 * Ces tests nécessitent une base de données MongoDB en cours d'exécution
 * et testent le flux complet de la requête à la réponse
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/users/route';
import { NextRequest } from 'next/server';

// Mock de auth pour les tests d'intégration
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

describe('Integration: /api/users', () => {
  beforeAll(() => {
    // Vérifier que MongoDB est disponible
    if (!process.env['MONGODB_URI']) {
      throw new Error('MONGODB_URI doit être défini pour les tests d\'intégration');
    }
  });

  beforeEach(async () => {
    // Mock par défaut pour tous les tests
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'test-user-id', roles: ['ADMIN'] },
    } as any);
  });

  afterAll(() => {
    // Cleanup si nécessaire
  });

  describe('GET /api/users', () => {
    it('devrait récupérer les utilisateurs depuis la base de données', async () => {
      const request = new NextRequest('http://localhost:3000/api/users?limit=10&page=1');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    it('devrait appliquer les filtres de rôle', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/users?role=CUSTOMER&limit=10',
      );
      const response = await GET(request);
      
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        expect(data.data[0].roles).toContain('CUSTOMER');
      }
    });
  });

  describe('POST /api/users', () => {
    it('devrait créer un utilisateur dans la base de données', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        roles: ['CUSTOMER'],
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.email).toBe(userData.email);
    });
  });
});

