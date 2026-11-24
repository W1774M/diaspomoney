/**
 * POST /api/auth/resend-verification
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findOne, sendWelcomeEmail, recordMetric, getPublicBaseUrl } = vi.hoisted(() => ({
  findOne: vi.fn(),
  sendWelcomeEmail: vi.fn(),
  recordMetric: vi.fn(),
  getPublicBaseUrl: vi.fn(() => 'https://app.test'),
}));

vi.mock('@/lib/mongodb', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/models/User', () => ({ default: { findOne } }));
vi.mock('@/lib/email/resend', () => ({ sendWelcomeEmail }));
vi.mock('@/lib/api/public-url', () => ({ getPublicBaseUrl }));
vi.mock('@/lib/monitoring/advanced-monitoring', () => ({
  monitoringManager: { recordMetric },
}));
vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn(() => 'jwt-token') },
}));

import { POST } from '@/app/api/auth/resend-verification/route';

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/auth/resend-verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('JWT_SECRET', 'test-secret');
    sendWelcomeEmail.mockResolvedValue(true);
    getPublicBaseUrl.mockReturnValue('https://app.test');
  });

  it('répond 400 sans email', async () => {
    expect((await post({})).status).toBe(400);
  });

  it('répond génériquement si le compte est inconnu (anti-énumération)', async () => {
    findOne.mockResolvedValue(null);
    const res = await post({ email: 'inconnu@test.fr' });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('répond succès si déjà vérifié, sans renvoyer d’email', async () => {
    findOne.mockResolvedValue({
      email: 'ada@test.fr',
      isEmailVerified: true,
      firstName: 'Ada',
      lastName: 'L',
    });
    const res = await post({ email: 'Ada@test.fr' });
    expect(res.status).toBe(200);
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('renvoie l’email de vérification', async () => {
    findOne.mockResolvedValue({
      _id: { toString: () => 'u1' },
      email: 'ada@test.fr',
      isEmailVerified: false,
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    const res = await post({ email: 'ada@test.fr' });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sendWelcomeEmail).toHaveBeenCalledWith(
      'ada@test.fr',
      'Ada Lovelace',
      'https://app.test/verify-email?token=jwt-token',
    );
    expect(recordMetric).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'auth_verification_emails_sent' }),
    );
  });

  it('répond 500 si l’envoi échoue', async () => {
    findOne.mockResolvedValue({
      _id: { toString: () => 'u1' },
      email: 'ada@test.fr',
      isEmailVerified: false,
      firstName: 'Ada',
      lastName: 'L',
    });
    sendWelcomeEmail.mockResolvedValue(false);
    expect((await post({ email: 'ada@test.fr' })).status).toBe(500);
  });
});
