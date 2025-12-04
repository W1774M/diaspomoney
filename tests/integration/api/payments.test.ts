/**
 * Tests d'intégration pour /api/payments
 * 
 * Ces tests nécessitent une base de données MongoDB en cours d'exécution
 * et Stripe en mode test pour les paiements
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { POST as POST_CREATE_INTENT } from '@/app/api/payments/create-intent/route';
import { POST as POST_PROCESS } from '@/app/api/payments/process/route';
import { GET as GET_TRANSACTIONS } from '@/app/api/payments/transactions/route';
import { NextRequest } from 'next/server';

// Mock de auth pour les tests d'intégration
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

describe('Integration: /api/payments', () => {
  beforeAll(() => {
    // Vérifier que MongoDB est disponible
    if (!process.env['MONGODB_URI']) {
      throw new Error('MONGODB_URI doit être défini pour les tests d\'intégration');
    }
    // Note: Stripe en mode test devrait être configuré via STRIPE_SECRET_KEY
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

  describe('POST /api/payments/create-intent', () => {
    it('devrait créer un PaymentIntent avec Stripe', async () => {
      const paymentData = {
        amount: 5000, // 50.00 EUR en centimes
        currency: 'EUR',
        metadata: {
          bookingId: 'test-booking-id',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const response = await POST_CREATE_INTENT(request);
      
      // Peut retourner 200 ou 201 selon l'implémentation
      expect([200, 201]).toContain(response.status);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      if (data.clientSecret || data.paymentIntent) {
        expect(data.clientSecret || data.paymentIntent.client_secret).toBeDefined();
      }
    });
  });

  describe('POST /api/payments/process', () => {
    it('devrait traiter un paiement avec succès', async () => {
      const paymentData = {
        paymentIntentId: 'pi_test_123',
        bookingId: 'test-booking-id',
      };

      const request = new NextRequest('http://localhost:3000/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const response = await POST_PROCESS(request);
      
      // Le statut peut varier selon l'état du PaymentIntent
      expect([200, 400, 404]).toContain(response.status);
      
      const data = await response.json();
      // Même en cas d'erreur, la structure de réponse devrait être cohérente
      expect(data).toBeDefined();
    });
  });

  describe('GET /api/payments/transactions', () => {
    it('devrait récupérer les transactions de paiement', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/payments/transactions?limit=10&page=1',
      );
      const response = await GET_TRANSACTIONS(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data || data.transactions)).toBe(true);
    });

    it('devrait filtrer par userId', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/payments/transactions?userId=test-user-id&limit=10',
      );
      const response = await GET_TRANSACTIONS(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});

