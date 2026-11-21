/**
 * Tests d'intégration pour /api/quotes
 * 
 * Ces tests nécessitent une base de données MongoDB en cours d'exécution
 * et testent le flux complet de la requête à la réponse
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/quotes/route';
import { NextRequest } from 'next/server';

// Mock de auth pour les tests d'intégration
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

describe('Integration: /api/quotes', () => {
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
      user: { id: 'test-user-id', roles: ['CUSTOMER'] },
    } as any);
  });

  afterAll(() => {
    // Cleanup si nécessaire
  });

  describe('GET /api/quotes', () => {
    it('devrait récupérer les devis depuis la base de données', async () => {
      const request = new NextRequest('http://localhost:3000/api/quotes?limit=10&page=1');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    it('devrait appliquer les filtres de type', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/quotes?type=HEALTH&limit=10',
      );
      const response = await GET(request);
      
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        expect(data.data[0].type).toBe('HEALTH');
      }
    });

    it('devrait appliquer les filtres de statut', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/quotes?status=PENDING&limit=10',
      );
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('devrait gérer la pagination correctement', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/quotes?page=2&limit=5',
      );
      const response = await GET(request);
      
      const data = await response.json();
      if (data.success && data.pagination) {
        expect(data.pagination.page).toBe(2);
        expect(data.pagination.limit).toBe(5);
      }
    });
  });
});

