export const COMPLAINT_STATUSES = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type ComplaintStatus =
  (typeof COMPLAINT_STATUSES)[keyof typeof COMPLAINT_STATUSES];

const ALLOWED: Record<ComplaintStatus, ReadonlyArray<ComplaintStatus>> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

export class Complaint {
  private constructor(
    readonly clientId: string,
    readonly bookingId: string,
    private status: ComplaintStatus,
    readonly type: string,
  ) {}

  /**
   * @param bookingId — canonique (remplace appointmentId)
   */
  static open(input: {
    clientId: string;
    bookingId: string;
    type: string;
  }): Complaint {
    if (!input.clientId?.trim()) {
      throw new Error('Complaint requires clientId');
    }
    if (!input.bookingId?.trim()) {
      throw new Error('Complaint requires bookingId (not appointmentId)');
    }
    if (!input.type?.trim()) {
      throw new Error('Complaint type is required');
    }
    return new Complaint(
      input.clientId.trim(),
      input.bookingId.trim(),
      COMPLAINT_STATUSES.OPEN,
      input.type.trim(),
    );
  }

  get currentStatus(): ComplaintStatus {
    return this.status;
  }

  transitionTo(to: ComplaintStatus): void {
    if (this.status === to) return;
    if (!ALLOWED[this.status].includes(to)) {
      throw new Error(
        `Invalid complaint status transition: ${this.status} → ${to}`,
      );
    }
    this.status = to;
  }
}
