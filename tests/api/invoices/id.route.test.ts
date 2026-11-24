/**
 * PUT /api/invoices/[id] — auth admin, ObjectId, 404
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const INV_ID = '507f1f77bcf86cd799439011';

const { mockAuth, getInvoiceById, updateInvoice, findById, findByIdAndUpdate, lean } =
  vi.hoisted(() => {
    const lean = vi.fn();
    const findById = vi.fn(() => ({ lean }));
    return {
      mockAuth: vi.fn(),
      getInvoiceById: vi.fn(),
      updateInvoice: vi.fn(),
      findById,
      findByIdAndUpdate: vi.fn(),
      lean,
    };
  });

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/invoice/invoice.service', () => ({
  invoiceService: { getInvoiceById, updateInvoice },
}));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/models/Invoice', () => ({
  default: { findById, findByIdAndUpdate },
}));
vi.mock('@/lib/cache/redis', () => ({ invalidateAppCache: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { PUT } from '@/app/api/invoices/[id]/route';

function put(body: unknown, id = INV_ID) {
  return PUT(
    new NextRequest(`http://localhost/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: { id } },
  );
}

describe('PUT /api/invoices/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', roles: [ROLES.ADMIN] },
    });
    updateInvoice.mockResolvedValue({ id: INV_ID, amount: 60 });
    getInvoiceById.mockResolvedValue({
      id: INV_ID,
      userId: 'user-1',
      invoiceNumber: 'INV-1',
      amount: 60,
      currency: 'EUR',
      status: 'DRAFT',
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    lean.mockResolvedValue({ providerId: 'prov-1', notes: 'ok' });
  });

  it('refuse sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await put({ amount: 60 })).status).toBe(401);
  });

  it('refuse non-admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', roles: [ROLES.CUSTOMER] },
    });
    expect((await put({ amount: 60 })).status).toBe(403);
  });

  it('refuse un ObjectId invalide', async () => {
    expect((await put({ amount: 60 }, 'bad-id')).status).toBe(400);
  });

  it('met à jour une facture admin', async () => {
    const res = await put({ amount: 60, notes: 'ok' });
    expect(res.status).toBe(200);
    expect(updateInvoice).toHaveBeenCalledWith(
      INV_ID,
      expect.objectContaining({ amount: 60 }),
    );
  });

  it('répond 404 si facture absente', async () => {
    updateInvoice.mockRejectedValue(new Error('Facture non trouvée'));
    expect((await put({ amount: 10 })).status).toBe(404);
  });
});
