/**
 * POST /api/services/book
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuth, execute } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  execute: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/facades', () => ({
  serviceBookingFacade: { execute },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { POST } from '@/app/api/services/book/route';

const validBody = {
  serviceType: 'HEALTH',
  clientInfo: {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '+336',
  },
  beneficiaryInfo: {
    firstName: 'Ben',
    lastName: 'Efi',
    phone: '+221',
    relationship: 'OTHER',
    location: { address: '1 rue', city: 'Dakar', country: 'SN' },
  },
  selectedService: {
    serviceId: 'svc-1',
    category: 'Consultation',
    label: 'Consultation',
    description: 'desc',
    price: 50,
    options: [],
  },
  paymentIntentId: 'pi_test',
};

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/services/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/services/book', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    execute.mockResolvedValue({
      success: true,
      bookingId: 'b1',
      reservationNumber: 'RES-1',
    });
  });

  it('refuse un payload incomplet', async () => {
    expect((await post({ serviceType: 'HEALTH' })).status).toBe(500);
    expect(execute).not.toHaveBeenCalled();
  });

  it('crée une réservation guest sans userId metadata', async () => {
    const res = await post(validBody);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.bookingId).toBe('b1');
    expect(execute).toHaveBeenCalledWith(
      expect.not.objectContaining({
        metadata: expect.objectContaining({ userId: expect.anything() }),
      }),
    );
  });

  it('ajoute userId en metadata si connecté', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-42' } });
    await post(validBody);
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ userId: 'user-42' }),
      }),
    );
  });

  it('propage l’échec facade', async () => {
    execute.mockResolvedValue({ success: false, error: 'paiement invalide' });
    expect((await post(validBody)).status).toBe(500);
  });
});
