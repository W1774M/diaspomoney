/**
 * POST /api/btp/quote
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuth, createQuote } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  createQuote: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/facades', () => ({
  quoteFacade: { createQuote },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { POST } from '@/app/api/btp/quote/route';

const validBody = {
  projectType: 'rénovation',
  area: 80,
  features: ['plomberie'],
  location: { city: 'Dakar', country: 'SN' },
  contact: { name: 'Awa Diallo', email: 'awa@example.com', phone: '+221770000000' },
  budget: 5000,
  urgency: 'MEDIUM' as const,
};

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/btp/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/btp/quote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    createQuote.mockResolvedValue({
      success: true,
      quote: { id: 'q-1', costEstimate: 4200 },
    });
  });

  it('crée un devis BTP pour un invité', async () => {
    const res = await post(validBody);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.quote.id).toBe('q-1');
    expect(createQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        sector: 'BTP',
        projectType: 'rénovation',
        area: 80,
        location: { city: 'Dakar', country: 'SN' },
        contact: expect.objectContaining({ email: 'awa@example.com' }),
        budget: 5000,
        urgency: 'MEDIUM',
      }),
    );
    expect(createQuote.mock.calls[0]![0]).not.toHaveProperty('clientId');
  });

  it('rattache le clientId et providerId pour un utilisateur connecté', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-42' } });
    const res = await post(validBody);
    expect(res.status).toBe(201);
    expect(createQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'user-42',
        providerId: 'user-42',
      }),
    );
  });

  it('répond 400 si le corps est invalide', async () => {
    const res = await post({ contact: { name: 'x', email: 'bad' } });
    expect(res.status).toBe(400);
    expect(createQuote).not.toHaveBeenCalled();
  });

  it('remonte l’échec facade', async () => {
    createQuote.mockResolvedValue({ success: false, error: 'CRM down' });
    const res = await post(validBody);
    expect(res.status).toBe(500);
  });
});
