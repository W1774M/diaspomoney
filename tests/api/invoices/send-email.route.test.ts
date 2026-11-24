/**
 * POST /api/invoices/[id]/send-email
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ID = 'inv-1';
const USER = 'user-1';

const {
  mockAuth,
  getInvoiceById,
  findById,
  generateInvoicePDF,
  sendEmail,
  getInstance,
} = vi.hoisted(() => {
  const generateInvoicePDF = vi.fn();
  return {
    mockAuth: vi.fn(),
    getInvoiceById: vi.fn(),
    findById: vi.fn(),
    generateInvoicePDF,
    sendEmail: vi.fn(),
    getInstance: vi.fn(() => ({ generateInvoicePDF })),
  };
});

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/invoice/invoice.service', () => ({
  invoiceService: { getInvoiceById },
}));
vi.mock('@/services/invoice/pdf-generator.service', () => ({
  PDFGeneratorService: { getInstance },
}));
vi.mock('@/repositories', () => ({
  getUserRepository: () => ({ findById }),
}));
vi.mock('@/lib/email/resend', () => ({ sendEmail }));

import { POST } from '@/app/api/invoices/[id]/send-email/route';

function post() {
  return POST(
    new NextRequest(`http://localhost/api/invoices/${ID}/send-email`, {
      method: 'POST',
    }),
    { params: { id: ID } },
  );
}

describe('POST /api/invoices/[id]/send-email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: USER, roles: ['CUSTOMER'] },
    });
    getInvoiceById.mockResolvedValue({
      id: ID,
      userId: USER,
      invoiceNumber: 'FAC-001',
      amount: 100,
      currency: 'EUR',
      status: 'paid',
      issueDate: new Date('2026-01-01'),
    });
    findById.mockResolvedValue({ id: USER, email: 'ada@test.fr', name: 'Ada' });
    generateInvoicePDF.mockResolvedValue(Buffer.from('%PDF'));
    sendEmail.mockResolvedValue(true);
    getInstance.mockReturnValue({ generateInvoicePDF });
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await post()).status).toBe(401);
  });

  it('répond 403 si ni propriétaire ni admin', async () => {
    getInvoiceById.mockResolvedValue({
      id: ID,
      userId: 'other',
      invoiceNumber: 'FAC-001',
    });
    expect((await post()).status).toBe(403);
  });

  it('répond 404 si email utilisateur manquant', async () => {
    findById.mockResolvedValue({ id: USER, email: null });
    expect((await post()).status).toBe(404);
  });

  it('envoie la facture par email', async () => {
    const res = await post();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'ada@test.fr' }),
    );
  });
});
