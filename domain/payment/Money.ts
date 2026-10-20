/**
 * Value Object — montant + devise (unité majeure, ex. euros).
 * Couche domaine pure : pas de Stripe / Mongoose.
 */

export class Money {
  readonly amount: number;
  readonly currency: string;

  private constructor(amount: number, currency: string) {
    this.amount = amount;
    this.currency = currency;
  }

  static of(amount: number, currency: string): Money {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('Money amount must be a non-negative finite number');
    }
    const normalized = currency.trim().toUpperCase();
    if (normalized.length !== 3) {
      throw new Error('Money currency must be a 3-letter ISO code');
    }
    return new Money(amount, normalized);
  }

  /** Montant en unité mineure (centimes) pour comparaison Stripe */
  toMinorUnits(): number {
    return Math.round(this.amount * 100);
  }

  equals(other: Money): boolean {
    return (
      this.toMinorUnits() === other.toMinorUnits() &&
      this.currency === other.currency
    );
  }

  matchesMinorUnits(minorUnits: number, currency: string): boolean {
    return (
      this.toMinorUnits() === minorUnits &&
      this.currency === currency.trim().toUpperCase()
    );
  }
}
