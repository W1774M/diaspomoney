/**
 * POST /api/bookings/[id]/validate-step
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const ID = '507f1f77bcf86cd799439011';

const { mockAuth, validateStep } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  validateStep: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/booking/booking.service', () => ({
  bookingService: { validateStep },
}));

import { POST } from '@/app/api/bookings/[id]/validate-step/route';

function post(body: unknown, id = ID) {
  return POST(
    new NextRequest(`http://localhost/api/bookings/${id}/validate-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: { id } },
  );
}

describe('POST /api/bookings/[id]/validate-step', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', roles: [ROLES.ADMIN] },
    });
    validateStep.mockResolvedValue({ id: ID, currentStep: 2 });
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await post({ step: 1 })).status).toBe(401);
  });

  it('répond 403 si non admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', roles: [ROLES.CUSTOMER] },
    });
    expect((await post({ step: 1 })).status).toBe(403);
  });

  it('répond 400 si body invalide', async () => {
    expect((await post({ step: 99 })).status).toBe(400);
  });

  it('valide l’étape pour un admin', async () => {
    const res = await post({ step: 2 });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(validateStep).toHaveBeenCalledWith(ID, 2, 'admin-1');
  });
});
