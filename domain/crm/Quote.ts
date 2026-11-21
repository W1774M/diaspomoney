export const QUOTE_KINDS = {
  BTP: 'BTP',
  EDUCATION: 'EDUCATION',
} as const;

export type QuoteKind = (typeof QUOTE_KINDS)[keyof typeof QUOTE_KINDS];

export const QUOTE_STATUSES = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[keyof typeof QUOTE_STATUSES];

const ALLOWED: Record<QuoteStatus, ReadonlyArray<QuoteStatus>> = {
  PENDING: ['APPROVED', 'REJECTED', 'EXPIRED'],
  APPROVED: [],
  REJECTED: [],
  EXPIRED: [],
};

export class Quote {
  private constructor(
    readonly kind: QuoteKind,
    private status: QuoteStatus,
    readonly contactEmail: string,
    readonly clientId?: string,
  ) {}

  static create(input: {
    kind: string;
    contactEmail: string;
    clientId?: string;
  }): Quote {
    const kind = input.kind.toUpperCase() as QuoteKind;
    if (kind !== 'BTP' && kind !== 'EDUCATION') {
      throw new Error('Quote kind must be BTP or EDUCATION');
    }
    if (!input.contactEmail?.trim()) {
      throw new Error('Quote contactEmail is required');
    }
    return new Quote(
      kind,
      QUOTE_STATUSES.PENDING,
      input.contactEmail.trim().toLowerCase(),
      input.clientId,
    );
  }

  get currentStatus(): QuoteStatus {
    return this.status;
  }

  transitionTo(to: QuoteStatus): void {
    if (this.status === to) return;
    if (!ALLOWED[this.status].includes(to)) {
      throw new Error(
        `Invalid quote status transition: ${this.status} → ${to}`,
      );
    }
    this.status = to;
  }
}
