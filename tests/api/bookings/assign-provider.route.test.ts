/**
 * POST/DELETE /api/bookings/[id]/assign-provider — chemins unitaires (external, auth, erreurs)
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const {
  mockAuth,
  getBookingById,
  updateBooking,
  findById,
  sendExternalProviderAssignmentEmail,
  mapBooking,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  getBookingById: vi.fn(),
  updateBooking: vi.fn(),
  findById: vi.fn(),
  sendExternalProviderAssignmentEmail: vi.fn(),
  mapBooking: vi.fn((b) => ({ id: b.id, providerId: b.providerId })),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/booking/booking.service', () => ({
  bookingService: { getBookingById, updateBooking },
}));
vi.mock('@/repositories', () => ({
  getUserRepository: () => ({ findById }),
}));
vi.mock('@/lib/email/resend', () => ({
  sendExternalProviderAssignmentEmail,
}));
vi.mock('@/lib/mappers', () => ({
  bookingMapper: { map: mapBooking },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { POST, DELETE } from '@/app/api/bookings/[id]/assign-provider/route';

const BOOKING_ID = '507f1f77bcf86cd799439011';

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: BOOKING_ID,
    _id: BOOKING_ID,
    reservationNumber: 'RES-1',
    requesterId: 'client-1',
    providerId: 'prov-old',
    serviceId: 'svc-1',
    serviceType: 'HEALTH',
    status: 'PENDING',
    appointmentDate: new Date('2026-12-01T10:00:00Z'),
    timeslot: '10:00',
    recipient: { firstName: 'Ben', lastName: 'Efi', phone: '+221' },
    metadata: {
      clientFirstName: 'Ada',
      clientLastName: 'Lovelace',
      clientEmail: 'ada@example.com',
      clientPhone: '+336',
      serviceLabel: 'Consultation',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function post(id: string, body: unknown) {
  return POST(
    new NextRequest(`http://localhost/api/bookings/${id}/assign-provider`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

function del(id: string) {
  return DELETE(
    new NextRequest(`http://localhost/api/bookings/${id}/assign-provider`, {
      method: 'DELETE',
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe('POST /api/bookings/[id]/assign-provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', roles: [ROLES.ADMIN] },
    });
    getBookingById.mockResolvedValue(booking());
    updateBooking.mockImplementation(async (_id, data) => ({
      ...booking(),
      ...data,
      metadata: { ...booking().metadata, ...(data.metadata || {}) },
    }));
    sendExternalProviderAssignmentEmail.mockResolvedValue(true);
    findById.mockResolvedValue({
      id: 'prov-1',
      name: 'Dr House',
      email: 'house@example.com',
    });
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await post(BOOKING_ID, { mode: 'registered', providerId: 'p1' })).status).toBe(401);
  });

  it('répond 403 pour un non-admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', roles: [ROLES.CUSTOMER] } });
    expect((await post(BOOKING_ID, { mode: 'registered', providerId: 'p1' })).status).toBe(403);
  });

  it('répond 400 pour un id invalide', async () => {
    expect((await post('not-an-id', { mode: 'registered', providerId: 'p1' })).status).toBe(400);
  });

  it('attribue un prestataire externe et envoie l’email', async () => {
    const res = await post(BOOKING_ID, {
      mode: 'external',
      providerEmail: 'externe@example.com',
      providerName: 'Cabinet Ext',
      sendEmail: true,
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateBooking).toHaveBeenCalledWith(
      BOOKING_ID,
      expect.objectContaining({
        providerId: '',
        metadata: expect.objectContaining({
          assignedProviderType: 'EXTERNAL',
          assignedProviderEmail: 'externe@example.com',
          assignedProviderName: 'Cabinet Ext',
        }),
      }),
    );
    expect(sendExternalProviderAssignmentEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'externe@example.com',
        reservationNumber: 'RES-1',
        serviceName: 'Consultation',
      }),
    );
    // Second update pour le statut email
    expect(updateBooking.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('reste en succès HTTP si l’email externe échoue', async () => {
    sendExternalProviderAssignmentEmail.mockRejectedValueOnce(new Error('smtp down'));
    const res = await post(BOOKING_ID, {
      mode: 'external',
      providerEmail: 'externe@example.com',
    });
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('attribue un prestataire enregistré', async () => {
    const providerId = '507f1f77bcf86cd799439099';
    findById.mockResolvedValue({
      id: providerId,
      name: 'Dr House',
      email: 'house@example.com',
    });
    const res = await post(BOOKING_ID, {
      mode: 'registered',
      providerId,
      sharedElements: { clientInfo: true, appointmentInfo: true },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateBooking).toHaveBeenCalledWith(
      BOOKING_ID,
      expect.objectContaining({
        providerId,
        metadata: expect.objectContaining({
          assignedProviderType: 'REGISTERED',
          assignedProviderId: providerId,
        }),
      }),
    );
  });

  it('n’envoie pas d’email externe si sendEmail=false', async () => {
    const res = await post(BOOKING_ID, {
      mode: 'external',
      providerEmail: 'externe@example.com',
      sendEmail: false,
    });
    expect(res.status).toBe(200);
    expect(sendExternalProviderAssignmentEmail).not.toHaveBeenCalled();
  });

  it('répond 404 si le prestataire enregistré est introuvable', async () => {
    findById.mockResolvedValue(null);
    const res = await post(BOOKING_ID, {
      mode: 'registered',
      providerId: '507f1f77bcf86cd799439099',
    });
    expect(res.status).toBe(404);
  });

  it('répond 404 si la réservation est introuvable', async () => {
    getBookingById.mockRejectedValue(new Error('Réservation non trouvée'));
    const res = await post(BOOKING_ID, {
      mode: 'registered',
      providerId: '507f1f77bcf86cd799439099',
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/bookings/[id]/assign-provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', roles: [ROLES.ADMIN] },
    });
    getBookingById.mockResolvedValue(booking());
    updateBooking.mockResolvedValue(booking({ providerId: '' }));
  });

  it('retire le prestataire assigné', async () => {
    const res = await del(BOOKING_ID);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(updateBooking).toHaveBeenCalledWith(
      BOOKING_ID,
      expect.objectContaining({
        providerId: '',
        metadata: expect.objectContaining({
          assignedProviderType: undefined,
          assignedProviderId: undefined,
        }),
      }),
    );
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await del(BOOKING_ID)).status).toBe(401);
  });
});
