/**
 * GET/POST /api/messaging/support
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuth, getSupportTicket, sendSupportMessage } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  getSupportTicket: vi.fn(),
  sendSupportMessage: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/services/messaging/messaging.service', () => ({
  messagingService: { getSupportTicket, sendSupportMessage },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { GET, POST } from '@/app/api/messaging/support/route';

function get() {
  return GET(new NextRequest('http://localhost/api/messaging/support'));
}

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/messaging/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('/api/messaging/support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    getSupportTicket.mockResolvedValue({
      ticket: { id: 't1' },
      messages: [
        { id: 'm1', text: 'bonjour', senderId: 'user', timestamp: '2026-01-01', attachments: [] },
        { id: 'm2', text: 'aide', senderId: 'agent', timestamp: '2026-01-02', attachments: [] },
      ],
    });
    sendSupportMessage.mockResolvedValue({
      id: 'm3',
      text: 'suite',
      timestamp: '2026-01-03',
      attachments: [],
    });
  });

  it('GET répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
  });

  it('GET retourne le ticket et mappe les expéditeurs', async () => {
    const res = await get();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ticket.id).toBe('t1');
    expect(body.messages[0].sender).toBe('user');
    expect(body.messages[1].sender).toBe('support');
  });

  it('GET répond 500 si le service échoue', async () => {
    getSupportTicket.mockRejectedValueOnce(new Error('boom'));
    expect((await get()).status).toBe(500);
  });

  it('POST répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await post({ text: 'help' })).status).toBe(401);
  });

  it('POST envoie un message support', async () => {
    const res = await post({ text: 'besoin d’aide' });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message.text).toBe('suite');
    expect(sendSupportMessage).toHaveBeenCalledWith('user-1', 'besoin d’aide', undefined);
  });

  it('POST répond 400 sans texte ni pièces jointes', async () => {
    expect((await post({})).status).toBe(400);
  });
});
