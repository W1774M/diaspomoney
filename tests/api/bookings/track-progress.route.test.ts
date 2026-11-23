/**
 * POST /api/bookings/track-progress
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createBooking, updateBooking } = vi.hoisted(() => ({
  createBooking: vi.fn(),
  updateBooking: vi.fn(),
}));

vi.mock('@/services/booking/booking.service', () => ({
  bookingService: { createBooking, updateBooking },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { POST } from '@/app/api/bookings/track-progress/route';

const draftBooking = { id: 'draft-1', _id: 'draft-1' };

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/bookings/track-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

const baseBody = {
  step: 1,
  stepName: 'infos-client',
  serviceType: 'HEALTH' as const,
  clientInfo: {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '+33600000000',
  },
};

describe('POST /api/bookings/track-progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createBooking.mockResolvedValue(draftBooking);
    updateBooking.mockResolvedValue(draftBooking);
  });

  it('crée un brouillon sans bookingId', async () => {
    const res = await post(baseBody);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.bookingId).toBe('draft-1');
    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: 'admin-draft',
        serviceId: 'draft',
        serviceType: 'HEALTH',
        requesterId: expect.stringMatching(/^guest-ada-/),
        recipient: {
          firstName: 'Ada',
          lastName: 'Lovelace',
          phone: '+33600000000',
        },
        metadata: expect.objectContaining({
          isDraft: true,
          currentStep: 1,
          stepName: 'infos-client',
          clientEmail: 'ada@example.com',
          clientName: 'Ada Lovelace',
        }),
      }),
    );
  });

  it('met à jour un brouillon existant', async () => {
    const res = await post({
      ...baseBody,
      step: 2,
      stepName: 'service',
      bookingId: 'existing-draft',
      selectedService: { serviceId: 'svc-1', label: 'Consult', price: 50 },
      beneficiaryInfo: {
        firstName: 'Ben',
        lastName: 'Eficiaire',
        phone: '+221770000000',
      },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.bookingId).toBe('draft-1');
    expect(updateBooking).toHaveBeenCalledWith(
      'existing-draft',
      expect.objectContaining({
        metadata: expect.objectContaining({
          currentStep: 2,
          serviceLabel: 'Consult',
          beneficiaryName: 'Ben Eficiaire',
        }),
      }),
    );
    expect(createBooking).not.toHaveBeenCalled();
  });

  it('recrée un brouillon si la mise à jour échoue', async () => {
    updateBooking.mockRejectedValueOnce(new Error('not found'));

    const res = await post({
      ...baseBody,
      bookingId: 'stale-id',
      selectedService: { serviceId: 'svc-2', label: 'BTP', price: 100 },
    });

    expect(res.status).toBe(200);
    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceId: 'svc-2',
        providerId: 'admin-draft',
      }),
    );
  });

  it('accepte un email vide (prétraité en undefined)', async () => {
    const res = await post({
      step: 1,
      stepName: 'start',
      serviceType: 'BTP',
      clientInfo: { email: '' },
    });
    expect(res.status).toBe(200);
    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterId: expect.stringMatching(/^guest-\d+/),
      }),
    );
  });

  it('répond 400 si le corps est invalide', async () => {
    const res = await post({ step: 99, stepName: 'x', serviceType: 'HEALTH' });
    expect(res.status).toBe(400);
    expect(createBooking).not.toHaveBeenCalled();
  });
});
