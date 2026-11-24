/**
 * DELETE /api/bookings/[id]/delete
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const { mockAuth, deleteBookingCompletely } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  deleteBookingCompletely: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/booking/booking.service', () => ({
  bookingService: { deleteBookingCompletely },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { DELETE } from '@/app/api/bookings/[id]/delete/route';

const BOOKING_ID = '507f1f77bcf86cd799439011';

function del(
  id = BOOKING_ID,
  params: { id: string } | Promise<{ id: string }> = Promise.resolve({ id }),
) {
  return DELETE(
    new NextRequest(`http://localhost/api/bookings/${id}/delete`, { method: 'DELETE' }),
    { params },
  );
}

describe('DELETE /api/bookings/[id]/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin', roles: [ROLES.SUPERADMIN] } });
    deleteBookingCompletely.mockResolvedValue({ deleted: { booking: true, invoice: true } });
  });

  it('refuse un anonyme, un non-admin, un id invalide ou des paramètres illisibles', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await del()).status).toBe(401);

    mockAuth.mockResolvedValue({ user: { id: 'u', roles: [ROLES.CUSTOMER] } });
    expect((await del()).status).toBe(403);

    mockAuth.mockResolvedValue({ user: { id: 'admin', roles: [ROLES.ADMIN] } });
    expect((await del('bad')).status).toBe(400);

    const broken = await del(BOOKING_ID, Promise.reject(new Error('params')));
    expect(broken.status).toBe(400);
  });

  it('supprime la réservation et ses pièces liées', async () => {
    const res = await del();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.deleted.booking).toBe(true);
    expect(deleteBookingCompletely).toHaveBeenCalledWith(BOOKING_ID);
  });

  it('répond 404 si elle n’existe plus, 500 sinon', async () => {
    deleteBookingCompletely.mockRejectedValueOnce(new Error('Réservation non trouvée'));
    expect((await del()).status).toBe(404);

    deleteBookingCompletely.mockRejectedValueOnce(new Error('stripe'));
    expect((await del()).status).toBe(500);

    deleteBookingCompletely.mockRejectedValueOnce('nope');
    expect((await del()).status).toBe(500);
  });
});
