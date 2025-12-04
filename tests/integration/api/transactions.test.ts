/**
 * Tests d'intégration pour /api/transactions
 * 
 * Ces tests nécessitent une base de données MongoDB en cours d'exécution
 * et testent le flux complet de la requête à la réponse
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/transactions/route';
import { NextRequest } from 'next/server';

// Mock de auth pour les tests d'intégration
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

describe('Integration: /api/transactions', () => {
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

  describe('GET /api/transactions', () => {
    it('devrait récupérer les transactions depuis la base de données', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions?limit=10&page=1');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    it('devrait appliquer les filtres de type', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/transactions?type=PAYMENT&limit=10',
      );
      const response = await GET(request);
      
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        expect(data.data[0].type).toBe('PAYMENT');
      }
    });

    it('devrait filtrer par userId', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/transactions?userId=test-user-id&limit=10',
      );
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('devrait filtrer par date range', async () => {
      const startDate = new Date(Date.now() - 86400000).toISOString();
      const endDate = new Date().toISOString();
      const request = new NextRequest(
        `http://localhost:3000/api/transactions?startDate=${startDate}&endDate=${endDate}&limit=10`,
      );
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/transactions', () => {
    it('devrait créer une transaction dans la base de données', async () => {
      const transactionData = {
        userId: 'test-user-id',
        type: 'PAYMENT',
        amount: 100,
        currency: 'EUR',
        status: 'PENDING',
        metadata: {
          bookingId: 'test-booking-id',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      const response = await POST(request);
      
      // Peut retourner 200 ou 201 selon l'implémentation
      expect([200, 201]).toContain(response.status);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      if (data.transaction) {
        expect(data.transaction.type).toBe(transactionData.type);
        expect(data.transaction.amount).toBe(transactionData.amount);
      }
    });
  });
});

