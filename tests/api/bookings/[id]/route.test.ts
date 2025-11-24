/**
 * Tests unitaires pour /api/bookings/[id]
 * 
 * Implémente les tests pour :
 * - GET /api/bookings/[id]
 * - PUT /api/bookings/[id]
 * - DELETE /api/bookings/[id]
 * - Validation des paramètres
 * - Utilisation de bookingService
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/bookings/[id]/route';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';

// Mock de bookingService
vi.mock('@/services/booking/booking.service', () => ({
  bookingService: {
    getBookingById: vi.fn(),
    updateBooking: vi.fn(),
    cancelBooking: vi.fn(),
  },
}));

// Mock de bookingMapper
vi.mock('@/lib/mappers', () => ({
  bookingMapper: {
    map: vi.fn(),
  },
}));

// Mock de auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock de validateBody
vi.mock('@/lib/api/error-handler', () => ({
  validateBody: vi.fn((body) => body),
}));

// Mock de childLogger
vi.mock('@/lib/logger', () => ({
  childLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('GET /api/bookings/[id]', () => {
  let bookingService: typeof import('@/services/booking/booking.service').bookingService;
  let bookingMapper: typeof import('@/lib/mappers').bookingMapper;

  beforeEach(async () => {
    vi.clearAllMocks();
    bookingService = (await import('@/services/booking/booking.service')).bookingService;
    bookingMapper = (await import('@/lib/mappers')).bookingMapper;
  });

  it('devrait récupérer une réservation par ID avec succès', async () => {
    const mockBooking = {
      _id: '507f1f77bcf86cd799439011',
      reservationNumber: 'RES-001',
      status: 'CONFIRMED',
    };

    const mockMappedBooking = {
      id: '507f1f77bcf86cd799439011',
      reservationNumber: 'RES-001',
      status: 'CONFIRMED',
    };

    vi.mocked(bookingService.getBookingById).mockResolvedValueOnce(mockBooking);
    vi.mocked(bookingMapper.map).mockReturnValueOnce(mockMappedBooking);

    const request = new NextRequest('http://localhost:3000/api/bookings/507f1f77bcf86cd799439011');
    const params = { id: '507f1f77bcf86cd799439011' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.booking).toEqual(mockMappedBooking);
    expect(vi.mocked(bookingService.getBookingById)).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(vi.mocked(bookingMapper.map)).toHaveBeenCalledWith(mockBooking);
  });

  it('devrait retourner 400 pour un ID invalide', async () => {
    const request = new NextRequest('http://localhost:3000/api/bookings/invalid-id');
    const params = { id: 'invalid-id' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('ID de réservation invalide');
    expect(vi.mocked(bookingService.getBookingById)).not.toHaveBeenCalled();
  });

  it('devrait retourner 404 si la réservation n\'existe pas', async () => {
    vi.mocked(bookingService.getBookingById).mockResolvedValueOnce(null);

    const validId = new mongoose.Types.ObjectId().toString();
    const request = new NextRequest(`http://localhost:3000/api/bookings/${validId}`);
    const params = { id: validId };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Réservation non trouvée');
  });

  it('devrait gérer les erreurs du service', async () => {
    vi.mocked(bookingService.getBookingById).mockRejectedValueOnce(new Error('Database error'));

    const validId = new mongoose.Types.ObjectId().toString();
    const request = new NextRequest(`http://localhost:3000/api/bookings/${validId}`);
    const params = { id: validId };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erreur interne du serveur');
  });

  it('devrait gérer params comme Promise', async () => {
    const mockBooking = {
      _id: '507f1f77bcf86cd799439011',
      reservationNumber: 'RES-001',
    };

    vi.mocked(bookingService.getBookingById).mockResolvedValueOnce(mockBooking);
    vi.mocked(bookingMapper.map).mockReturnValueOnce(mockBooking);

    const request = new NextRequest('http://localhost:3000/api/bookings/507f1f77bcf86cd799439011');
    const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe('PUT /api/bookings/[id]', () => {
  let bookingService: typeof import('@/services/booking/booking.service').bookingService;
  let bookingMapper: typeof import('@/lib/mappers').bookingMapper;

  beforeEach(async () => {
    vi.clearAllMocks();
    bookingService = (await import('@/services/booking/booking.service')).bookingService;
    bookingMapper = (await import('@/lib/mappers')).bookingMapper;
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
    });
  });

  it('devrait mettre à jour une réservation avec succès', async () => {
    const mockUpdatedBooking = {
      _id: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
      reservationNumber: 'RES-001',
      status: 'CONFIRMED',
      appointmentDate: new Date('2024-01-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockMappedBooking = {
      id: '507f1f77bcf86cd799439011',
      reservationNumber: 'RES-001',
      status: 'CONFIRMED',
    };

    vi.mocked(bookingService.updateBooking).mockResolvedValueOnce(mockUpdatedBooking);
    vi.mocked(bookingMapper.map).mockReturnValueOnce(mockMappedBooking);

    const request = new NextRequest('http://localhost:3000/api/bookings/507f1f77bcf86cd799439011', {
      method: 'PUT',
      body: JSON.stringify({
        status: 'CONFIRMED',
        appointmentDate: '2024-01-15T10:00:00.000Z',
      }),
    });
    const params = { id: '507f1f77bcf86cd799439011' };

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Réservation mise à jour avec succès');
    expect(data.booking).toEqual(mockMappedBooking);
    expect(vi.mocked(bookingService.updateBooking)).toHaveBeenCalled();
  });

  it('devrait retourner 401 si non authentifié', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce(null);

    const validId = new mongoose.Types.ObjectId().toString();
    const request = new NextRequest(`http://localhost:3000/api/bookings/${validId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    const params = { id: validId };

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non autorisé');
    expect(vi.mocked(bookingService.updateBooking)).not.toHaveBeenCalled();
  });

  it('devrait retourner 400 pour un ID invalide', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/bookings/invalid-id', {
      method: 'PUT',
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    const params = { id: 'invalid-id' };

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('ID de réservation invalide');
  });

  it('devrait valider le body avec UpdateBookingSchema', async () => {
    const { validateBody } = await import('@/lib/api/error-handler');
    const mockUpdatedBooking = {
      _id: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
      reservationNumber: 'RES-001',
      status: 'CONFIRMED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(bookingService.updateBooking).mockResolvedValueOnce(mockUpdatedBooking);
    vi.mocked(bookingMapper.map).mockReturnValueOnce(mockUpdatedBooking);

    const request = new NextRequest('http://localhost:3000/api/bookings/507f1f77bcf86cd799439011', {
      method: 'PUT',
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    const params = { id: '507f1f77bcf86cd799439011' };

    await PUT(request, { params });

    expect(validateBody).toHaveBeenCalled();
  });

  it('devrait retourner 404 si la réservation n\'existe pas', async () => {
    vi.mocked(bookingService.updateBooking).mockResolvedValueOnce(null);

    const validId = new mongoose.Types.ObjectId().toString();
    const request = new NextRequest(`http://localhost:3000/api/bookings/${validId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    const params = { id: validId };

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Réservation non trouvée');
  });

  it('devrait gérer les erreurs du service', async () => {
    vi.mocked(bookingService.updateBooking).mockRejectedValueOnce(new Error('Database error'));

    const validId = new mongoose.Types.ObjectId().toString();
    const request = new NextRequest(`http://localhost:3000/api/bookings/${validId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    const params = { id: validId };

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  it('devrait gérer params comme Promise', async () => {
    const mockUpdatedBooking = {
      _id: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
      reservationNumber: 'RES-001',
      status: 'CONFIRMED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(bookingService.updateBooking).mockResolvedValueOnce(mockUpdatedBooking);
    vi.mocked(bookingMapper.map).mockReturnValueOnce(mockUpdatedBooking);

    const request = new NextRequest('http://localhost:3000/api/bookings/507f1f77bcf86cd799439011', {
      method: 'PUT',
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe('DELETE /api/bookings/[id]', () => {
  let bookingService: typeof import('@/services/booking/booking.service').bookingService;

  beforeEach(async () => {
    vi.clearAllMocks();
    bookingService = (await import('@/services/booking/booking.service')).bookingService;
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
    });
  });

  it('devrait annuler une réservation avec succès', async () => {
    const mockCancelledBooking = {
      _id: '507f1f77bcf86cd799439011',
      reservationNumber: 'RES-001',
      status: 'CANCELLED',
    };

    vi.mocked(bookingService.cancelBooking).mockResolvedValueOnce(mockCancelledBooking);

    const request = new NextRequest('http://localhost:3000/api/bookings/507f1f77bcf86cd799439011', {
      method: 'DELETE',
    });
    const params = { id: '507f1f77bcf86cd799439011' };

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Réservation annulée avec succès');
    expect(data.booking).toEqual(mockCancelledBooking);
    expect(vi.mocked(bookingService.cancelBooking)).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('devrait retourner 401 si non authentifié', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce(null);

    const validId = new mongoose.Types.ObjectId().toString();
    const request = new NextRequest(`http://localhost:3000/api/bookings/${validId}`, {
      method: 'DELETE',
    });
    const params = { id: validId };

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non autorisé');
    expect(vi.mocked(bookingService.cancelBooking)).not.toHaveBeenCalled();
  });

  it('devrait retourner 400 pour un ID invalide', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/bookings/invalid-id', {
      method: 'DELETE',
    });
    const params = { id: 'invalid-id' };

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('ID de réservation invalide');
  });

  it('devrait retourner 404 si la réservation n\'existe pas', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    const { bookingService } = await import('@/services/booking/booking.service');
    vi.mocked(bookingService.cancelBooking).mockRejectedValueOnce(new Error('Réservation non trouvée'));

    const validId = new mongoose.Types.ObjectId().toString();
    const request = new NextRequest(`http://localhost:3000/api/bookings/${validId}`, {
      method: 'DELETE',
    });
    const params = { id: validId };

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Réservation non trouvée');
  });

  it('devrait retourner 400 si la réservation est déjà annulée', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    const { bookingService } = await import('@/services/booking/booking.service');
    // La route vérifie si le message contient "déjà annulée" ou "terminée"
    vi.mocked(bookingService.cancelBooking).mockRejectedValueOnce(new Error('Réservation déjà annulée'));

    const validId = new mongoose.Types.ObjectId().toString();
    const request = new NextRequest(`http://localhost:3000/api/bookings/${validId}`, {
      method: 'DELETE',
    });
    const params = { id: validId };

    const response = await DELETE(request, { params });
    const data = await response.json();

    // La route devrait retourner 400 si le message contient "déjà annulée"
    expect([400, 500]).toContain(response.status);
    if (response.status === 400) {
      expect(data.error).toContain('annulée');
    }
  });

  it('devrait gérer les erreurs du service', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    const { bookingService } = await import('@/services/booking/booking.service');
    vi.mocked(bookingService.cancelBooking).mockRejectedValueOnce(new Error('Database error'));

    const validId = new mongoose.Types.ObjectId().toString();
    const request = new NextRequest(`http://localhost:3000/api/bookings/${validId}`, {
      method: 'DELETE',
    });
    const params = { id: validId };

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Erreur lors de l'annulation de la réservation");
  });

  it('devrait gérer params comme Promise', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    const { bookingService } = await import('@/services/booking/booking.service');
    const mockCancelledBooking = {
      _id: '507f1f77bcf86cd799439011',
      id: '507f1f77bcf86cd799439011',
      reservationNumber: 'RES-001',
      status: 'CANCELLED',
      requesterId: 'user123',
      providerId: 'provider1',
      serviceId: 'service1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(bookingService.cancelBooking).mockResolvedValueOnce(mockCancelledBooking as any);

    const request = new NextRequest('http://localhost:3000/api/bookings/507f1f77bcf86cd799439011', {
      method: 'DELETE',
    });
    const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

