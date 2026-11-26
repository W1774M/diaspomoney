/**
 * POST /api/education/inquiry
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

import { POST } from '@/app/api/education/inquiry/route';

const validBody = {
  studentType: 'SELF' as const,
  studentInfo: { firstName: 'Awa', lastName: 'Diallo' },
  contact: { name: 'Awa Diallo', email: 'awa@example.com', phone: '+221770000000' },
  academicInfo: { desiredProgram: 'Licence' },
  questions: 'Horaires ?',
};

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/education/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/education/inquiry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    createQuote.mockResolvedValue({
      success: true,
      quote: { id: 'inq-1' },
    });
  });

  it('crée une demande éducation pour un invité', async () => {
    const res = await post(validBody);
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.inquiryRequest.id).toBe('inq-1');
    expect(createQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        sector: 'EDUCATION',
        studentType: 'SELF',
        contact: expect.objectContaining({ email: 'awa@example.com' }),
      }),
    );
    expect(createQuote.mock.calls[0]![0]).not.toHaveProperty('clientId');
  });

  it('rattache clientId si connecté', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-9' } });
    await post(validBody);
    expect(createQuote).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'user-9', sector: 'EDUCATION' }),
    );
  });

  it('refuse sans studentInfo', async () => {
    expect(
      (
        await post({
          contact: { name: 'X', email: 'x@example.com' },
        })
      ).status,
    ).toBe(400);
  });

  it('propage une erreur facade', async () => {
    createQuote.mockResolvedValue({ success: false, error: 'CRM down' });
    expect((await post(validBody)).status).toBe(500);
  });
});
