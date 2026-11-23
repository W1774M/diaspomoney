/**
 * GET /api/admin/bookings/progress
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const { mockAuth, getBookings } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  getBookings: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/booking/booking.service', () => ({
  bookingService: { getBookings },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { GET } from '@/app/api/admin/bookings/progress/route';

function get() {
  return GET(new NextRequest('http://localhost/api/admin/bookings/progress'));
}

describe('GET /api/admin/bookings/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBookings.mockResolvedValue({ data: [] });
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
    expect(getBookings).not.toHaveBeenCalled();
  });

  it('répond 403 pour un non-admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', roles: [ROLES.CUSTOMER] },
    });
    expect((await get()).status).toBe(403);
    expect(getBookings).not.toHaveBeenCalled();
  });

  it('retourne les bookings triés avec progression', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', roles: [ROLES.ADMIN] },
    });
    getBookings.mockResolvedValue({
      data: [
        {
          id: 'b-old',
          reservationNumber: 'R1',
          requesterId: 'r1',
          status: 'PENDING',
          serviceType: 'HEALTH',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-02'),
          metadata: {
            isDraft: true,
            currentStep: 1,
            stepName: 'infos',
            lastUpdatedAt: '2026-01-02T10:00:00.000Z',
            clientEmail: 'a@x.fr',
            clientName: 'Ada',
            progressHistory: [{ step: 1 }],
          },
        },
        {
          id: 'b-new',
          reservationNumber: 'R2',
          requesterId: 'r2',
          status: 'PENDING',
          serviceType: 'BTP',
          createdAt: new Date('2026-01-03'),
          updatedAt: new Date('2026-01-04'),
          metadata: {
            isDraft: false,
            currentStep: 3,
            stepName: 'paiement',
            lastUpdatedAt: '2026-01-05T12:00:00.000Z',
            serviceLabel: 'Devis',
            servicePrice: 200,
          },
        },
      ],
    });

    const res = await get();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getBookings).toHaveBeenCalledWith({ limit: 1000, offset: 0 });
    expect(body.success).toBe(true);
    expect(body.total).toBe(2);
    expect(body.drafts).toBe(1);
    expect(body.bookings[0].id).toBe('b-new');
    expect(body.bookings[1]).toMatchObject({
      id: 'b-old',
      isDraft: true,
      currentStep: 1,
      clientEmail: 'a@x.fr',
    });
  });
});
