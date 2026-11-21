/**
 * Statuts métier Booking + mapping anti-corruption vers persistence Mongoose.
 */

export const DOMAIN_BOOKING_STATUSES = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED',
} as const;

export type DomainBookingStatus =
  (typeof DOMAIN_BOOKING_STATUSES)[keyof typeof DOMAIN_BOOKING_STATUSES];

/** Valeurs stockées dans models/Booking.ts */
export type PersistenceBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

const DOMAIN_TO_PERSISTENCE: Record<
  DomainBookingStatus,
  PersistenceBookingStatus
> = {
  DRAFT: 'pending',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FINISHED: 'completed',
  CANCELLED: 'cancelled',
};

const PERSISTENCE_TO_DOMAIN: Record<
  PersistenceBookingStatus,
  DomainBookingStatus
> = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  completed: 'FINISHED',
  cancelled: 'CANCELLED',
};

export function toPersistenceBookingStatus(
  status: DomainBookingStatus,
): PersistenceBookingStatus {
  return DOMAIN_TO_PERSISTENCE[status];
}

export function toDomainBookingStatus(
  status: string,
): DomainBookingStatus {
  const key = status.toLowerCase() as PersistenceBookingStatus;
  if (key in PERSISTENCE_TO_DOMAIN) {
    return PERSISTENCE_TO_DOMAIN[key];
  }
  const upper = status.toUpperCase() as DomainBookingStatus;
  if (Object.values(DOMAIN_BOOKING_STATUSES).includes(upper)) {
    return upper;
  }
  return DOMAIN_BOOKING_STATUSES.PENDING;
}

const ALLOWED_TRANSITIONS: Record<
  DomainBookingStatus,
  ReadonlyArray<DomainBookingStatus>
> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['FINISHED', 'CANCELLED'],
  FINISHED: [],
  CANCELLED: [],
};

export function canTransitionBookingStatus(
  from: DomainBookingStatus,
  to: DomainBookingStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}
