export const INVOICE_STATUSES = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export type InvoiceStatus =
  (typeof INVOICE_STATUSES)[keyof typeof INVOICE_STATUSES];

const ALLOWED: Record<InvoiceStatus, ReadonlyArray<InvoiceStatus>> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['PAID', 'OVERDUE', 'CANCELLED'],
  OVERDUE: ['PAID', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
};

export function canTransitionInvoiceStatus(
  from: InvoiceStatus,
  to: InvoiceStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED[from]?.includes(to) ?? false;
}
