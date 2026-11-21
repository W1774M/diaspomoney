import { Money } from '@/domain/payment';

export class InvoiceLine {
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly total: Money;

  private constructor(
    description: string,
    quantity: number,
    unitPrice: Money,
    total: Money,
  ) {
    this.description = description;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.total = total;
  }

  static of(input: {
    description: string;
    quantity: number;
    unitPrice: number;
    currency?: string;
  }): InvoiceLine {
    if (!input.description?.trim()) {
      throw new Error('InvoiceLine description is required');
    }
    if (!Number.isFinite(input.quantity) || input.quantity < 1) {
      throw new Error('InvoiceLine quantity must be >= 1');
    }
    if (input.unitPrice < 0) {
      throw new Error('InvoiceLine unitPrice must be >= 0');
    }
    const currency = input.currency || 'EUR';
    const unit = Money.of(input.unitPrice, currency);
    const total = Money.of(
      Math.round(input.quantity * input.unitPrice * 100) / 100,
      currency,
    );
    return new InvoiceLine(input.description.trim(), input.quantity, unit, total);
  }

  toPlain(): {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  } {
    return {
      description: this.description,
      quantity: this.quantity,
      unitPrice: this.unitPrice.amount,
      total: this.total.amount,
    };
  }
}
