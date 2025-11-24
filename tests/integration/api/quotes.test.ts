/**
 * Tests d'intégration pour /api/quotes
 * 
 * Ces tests nécessitent une base de données MongoDB en cours d'exécution
 * et testent le flux complet de la requête à la réponse
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GET } from '@/app/api/quotes/route';
import { NextRequest } from 'next/server';

describe('Integration: /api/quotes', () => {
  beforeAll(() => {
    // Vérifier que MongoDB est disponible
    if (!process.env['MONGODB_URI']) {
      throw new Error('MONGODB_URI doit être défini pour les tests d\'intégration');
    }
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
      if (data.data.length > 0) {
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
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(5);
    });
  });
});

