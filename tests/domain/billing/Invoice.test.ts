import { describe, expect, it } from 'vitest';
import { Invoice, INVOICE_STATUSES } from '@/domain/billing';

describe('Invoice', () => {
  it('draft recalcule les totaux de lignes', () => {
    const invoice = Invoice.draft({
      clientId: 'client-1',
      currency: 'EUR',
      items: [
        { description: 'A', quantity: 2, unitPrice: 10 },
        { description: 'B', quantity: 1, unitPrice: 5 },
      ],
      tax: 2,
    });

    expect(invoice.status).toBe(INVOICE_STATUSES.DRAFT);
    expect(invoice.subtotal.amount).toBe(25);
    expect(invoice.totalAmount.amount).toBe(27);
  });

  it('send puis markPaid', () => {
    const invoice = Invoice.draft({
      clientId: 'c1',
      items: [{ description: 'A', quantity: 1, unitPrice: 10 }],
    });
    invoice.send();
    invoice.markPaid();
    expect(invoice.status).toBe(INVOICE_STATUSES.PAID);
    expect(() => invoice.cancel()).toThrow(/PAID/);
  });
});
