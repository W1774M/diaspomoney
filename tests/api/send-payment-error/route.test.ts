/**
 * POST /api/send-payment-error — validation et envoi (email mocké).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/config/env', () => ({
  config: {
    isDevelopment: true,
    smtp: { host: 'localhost', port: 1025, user: 'u', pass: 'p' },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'mock' }),
    }),
  },
}));

import { POST } from '@/app/api/send-payment-error/route';

const validBody = {
  appointment: {
    provider: {
      id: 'prov_1',
      name: 'Clinique',
      apiGeo: [{ display_name: 'Paris' }],
    },
    selectedService: { name: 'Consultation', price: 50 },
    requester: {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+33600000000',
    },
    recipient: { firstName: 'Bob', lastName: 'Martin', phone: '+33600000001' },
    timeslot: new Date(Date.now() + 86_400_000).toISOString(),
  },
  paymentData: { amount: 50, currency: 'EUR' },
  errorMessage: 'card_declined',
};

describe('POST /api/send-payment-error', () => {
  beforeEach(() => {
    process.env['NEXT_PUBLIC_APP_URL'] = 'https://dev.diaspomoney.fr';
    process.env['EMAIL_CONTACT'] = 'contact@diaspomoney.fr';
  });

  it('répond 400 si appointment ou paymentData manquent', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/send-payment-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('envoie les emails et ne renvoie plus le secret retryToken', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/send-payment-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.retryToken).toBeUndefined();
    expect(json.retryUrl).toBeUndefined();
  });
});
