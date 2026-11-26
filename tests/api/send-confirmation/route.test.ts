/**
 * POST /api/send-confirmation — validation et envoi (email mocké).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockSendEmail } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
}));

vi.mock('@/lib/email/resend', () => ({
  sendEmail: mockSendEmail,
}));

import { POST } from '@/app/api/send-confirmation/route';

const validBody = {
  appointment: {
    selectedService: { name: 'Consultation', price: 50 },
    provider: {
      name: 'Clinique',
      apiGeo: [{ display_name: 'Paris' }],
    },
    requester: {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+33600000000',
    },
    recipient: {
      firstName: 'Bob',
      lastName: 'Martin',
      phone: '+33600000001',
    },
    timeslot: new Date(Date.now() + 86_400_000).toISOString(),
  },
  paymentData: {
    cardholderName: 'Ada Lovelace',
  },
};

describe('POST /api/send-confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue(true);
    process.env['EMAIL_CONTACT'] = 'contact@diaspomoney.fr';
  });

  it('répond 400 si appointment ou paymentData manquent', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment: {} }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('envoie la confirmation au contact et au client', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.reservationNumber).toMatch(/^RES-/);
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
  });
});
