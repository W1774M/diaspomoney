/**
 * GET /api/payment-receipts
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockAuth, mockFindInvoices, mockFindById } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindInvoices: vi.fn(),
  mockFindById: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/repositories', () => ({
  getInvoiceRepository: () => ({
    findInvoicesWithFilters: mockFindInvoices,
  }),
  getUserRepository: () => ({
    findById: mockFindById,
  }),
}));
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { GET } from '@/app/api/payment-receipts/route';

describe('GET /api/payment-receipts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(new NextRequest('http://localhost/api/payment-receipts'));
    expect(res.status).toBe(401);
  });

  it('retourne une liste vide de reçus', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user_1' } });
    mockFindInvoices.mockResolvedValue({
      data: [],
      total: 0,
      pagination: { page: 1, limit: 50, offset: 0, pages: 0, total: 0, hasNext: false, hasPrev: false },
    });

    const res = await GET(new NextRequest('http://localhost/api/payment-receipts'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.receipts || json.data || []).toEqual([]);
    expect(mockFindInvoices).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user_1', status: 'PAID' }),
      expect.any(Object),
    );
  });
});
