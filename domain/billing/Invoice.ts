import { Money } from '@/domain/payment';
import { InvoiceLine } from './InvoiceLine';
import {
  INVOICE_STATUSES,
  canTransitionInvoiceStatus,
  type InvoiceStatus,
} from './InvoiceStatus';

export interface InvoiceProps {
  invoiceNumber?: string;
  clientId: string;
  currency: string;
  lines: InvoiceLine[];
  tax: number;
  status: InvoiceStatus;
  dueDate: Date;
  paymentDate?: Date;
  notes?: string;
}

export class Invoice {
  private props: InvoiceProps;

  private constructor(props: InvoiceProps) {
    this.props = props;
  }

  /**
   * ACL persistence → domaine (PENDING app ≈ SENT).
   */
  static rehydrate(raw: {
    clientId: string;
    currency?: string;
    items?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
    tax?: number;
    status: string;
    dueDate: Date;
    notes?: string;
  }): Invoice {
    const currency = (raw.currency || 'EUR').toUpperCase();
    const items = raw.items?.length
      ? raw.items
      : [{ description: 'Line', quantity: 1, unitPrice: 0 }];
    const lines = items.map((item) => InvoiceLine.of({ ...item, currency }));
    return new Invoice({
      clientId: raw.clientId,
      currency,
      lines,
      tax: raw.tax ?? 0,
      status: Invoice.mapPersistenceStatus(raw.status),
      dueDate: raw.dueDate,
      ...(raw.notes !== undefined ? { notes: raw.notes } : {}),
    });
  }

  static mapPersistenceStatus(status: string): InvoiceStatus {
    const upper = String(status || '').toUpperCase();
    if (upper === 'PENDING') return INVOICE_STATUSES.SENT;
    if (
      (Object.values(INVOICE_STATUSES) as string[]).includes(upper)
    ) {
      return upper as InvoiceStatus;
    }
    return INVOICE_STATUSES.DRAFT;
  }

  /** Domaine → valeur stockée (SENT → PENDING pour compat app) */
  toPersistenceStatus(): string {
    if (this.props.status === INVOICE_STATUSES.SENT) return 'PENDING';
    return this.props.status;
  }

  applyTargetStatus(target: string, paymentDate?: Date): void {
    const mapped = Invoice.mapPersistenceStatus(target);
    if (mapped === this.props.status) return;
    if (mapped === INVOICE_STATUSES.SENT) {
      this.send();
      return;
    }
    if (mapped === INVOICE_STATUSES.PAID) {
      this.markPaid(paymentDate);
      return;
    }
    if (mapped === INVOICE_STATUSES.CANCELLED) {
      this.cancel();
      return;
    }
    if (mapped === INVOICE_STATUSES.OVERDUE) {
      this.markOverdueIfNeeded(new Date(this.props.dueDate.getTime() + 1));
      if (this.props.status !== INVOICE_STATUSES.OVERDUE) {
        this.transition(INVOICE_STATUSES.OVERDUE);
      }
      return;
    }
    this.transition(mapped);
  }

  static draft(input: {
    clientId: string;
    currency?: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
    tax?: number;
    dueDate?: Date;
    notes?: string;
  }): Invoice {
    if (!input.clientId?.trim()) {
      throw new Error('Invoice clientId is required');
    }
    const currency = (input.currency || 'EUR').toUpperCase();
    const lines = input.items.map((item) =>
      InvoiceLine.of({ ...item, currency }),
    );
    if (!lines.length) {
      throw new Error('Invoice requires at least one line');
    }
    const tax = input.tax ?? 0;
    if (tax < 0) {
      throw new Error('Invoice tax must be >= 0');
    }

    return new Invoice({
      clientId: input.clientId.trim(),
      currency,
      lines,
      tax,
      status: INVOICE_STATUSES.DRAFT,
      dueDate: input.dueDate || Invoice.defaultDueDate(),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });
  }

  static defaultDueDate(days = 30): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }

  get status(): InvoiceStatus {
    return this.props.status;
  }

  get subtotal(): Money {
    const sum = this.props.lines.reduce((acc, line) => acc + line.total.amount, 0);
    return Money.of(Math.round(sum * 100) / 100, this.props.currency);
  }

  get totalAmount(): Money {
    return Money.of(
      Math.round((this.subtotal.amount + this.props.tax) * 100) / 100,
      this.props.currency,
    );
  }

  send(): void {
    this.transition(INVOICE_STATUSES.SENT);
  }

  markPaid(paymentDate = new Date()): void {
    this.transition(INVOICE_STATUSES.PAID);
    this.props.paymentDate = paymentDate;
  }

  cancel(): void {
    if (this.props.status === INVOICE_STATUSES.PAID) {
      throw new Error('Cannot cancel a PAID invoice');
    }
    this.transition(INVOICE_STATUSES.CANCELLED);
  }

  markOverdueIfNeeded(now = new Date()): void {
    if (
      (this.props.status === INVOICE_STATUSES.SENT ||
        this.props.status === INVOICE_STATUSES.OVERDUE) &&
      this.props.dueDate < now &&
      this.props.status !== INVOICE_STATUSES.PAID
    ) {
      if (canTransitionInvoiceStatus(this.props.status, INVOICE_STATUSES.OVERDUE)) {
        this.props.status = INVOICE_STATUSES.OVERDUE;
      }
    }
  }

  private transition(to: InvoiceStatus): void {
    if (!canTransitionInvoiceStatus(this.props.status, to)) {
      throw new Error(
        `Invalid invoice status transition: ${this.props.status} → ${to}`,
      );
    }
    this.props.status = to;
  }

  toCreatePayload(): {
    userId: string;
    amount: number;
    currency: string;
    tax: number;
    totalAmount: number;
    status: InvoiceStatus;
    dueDate: Date;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    notes?: string;
  } {
    return {
      userId: this.props.clientId,
      amount: this.subtotal.amount,
      currency: this.props.currency,
      tax: this.props.tax,
      totalAmount: this.totalAmount.amount,
      status: this.props.status,
      dueDate: this.props.dueDate,
      items: this.props.lines.map((l) => l.toPlain()),
      ...(this.props.notes !== undefined ? { notes: this.props.notes } : {}),
    };
  }
}
