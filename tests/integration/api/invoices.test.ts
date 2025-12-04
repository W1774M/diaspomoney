/**
 * Tests d'intégration pour /api/invoices
 * 
 * Ces tests nécessitent une base de données MongoDB en cours d'exécution
 * et testent le flux complet de la requête à la réponse
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/invoices/route';
import { NextRequest } from 'next/server';

// Mock de auth pour les tests d'intégration
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

describe('Integration: /api/invoices', () => {
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

  describe('GET /api/invoices', () => {
    it('devrait récupérer les factures depuis la base de données', async () => {
      const request = new NextRequest('http://localhost:3000/api/invoices?limit=10&page=1');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    it('devrait appliquer les filtres de statut', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/invoices?status=PAID&limit=10',
      );
      const response = await GET(request);
      
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        expect(data.data[0].status).toBe('PAID');
      }
    });

    it('devrait filtrer par clientId', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/invoices?clientId=test-client-id&limit=10',
      );
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/invoices', () => {
    it('devrait créer une facture dans la base de données', async () => {
      const invoiceData = {
        clientId: 'test-client-id',
        items: [
          {
            description: 'Service test',
            quantity: 1,
            unitPrice: 100,
          },
        ],
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      const response = await POST(request);
      
      // Peut retourner 200 ou 201 selon l'implémentation
      expect([200, 201]).toContain(response.status);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      if (data.invoice) {
        expect(data.invoice.clientId).toBe(invoiceData.clientId);
      }
    });
  });
});

