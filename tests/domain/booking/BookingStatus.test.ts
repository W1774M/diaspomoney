import { describe, expect, it } from 'vitest';
import {
  canTransitionBookingStatus,
  toDomainBookingStatus,
  toPersistenceBookingStatus,
} from '@/domain/booking';

describe('BookingStatus mapping', () => {
  it('mappe domaine ↔ persistence', () => {
    expect(toPersistenceBookingStatus('FINISHED')).toBe('completed');
    expect(toDomainBookingStatus('completed')).toBe('FINISHED');
    expect(toDomainBookingStatus('CONFIRMED')).toBe('CONFIRMED');
    expect(toDomainBookingStatus('pending')).toBe('PENDING');
  });

  it('autorise PENDING → CONFIRMED', () => {
    expect(canTransitionBookingStatus('PENDING', 'CONFIRMED')).toBe(true);
  });

  it('refuse FINISHED → PENDING', () => {
    expect(canTransitionBookingStatus('FINISHED', 'PENDING')).toBe(false);
  });
});
