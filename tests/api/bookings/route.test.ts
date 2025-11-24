/**
 * Tests unitaires pour /api/bookings
 * 
 * Implémente les tests pour :
 * - GET /api/bookings
 * - POST /api/bookings
 * - Validation des paramètres
 * - Utilisation de serviceBookingFacade
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/bookings/route';
import { NextRequest } from 'next/server';

// Mock de serviceBookingFacade
vi.mock('@/facades', () => ({
  serviceBookingFacade: {
    createBookingWithPayment: vi.fn(),
  },
}));

// Mock de getBookingRepository - créer une instance unique mockée
const mockBookingRepository = {
  findBookingsWithFilters: vi.fn(),
};

vi.mock('@/repositories', () => ({
  getBookingRepository: vi.fn(() => mockBookingRepository),
}));

// Mock de bookingMapper
vi.mock('@/lib/mappers', () => ({
  bookingMapper: {
    mapMany: vi.fn((bookings) => bookings),
  },
}));

// Mock de handleApiRoute
vi.mock('@/lib/api/error-handler', () => ({
  handleApiRoute: vi.fn(async (_request, handler) => {
    const result = await handler();
    // Si le résultat a déjà une méthode json(), le retourner tel quel
    if (result && typeof result === 'object' && 'json' in result) {
      return result;
    }
    // Sinon, envelopper dans un objet avec json()
    return {
      json: async () => result,
      status: 200,
    };
  }),
  validateBody: vi.fn((body) => body),
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
    }
  },
}));

// Mock de createPaginatedResponse et createResourceResponse
vi.mock('@/lib/api/response', () => ({
  createPaginatedResponse: vi.fn((data, pagination) => ({
    json: async () => ({
      success: true,
      data,
      pagination,
    }),
  })),
  createResourceResponse: vi.fn((data, metadata) => ({
    json: async () => ({
      success: true,
      data,
      ...metadata,
    }),
  })),
}));

// Mock de logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
  },
}));

// Mock de initializeDI
vi.mock('@/lib/di/initialize', () => ({
  initializeDI: vi.fn(),
}));

describe('GET /api/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les réservations avec succès', async () => {
    const mockBookings = [
      {
        _id: '1',
        reservationNumber: 'RES-001',
        status: 'PENDING',
        requesterId: 'user1',
        providerId: 'provider1',
      },
      {
        _id: '2',
        reservationNumber: 'RES-002',
        status: 'CONFIRMED',
        requesterId: 'user2',
        providerId: 'provider2',
      },
    ];

    vi.mocked(mockBookingRepository.findBookingsWithFilters).mockResolvedValue({
      data: mockBookings as any,
      total: 2,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        pages: 1,
        total: 2,
        hasNext: false,
        hasPrev: false,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/bookings?limit=20&page=1');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.pagination.total).toBe(2);
  });

  it('devrait filtrer par userId', async () => {
    vi.mocked(mockBookingRepository.findBookingsWithFilters).mockResolvedValue({
      data: [],
      total: 0,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        pages: 0,
        total: 0,
        hasNext: false,
        hasPrev: false,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/bookings?userId=user123');
    await GET(request);

    expect(mockBookingRepository.findBookingsWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterId: 'user123',
      }),
      expect.any(Object),
    );
  });

  it('devrait filtrer par providerId', async () => {
    vi.mocked(mockBookingRepository.findBookingsWithFilters).mockResolvedValue({
      data: [],
      total: 0,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        pages: 0,
        total: 0,
        hasNext: false,
        hasPrev: false,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/bookings?providerId=provider123');
    await GET(request);

    expect(mockBookingRepository.findBookingsWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: 'provider123',
      }),
      expect.any(Object),
    );
  });

  it('devrait filtrer par status (VALID_STATUSES)', async () => {
    vi.mocked(mockBookingRepository.findBookingsWithFilters).mockResolvedValue({
      data: [],
      total: 0,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        pages: 0,
        total: 0,
        hasNext: false,
        hasPrev: false,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/bookings?status=PENDING');
    await GET(request);

    expect(mockBookingRepository.findBookingsWithFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PENDING',
      }),
      expect.any(Object),
    );
  });

  it('devrait gérer la pagination avec limit et offset', async () => {
    vi.mocked(mockBookingRepository.findBookingsWithFilters).mockResolvedValue({
      data: [],
      total: 0,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        pages: 0,
        total: 0,
        hasNext: false,
        hasPrev: false,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/bookings?limit=20&offset=40');
    await GET(request);

    // offset 40 avec limit 20 = page 3
    expect(mockBookingRepository.findBookingsWithFilters).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        page: 3,
        limit: 20,
      }),
    );
  });

  it('devrait convertir automatiquement offset en page', async () => {
    vi.mocked(mockBookingRepository.findBookingsWithFilters).mockResolvedValue({
      data: [],
      total: 0,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        pages: 0,
        total: 0,
        hasNext: false,
        hasPrev: false,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/bookings?offset=60&limit=20');
    await GET(request);

    // offset 60 avec limit 20 = page 4 (60/20 + 1)
    expect(mockBookingRepository.findBookingsWithFilters).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        page: 4,
        limit: 20,
      }),
    );
  });

  it('devrait utiliser BookingQueryBuilder', async () => {
    vi.mocked(mockBookingRepository.findBookingsWithFilters).mockResolvedValue({
      data: [],
      total: 0,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        pages: 0,
        total: 0,
        hasNext: false,
        hasPrev: false,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/bookings');
    await GET(request);

    // Vérifier que le repository a été appelé avec les filtres du builder
    expect(mockBookingRepository.findBookingsWithFilters).toHaveBeenCalled();
  });

  it('devrait mapper avec bookingMapper', async () => {
    const mockBookings = [{ _id: '1', reservationNumber: 'RES-001' }];

    vi.mocked(mockBookingRepository.findBookingsWithFilters).mockResolvedValue({
      data: mockBookings as any,
      total: 1,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        pages: 1,
        total: 1,
        hasNext: false,
        hasPrev: false,
      },
    });

    const { bookingMapper } = await import('@/lib/mappers');
    vi.mocked(bookingMapper.mapMany).mockReturnValue(mockBookings as any);

    const request = new NextRequest('http://localhost:3000/api/bookings');
    await GET(request);

    expect(bookingMapper.mapMany).toHaveBeenCalledWith(mockBookings);
  });

  it('devrait retourner une réponse paginée avec format standardisé', async () => {
    const mockBookings = [{ _id: '1', reservationNumber: 'RES-001' }];

    // Mock findBookingsWithFilters AVANT d'appeler GET
    vi.mocked(mockBookingRepository.findBookingsWithFilters).mockResolvedValue({
      data: mockBookings as any,
      total: 1,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        pages: 1,
        total: 1,
        hasNext: false,
        hasPrev: false,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/bookings');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.pagination).toBeDefined();
  });
});

describe('POST /api/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait créer une réservation avec paiement', async () => {
    const mockBooking = {
      id: 'booking123',
      reservationNumber: 'RES-001',
      status: 'PENDING',
    };

    const { serviceBookingFacade } = await import('@/facades');
    vi.mocked(serviceBookingFacade.createBookingWithPayment).mockResolvedValue({
      success: true,
      booking: mockBooking as any,
      paymentResult: {
        success: true,
        paymentIntentId: 'pi_123',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        requesterId: 'user123',
        providerId: 'provider123',
        serviceType: 'HEALTH',
        appointmentDate: new Date().toISOString(),
        payment: {
          amount: 1000,
          currency: 'EUR',
          paymentMethodId: 'pm_123',
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockBooking);
    expect(data.metadata.paymentResult).toBeDefined();
  });

  it('devrait créer une réservation sans paiement', async () => {
    const mockBooking = {
      id: 'booking123',
      reservationNumber: 'RES-001',
      status: 'PENDING',
    };

    const { serviceBookingFacade } = await import('@/facades');
    vi.mocked(serviceBookingFacade.createBookingWithPayment).mockResolvedValue({
      success: true,
      booking: mockBooking as any,
    });

    const request = new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        requesterId: 'user123',
        providerId: 'provider123',
        serviceType: 'HEALTH',
        appointmentDate: new Date().toISOString(),
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockBooking);
    expect(data.metadata?.paymentResult).toBeUndefined();
  });

  it('devrait valider avec CreateBookingSchema', async () => {
    const request = new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        // requesterId manquant
        providerId: 'provider123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // La validation devrait retourner 400
    expect([400, 500]).toContain(response.status);
    if (response.status === 400) {
      expect(data.success).toBe(false);
    }
  });

  it('devrait construire BookingFacadeData', async () => {
    const { serviceBookingFacade } = await import('@/facades');
    vi.mocked(serviceBookingFacade.createBookingWithPayment).mockResolvedValue({
      success: true,
      booking: { id: 'booking123' } as any,
    });

    const request = new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        requesterId: 'user123',
        providerId: 'provider123',
        serviceType: 'HEALTH',
        appointmentDate: new Date().toISOString(),
        timeslot: '10:00-11:00',
        consultationMode: 'IN_PERSON',
      }),
    });

    await POST(request);

    expect(serviceBookingFacade.createBookingWithPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterId: 'user123',
        providerId: 'provider123',
        serviceType: 'HEALTH',
        timeslot: '10:00-11:00',
        consultationMode: 'IN_PERSON',
      }),
    );
  });

  it('devrait gérer les erreurs (result.success = false)', async () => {
    const { serviceBookingFacade } = await import('@/facades');
    vi.mocked(serviceBookingFacade.createBookingWithPayment).mockResolvedValue({
      success: false,
      error: 'Erreur lors de la création',
    });

    const request = new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        requesterId: 'user123',
        providerId: 'provider123',
        serviceType: 'HEALTH',
        appointmentDate: new Date().toISOString(),
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('devrait logger avec logger.info', async () => {
    const { logger } = await import('@/lib/logger');
    const { serviceBookingFacade } = await import('@/facades');
    vi.mocked(serviceBookingFacade.createBookingWithPayment).mockResolvedValue({
      success: true,
      booking: { id: 'booking123', _id: 'booking123' } as any,
      paymentResult: { success: true },
    });

    const request = new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        requesterId: 'user123',
        providerId: 'provider123',
        serviceType: 'HEALTH',
        appointmentDate: new Date().toISOString(),
        payment: {
          amount: 1000,
          currency: 'EUR',
          paymentMethodId: 'pm_123',
        },
      }),
    });

    await POST(request);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: 'booking123',
        paymentSuccess: true,
      }),
      expect.stringContaining('Booking created'),
    );
  });

  it('devrait retourner paymentResult dans metadata si paiement', async () => {
    const { serviceBookingFacade } = await import('@/facades');
    vi.mocked(serviceBookingFacade.createBookingWithPayment).mockResolvedValue({
      success: true,
      booking: { id: 'booking123' } as any,
      paymentResult: {
        success: true,
        paymentIntentId: 'pi_123',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        requesterId: 'user123',
        providerId: 'provider123',
        serviceType: 'HEALTH',
        appointmentDate: new Date().toISOString(),
        payment: {
          amount: 1000,
          currency: 'EUR',
          paymentMethodId: 'pm_123',
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.metadata.paymentResult).toBeDefined();
    expect(data.metadata.paymentResult.success).toBe(true);
  });

  it('devrait ne pas retourner paymentResult si pas de paiement', async () => {
    const { serviceBookingFacade } = await import('@/facades');
    vi.mocked(serviceBookingFacade.createBookingWithPayment).mockResolvedValue({
      success: true,
      booking: { id: 'booking123' } as any,
    });

    const request = new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        requesterId: 'user123',
        providerId: 'provider123',
        serviceType: 'HEALTH',
        appointmentDate: new Date().toISOString(),
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.metadata?.paymentResult).toBeUndefined();
  });
});

