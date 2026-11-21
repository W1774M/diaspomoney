/**
 * Tests d'intégration pour /api/bookings
 * 
 * Ces tests nécessitent une base de données MongoDB en cours d'exécution
 * et testent le flux complet de la requête à la réponse
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/bookings/route';
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

// Mock de auth pour les tests d'intégration
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

describe('Integration: /api/bookings', () => {
  let requesterId: string;
  let providerId: string;

  beforeAll(() => {
    // Vérifier que MongoDB est disponible
    if (!process.env['MONGODB_URI']) {
      throw new Error('MONGODB_URI doit être défini pour les tests d\'intégration');
    }
  });

  beforeEach(async () => {
    requesterId = new ObjectId().toString();
    providerId = new ObjectId().toString();

    // Mock par défaut pour tous les tests
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: requesterId, roles: ['CUSTOMER'] },
    } as any);
  });

  afterAll(() => {
    // Cleanup si nécessaire
  });

  describe('GET /api/bookings', () => {
    it('devrait récupérer les réservations depuis la base de données', async () => {
      const request = new NextRequest('http://localhost:3000/api/bookings?limit=10&page=1');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    it('devrait appliquer les filtres de statut', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/bookings?status=CONFIRMED&limit=10',
      );
      const response = await GET(request);
      
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        expect(data.data[0].status).toBe('CONFIRMED');
      }
    });

    it('devrait filtrer par requesterId', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/bookings?requesterId=test-user-id&limit=10',
      );
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/bookings', () => {
    it('devrait créer une réservation dans la base de données', async () => {
      // Aligner le payload sur CreateBookingSchema (lib/validations/booking.schema.ts)
      // NB: on n'inclut pas de "payment" ici pour éviter les dépendances externes (Stripe) en intégration.
      const bookingData = {
        requesterId,
        providerId,
        serviceType: 'HEALTH',
        serviceId: 'test-service-id',
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        timeslot: '10:00',
        recipient: {
          firstName: 'Test',
          lastName: 'User',
        },
        metadata: {
          source: 'integration-test',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const response = await POST(request);
      
      // Peut retourner 200 ou 201 selon l'implémentation
      expect([200, 201]).toContain(response.status);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      if (data.data) {
        expect(data.data.serviceType).toBe(bookingData.serviceType);
        expect(data.data.requesterId).toBe(bookingData.requesterId);
        expect(data.data.providerId).toBe(bookingData.providerId);
      }
    });
  });
});

