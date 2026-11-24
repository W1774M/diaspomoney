/**
 * DELETE /api/bookings/[id]/delete
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const ID = '507f1f77bcf86cd799439011';

const { mockAuth, deleteBookingCompletely } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  deleteBookingCompletely: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/booking/booking.service', () => ({
  bookingService: { deleteBookingCompletely },
}));

import { DELETE } from '@/app/api/bookings/[id]/delete/route';

function del(id = ID) {
  return DELETE(
    new NextRequest(`http://localhost/api/bookings/${id}/delete`, {
      method: 'DELETE',
    }),
    { params: { id } },
  );
}

describe('DELETE /api/bookings/[id]/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', roles: [ROLES.ADMIN] },
    });
    deleteBookingCompletely.mockResolvedValue({
      deleted: { booking: true, transaction: true },
    });
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await del()).status).toBe(401);
  });

  it('répond 403 si non admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', roles: [ROLES.CUSTOMER] },
    });
    expect((await del()).status).toBe(403);
  });

  it('répond 400 pour un id invalide', async () => {
    expect((await del('bad')).status).toBe(400);
  });

  it('supprime la réservation complètement', async () => {
    const res = await del();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(deleteBookingCompletely).toHaveBeenCalledWith(ID);
  });
});
