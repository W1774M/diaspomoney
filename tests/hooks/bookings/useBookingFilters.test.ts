/**
 * Tests unitaires pour useBookingFilters
 * 
 * Implémente les tests pour :
 * - Filtrage côté client des réservations
 * - Combinaison de filtres
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBookingFilters } from '@/hooks/bookings/useBookingFilters';

describe('useBookingFilters', () => {
  const mockBookings = [
    {
      id: 'b1',
      _id: 'b1',
      reservationNumber: 'RES-001',
      requesterId: 'user1',
      providerId: 'provider1',
      serviceId: 'service1',
      serviceType: 'HEALTH' as const,
      status: 'CONFIRMED',
      recipient: { firstName: 'John', lastName: 'Doe' },
      appointmentDate: '2024-01-15T10:00:00.000Z',
      createdAt: '2024-01-10T00:00:00.000Z',
      updatedAt: '2024-01-10T00:00:00.000Z',
      metadata: { paymentStatus: 'PAID' },
    },
    {
      id: 'b2',
      _id: 'b2',
      reservationNumber: 'RES-002',
      requesterId: 'user2',
      providerId: 'provider2',
      serviceId: 'service2',
      serviceType: 'HEALTH' as const,
      status: 'PENDING',
      recipient: { firstName: 'Jane', lastName: 'Smith' },
      appointmentDate: '2024-01-20T14:00:00.000Z',
      createdAt: '2024-01-12T00:00:00.000Z',
      updatedAt: '2024-01-12T00:00:00.000Z',
      metadata: { paymentStatus: 'PENDING' },
    },
    {
      id: 'b3',
      _id: 'b3',
      reservationNumber: 'RES-003',
      requesterId: 'user3',
      providerId: 'provider3',
      serviceId: 'service3',
      serviceType: 'HEALTH' as const,
      status: 'CONFIRMED',
      recipient: { firstName: 'Bob', lastName: 'Johnson' },
      appointmentDate: '2024-02-01T09:00:00.000Z',
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
      metadata: { paymentStatus: 'PAID' },
    },
  ] as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait filtrer par searchTerm (reservationNumber)', () => {
    const { result } = renderHook(() => useBookingFilters(mockBookings));

    act(() => {
      result.current.updateFilter('searchTerm', 'RES-001');
    });

    expect(result.current.filteredBookings).toHaveLength(1);
    expect(result.current.filteredBookings?.[0]?.reservationNumber).toBe('RES-001');
  });

  it('devrait filtrer par searchTerm (recipient)', () => {
    const { result } = renderHook(() => useBookingFilters(mockBookings));

    act(() => {
      result.current.updateFilter('searchTerm', 'John Doe');
    });

    expect(result.current.filteredBookings).toHaveLength(1);
    expect(result.current.filteredBookings?.[0]?.recipient?.firstName).toBe('John');
  });

  it('devrait filtrer par searchTerm (serviceId)', () => {
    const { result } = renderHook(() => useBookingFilters(mockBookings));

    act(() => {
      result.current.updateFilter('searchTerm', 'service2');
    });

    expect(result.current.filteredBookings).toHaveLength(1);
    expect(result.current.filteredBookings?.[0]?.serviceId).toBe('service2');
  });

  it('devrait filtrer par status', () => {
    const { result } = renderHook(() => useBookingFilters(mockBookings));

    act(() => {
      result.current.updateFilter('status', 'CONFIRMED');
    });

    expect(result.current.filteredBookings).toHaveLength(2);
    expect(result.current.filteredBookings.every(b => b.status === 'CONFIRMED')).toBe(true);
  });

  it('devrait filtrer par paymentStatus', () => {
    const { result } = renderHook(() => useBookingFilters(mockBookings));

    act(() => {
      result.current.updateFilter('paymentStatus', 'PAID');
    });

    expect(result.current.filteredBookings).toHaveLength(2);
    expect(result.current.filteredBookings.every(b => b.metadata?.['paymentStatus'] === 'PAID')).toBe(true);
  });

  it('devrait filtrer par date (dateRange)', () => {
    const { result } = renderHook(() => useBookingFilters(mockBookings));

    act(() => {
      result.current.updateFilter('dateRange', {
        start: '2024-01-15',
        end: '2024-01-25',
      });
    });

    expect(result.current.filteredBookings.length).toBeGreaterThan(0);
  });

  it('devrait combiner plusieurs filtres', () => {
    const { result } = renderHook(() => useBookingFilters(mockBookings));

    act(() => {
      result.current.updateFilter('status', 'CONFIRMED');
      result.current.updateFilter('paymentStatus', 'PAID');
    });

    expect(result.current.filteredBookings).toHaveLength(2);
    expect(result.current.filteredBookings.every(b => b.status === 'CONFIRMED')).toBe(true);
    expect(result.current.filteredBookings.every(b => b.metadata?.['paymentStatus'] === 'PAID')).toBe(true);
  });

  it('devrait mettre à jour un filtre avec updateFilter', () => {
    const { result } = renderHook(() => useBookingFilters(mockBookings));

    act(() => {
      result.current.updateFilter('searchTerm', 'test');
    });

    expect(result.current.filters.searchTerm).toBe('test');
  });

  it('devrait réinitialiser tous les filtres avec clearFilters', () => {
    const { result } = renderHook(() => useBookingFilters(mockBookings));

    act(() => {
      result.current.updateFilter('searchTerm', 'test');
      result.current.updateFilter('status', 'CONFIRMED');
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters.searchTerm).toBe('');
    expect(result.current.filters.status).toBe('ALL');
    expect(result.current.filters.paymentStatus).toBe('ALL');
    expect(result.current.filteredBookings).toHaveLength(3);
  });

  it('devrait détecter les filtres actifs (hasActiveFilters)', () => {
    const { result } = renderHook(() => useBookingFilters(mockBookings));

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.updateFilter('searchTerm', 'test');
    });

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.clearFilters();
      result.current.updateFilter('status', 'CONFIRMED');
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('devrait gérer bookings null/undefined', () => {
    const { result: resultNull } = renderHook(() => useBookingFilters(null as any));
    expect(resultNull.current.filteredBookings).toHaveLength(0);

    const { result: resultUndefined } = renderHook(() => useBookingFilters(undefined as any));
    expect(resultUndefined.current.filteredBookings).toHaveLength(0);
  });

  it('devrait extraire les statuts disponibles', () => {
    const { result } = renderHook(() => useBookingFilters(mockBookings));

    expect(result.current.availableStatuses).toContain('CONFIRMED');
    expect(result.current.availableStatuses).toContain('PENDING');
  });

  it('devrait extraire les statuts de paiement disponibles', () => {
    const { result } = renderHook(() => useBookingFilters(mockBookings));

    expect(result.current.availablePaymentStatuses).toContain('PAID');
    expect(result.current.availablePaymentStatuses).toContain('PENDING');
  });
});

