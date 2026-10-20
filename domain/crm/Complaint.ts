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
   * ACL persistence → domaine (open / in_progress → OPEN / IN_PROGRESS).
   */
  static mapPersistenceStatus(status: string): ComplaintStatus {
    const normalized = String(status || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_');

    if (normalized === 'INPROGRESS') return COMPLAINT_STATUSES.IN_PROGRESS;

    if (
      (Object.values(COMPLAINT_STATUSES) as string[]).includes(normalized)
    ) {
      return normalized as ComplaintStatus;
    }

    return COMPLAINT_STATUSES.OPEN;
  }

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

  /**
   * Rehydrate depuis la persistence (statuts lowercase tolérés).
   */
  static rehydrate(input: {
    clientId: string;
    bookingId: string;
    type: string;
    status: string;
  }): Complaint {
    if (!input.clientId?.trim()) {
      throw new Error('Complaint requires clientId');
    }
    if (!input.bookingId?.trim()) {
      throw new Error('Complaint requires bookingId (not appointmentId)');
    }
    return new Complaint(
      input.clientId.trim(),
      input.bookingId.trim(),
      Complaint.mapPersistenceStatus(input.status),
      (input.type || '').trim() || 'QUALITY',
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
