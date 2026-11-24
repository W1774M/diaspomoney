/**
 * GET /api/invoices/[id]/download
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ID = 'inv-1';
const USER = 'user-1';

const { mockAuth, getInvoiceById, generateInvoicePDF } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  getInvoiceById: vi.fn(),
  generateInvoicePDF: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/invoice/invoice.service', () => ({
  invoiceService: { getInvoiceById },
}));
vi.mock('@/services/invoice/pdf-generator.service', () => ({
  pdfGeneratorService: { generateInvoicePDF },
}));

import { GET } from '@/app/api/invoices/[id]/download/route';

function get() {
  return GET(
    new NextRequest(`http://localhost/api/invoices/${ID}/download`),
    { params: { id: ID } },
  );
}

describe('GET /api/invoices/[id]/download', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: USER, roles: ['CUSTOMER'] },
    });
    getInvoiceById.mockResolvedValue({
      id: ID,
      userId: USER,
      invoiceNumber: 'FAC-001',
    });
    generateInvoicePDF.mockResolvedValue(Buffer.from('%PDF-1.4'));
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
  });

  it('répond 403 si ni propriétaire ni admin', async () => {
    getInvoiceById.mockResolvedValue({
      id: ID,
      userId: 'other',
      invoiceNumber: 'FAC-001',
    });
    expect((await get()).status).toBe(403);
  });

  it('sert le PDF pour le propriétaire', async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toMatch(/FAC-001/);
    expect(generateInvoicePDF).toHaveBeenCalled();
  });
});
