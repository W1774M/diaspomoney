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
