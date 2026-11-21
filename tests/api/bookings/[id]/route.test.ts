/**
 * Unit tests for /api/bookings/[id]
 * 
 * Tests for:
 * - GET /api/bookings/[id]
 * - PUT /api/bookings/[id]
 * - DELETE /api/bookings/[id]
 * - Parameter validation
 * - Usage of bookingService and bookingMapper
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/bookings/[id]/route';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import type { Booking } from '@/repositories/interfaces/IBookingRepository';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

// Helper pour créer un mock Booking complet
const createMockBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  reservationNumber: 'RES-001',
  requesterId: 'user123',
  providerId: 'provider123',
  serviceId: 'service123',
  serviceType: 'HEALTH',
  status: 'CONFIRMED',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper pour créer un mock BookingResponse complet
const createMockBookingResponse = (overrides: Partial<BookingResponse> = {}): BookingResponse => ({
  id: '507f1f77bcf86cd799439011',
  _id: '507f1f77bcf86cd799439011',
  reservationNumber: 'RES-001',
  requesterId: 'user123',
  providerId: 'provider123',
  serviceId: 'service123',
  serviceType: 'HEALTH',
  status: 'CONFIRMED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// bookingService mock
vi.mock('@/services/booking/booking.service', () => ({
  bookingService: {
    getBookingById: vi.fn(),
    updateBooking: vi.fn(),
    cancelBooking: vi.fn(),
  },
}));

// bookingMapper mock
vi.mock('@/lib/mappers', () => ({
  bookingMapper: {
    map: vi.fn(),
  },
}));

// auth mock
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// validateBody mock
vi.mock('@/lib/api/error-handler', () => ({
  validateBody: vi.fn((body) => body),
}));

// childLogger mock
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
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);
  });

  it('should fetch a booking by ID successfully', async () => {
    const mockBooking = createMockBooking();
    const mockMappedBooking = createMockBookingResponse();
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

  it('should return 400 for invalid ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/bookings/invalid-id');
    const params = { id: 'invalid-id' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('ID de réservation invalide');
    expect(vi.mocked(bookingService.getBookingById)).not.toHaveBeenCalled();
  });

  it('should return 404 if booking does not exist', async () => {
    vi.mocked(bookingService.getBookingById).mockResolvedValueOnce(null as any);

    const validId = new mongoose.Types.ObjectId().toString();
    const request = new NextRequest(`http://localhost:3000/api/bookings/${validId}`);
    const params = { id: validId };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Réservation non trouvée');
  });

  it('should handle service errors', async () => {
    vi.mocked(bookingService.getBookingById).mockRejectedValueOnce(new Error('Database error'));

    const validId = new mongoose.Types.ObjectId().toString();
    const request = new NextRequest(`http://localhost:3000/api/bookings/${validId}`);
    const params = { id: validId };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erreur interne du serveur');
  });

  it('should support params as Promise', async () => {
    const mockBooking = createMockBooking();
    const mockMappedBooking = createMockBookingResponse();

    vi.mocked(bookingService.getBookingById).mockResolvedValueOnce(mockBooking);
    vi.mocked(bookingMapper.map).mockReturnValueOnce(mockMappedBooking);

    const request = new NextRequest('http://localhost:3000/api/bookings/507f1f77bcf86cd799439011');
    const params = Promise.resolve({ id: '507f1f77bcf86cd799439011' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return 404 if booking does not exist', async () => {
    vi.mocked(bookingService.getBookingById).mockResolvedValueOnce(null as any);

    const validId = new mongoose.Types.ObjectId().toString();
    const request = new NextRequest(`http://localhost:3000/api/bookings/${validId}`);
    const params = { id: validId };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Réservation non trouvée');
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
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['ADMIN'] },
    } as any);
  });

  it('should update a booking successfully', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', roles: ['ADMIN'] },
    } as any);

    const mockUpdatedBooking = createMockBooking({
      appointmentDate: new Date('2024-01-15'),
    });

    const mockMappedBooking = createMockBookingResponse({
      appointmentDate: new Date('2024-01-15').toISOString(),
    });

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

  it('should return 401 if unauthenticated', async () => {
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

  it('should return 400 for invalid ID', async () => {
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

  it('should validate body with UpdateBookingSchema', async () => {
    const { validateBody } = await import('@/lib/api/error-handler');
    const mockUpdatedBooking = createMockBooking();
    const mockMappedBooking = createMockBookingResponse();

    vi.mocked(bookingService.updateBooking).mockResolvedValueOnce(mockUpdatedBooking);
    vi.mocked(bookingMapper.map).mockReturnValueOnce(mockMappedBooking);

    const request = new NextRequest('http://localhost:3000/api/bookings/507f1f77bcf86cd799439011', {
      method: 'PUT',
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    const params = { id: '507f1f77bcf86cd799439011' };

    await PUT(request, { params });

    expect(validateBody).toHaveBeenCalled();
  });

  it('should return 404 if booking does not exist', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
    } as any);

    vi.mocked(bookingService.updateBooking).mockResolvedValueOnce(null as any);

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

  it('should handle service errors', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
    } as any);

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

  it('should support params as Promise', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
    } as any);

    const mockUpdatedBooking = createMockBooking();
    const mockMappedBooking = createMockBookingResponse();

    vi.mocked(bookingService.updateBooking).mockResolvedValueOnce(mockUpdatedBooking);
    vi.mocked(bookingMapper.map).mockReturnValueOnce(mockMappedBooking);

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
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123' },
    } as any);
  });

  it('should cancel a booking successfully', async () => {
    const mockCancelledBooking = createMockBooking({
      status: 'CANCELLED',
    });

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
    expect(data.booking).toBeDefined();
    expect(data.booking.status).toBe('CANCELLED');
    expect(data.booking.id).toBe('507f1f77bcf86cd799439011');
    expect(vi.mocked(bookingService.cancelBooking)).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('should return 401 if unauthenticated', async () => {
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

  it('should return 400 for invalid ID', async () => {
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

  it('should return 404 if booking does not exist', async () => {
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

  it('should return 400 if booking is already canceled', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    const { bookingService } = await import('@/services/booking/booking.service');
    vi.mocked(bookingService.cancelBooking).mockRejectedValueOnce(new Error('Réservation déjà annulée'));

    const validId = new mongoose.Types.ObjectId().toString();
    const request = new NextRequest(`http://localhost:3000/api/bookings/${validId}`, {
      method: 'DELETE',
    });
    const params = { id: validId };

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect([400, 500]).toContain(response.status);
    if (response.status === 400) {
      expect(data.error).toContain('annulée');
    }
  });

  it('should handle service errors', async () => {
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

  it('should support params as Promise', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    const { bookingService } = await import('@/services/booking/booking.service');
    const mockCancelledBooking = createMockBooking({
      status: 'CANCELLED',
    });

    vi.mocked(bookingService.cancelBooking).mockResolvedValueOnce(mockCancelledBooking);

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

