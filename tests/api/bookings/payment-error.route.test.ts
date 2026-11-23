/**
 * POST /api/bookings/payment-error
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockAuth, mockSendCustomEmail } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockSendCustomEmail: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/email/email.service', () => ({
  emailService: { sendCustomEmail: mockSendCustomEmail },
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { POST } from '@/app/api/bookings/payment-error/route';

const validBody = {
  appointment: {
    id: 'appt_1',
    selectedService: { name: 'Consultation', price: 50 },
    provider: { id: 'prov_1', name: 'Clinique' },
    requester: {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    },
    timeslot: new Date(Date.now() + 86_400_000).toISOString(),
  },
  paymentData: { amount: 50, currency: 'EUR' },
  errorMessage: 'card_declined',
};

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/bookings/payment-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/bookings/payment-error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendCustomEmail.mockResolvedValue(true);
    process.env['EMAIL_CONTACT'] = 'contact@diaspomoney.fr';
    process.env['NEXT_PUBLIC_APP_URL'] = 'https://dev.diaspomoney.fr';
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
    expect(mockSendCustomEmail).not.toHaveBeenCalled();
  });

  it('répond 400 si le corps est invalide', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'u@example.com' } });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('envoie les emails d’erreur pour un utilisateur authentifié', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'u@example.com', id: 'u1' } });
    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockSendCustomEmail).toHaveBeenCalled();
    expect(mockSendCustomEmail.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
