/**
 * GET/POST /api/email/test
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmationEmail,
  sendAppointmentNotificationEmail,
  sendCustomEmail,
  getQueueStats,
  testConnection,
  testEmailService,
} = vi.hoisted(() => ({
  sendWelcomeEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendPaymentConfirmationEmail: vi.fn(),
  sendAppointmentNotificationEmail: vi.fn(),
  sendCustomEmail: vi.fn(),
  getQueueStats: vi.fn(),
  testConnection: vi.fn(),
  testEmailService: vi.fn(),
}));

vi.mock('@/services/email/email.service', () => ({
  emailService: {
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendPaymentConfirmationEmail,
    sendAppointmentNotificationEmail,
    sendCustomEmail,
    getQueueStats,
    testConnection,
  },
  testEmailService,
}));

import { GET, POST } from '@/app/api/email/test/route';

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/email/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('/api/email/test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendWelcomeEmail.mockResolvedValue(true);
    sendPasswordResetEmail.mockResolvedValue(true);
    sendPaymentConfirmationEmail.mockResolvedValue(true);
    sendAppointmentNotificationEmail.mockResolvedValue(true);
    sendCustomEmail.mockResolvedValue(true);
    testEmailService.mockResolvedValue(true);
    getQueueStats.mockReturnValue({ waiting: 0 });
    testConnection.mockResolvedValue(true);
  });

  it('exige un email et un type connu', async () => {
    expect((await post({ type: 'welcome' })).status).toBe(400);
    expect((await post({ type: 'nope', email: 'a@b.c', data: {} })).status).toBe(400);
  });

  it('déclenche chaque type d’envoi', async () => {
    for (const type of ['welcome', 'password_reset', 'payment_confirmation', 'appointment_notification', 'custom', 'service_test']) {
      const res = await post({ type, email: 'a@b.c', data: { name: 'Awa' } });
      expect(res.status).toBe(200);
    }
    expect(sendWelcomeEmail).toHaveBeenCalled();
    expect(sendCustomEmail).toHaveBeenCalled();
    expect(testEmailService).toHaveBeenCalled();
  });

  it('utilise les valeurs de repli et signale un échec d’envoi', async () => {
    const res = await post({ type: 'payment_confirmation', email: 'a@b.c', data: {} });
    expect(res.status).toBe(200);
    expect(sendPaymentConfirmationEmail).toHaveBeenCalledWith('a@b.c', 'Test User', 100, 'EUR', 'Service Test');

    sendWelcomeEmail.mockResolvedValue(false);
    expect((await post({ type: 'welcome', email: 'a@b.c', data: {} })).status).toBe(500);
  });

  it('expose l’état du service et isole les erreurs', async () => {
    const ok = await GET();
    expect((await ok.json()).connection).toBe('connected');

    testConnection.mockResolvedValue(false);
    expect((await (await GET()).json()).connection).toBe('disconnected');

    testConnection.mockRejectedValue(new Error('smtp'));
    expect((await GET()).status).toBe(500);

    expect((await post({ type: 'welcome' })).status).toBe(400);
    const broken = POST(
      new NextRequest('http://localhost/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      }),
    );
    expect((await broken).status).toBe(500);
  });
});
