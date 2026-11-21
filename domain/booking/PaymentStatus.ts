/**
 * État du paiement rattaché à un Booking (langue ubiquitaire Phase 1).
 */

export const DOMAIN_PAYMENT_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
} as const;

export type DomainPaymentStatus =
  (typeof DOMAIN_PAYMENT_STATUSES)[keyof typeof DOMAIN_PAYMENT_STATUSES];

const ALLOWED: Record<
  DomainPaymentStatus,
  ReadonlyArray<DomainPaymentStatus>
> = {
  pending: ['processing', 'confirmed', 'failed'],
  processing: ['confirmed', 'failed'],
  confirmed: [],
  failed: ['pending', 'processing', 'confirmed'],
};

export function canTransitionPaymentStatus(
  from: DomainPaymentStatus,
  to: DomainPaymentStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED[from].includes(to);
}
