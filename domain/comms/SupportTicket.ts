export const SUPPORT_TICKET_STATUSES = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type SupportTicketStatus =
  (typeof SUPPORT_TICKET_STATUSES)[keyof typeof SUPPORT_TICKET_STATUSES];

/**
 * Ticket support technique — distinct de Complaint (CRM prestation).
 */
export class SupportTicket {
  private constructor(
    readonly clientId: string,
    private status: SupportTicketStatus,
    readonly subject: string,
  ) {}

  static open(input: { clientId: string; subject: string }): SupportTicket {
    if (!input.clientId?.trim()) {
      throw new Error('SupportTicket requires clientId');
    }
    if (!input.subject?.trim()) {
      throw new Error('SupportTicket requires subject');
    }
    return new SupportTicket(
      input.clientId.trim(),
      SUPPORT_TICKET_STATUSES.OPEN,
      input.subject.trim(),
    );
  }

  get currentStatus(): SupportTicketStatus {
    return this.status;
  }

  startProgress(): void {
    if (this.status !== SUPPORT_TICKET_STATUSES.OPEN) {
      throw new Error('Only OPEN tickets can start progress');
    }
    this.status = SUPPORT_TICKET_STATUSES.IN_PROGRESS;
  }

  resolve(): void {
    if (
      this.status !== SUPPORT_TICKET_STATUSES.OPEN &&
      this.status !== SUPPORT_TICKET_STATUSES.IN_PROGRESS
    ) {
      throw new Error('Cannot resolve ticket in current status');
    }
    this.status = SUPPORT_TICKET_STATUSES.RESOLVED;
  }

  close(): void {
    this.status = SUPPORT_TICKET_STATUSES.CLOSED;
  }
}
