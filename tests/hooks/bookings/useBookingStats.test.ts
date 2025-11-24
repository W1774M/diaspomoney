/**
 * Tests unitaires pour useBookingStats
 * 
 * Implémente les tests pour :
 * - Statistiques des réservations
 * - Calculs de revenus
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBookingStats } from '@/hooks/bookings/useBookingStats';

describe('useBookingStats', () => {
  const mockBookings = [
    {
      _id: 'b1',
      userId: 'user1',
      providerId: 'provider1',
      date: new Date('2024-01-15'),
      status: 'confirmed',
      paymentStatus: 'paid',
      reservationNumber: 'RES-001',
      price: 100,
      totalAmount: 100,
      requester: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+33123456789' },
      recipient: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+33123456789' },
      provider: { id: 'p1', firstName: 'Dr', lastName: 'Smith', email: 'dr@example.com', phone: '+33987654321', specialties: [] },
      selectedService: { id: 's1', name: 'Service 1', description: 'Description', price: 100 },
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
    },
    {
      _id: 'b2',
      userId: 'user2',
      providerId: 'provider2',
      date: new Date('2024-01-20'),
      status: 'pending',
      paymentStatus: 'pending',
      reservationNumber: 'RES-002',
      price: 200,
      totalAmount: 200,
      requester: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '+33123456790' },
      recipient: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '+33123456790' },
      provider: { id: 'p2', firstName: 'Dr', lastName: 'Jones', email: 'dr2@example.com', phone: '+33987654322', specialties: [] },
      selectedService: { id: 's2', name: 'Service 2', description: 'Description', price: 200 },
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-12'),
    },
    {
      _id: 'b3',
      userId: 'user3',
      providerId: 'provider3',
      date: new Date('2024-02-01'),
      status: 'confirmed',
      paymentStatus: 'paid',
      reservationNumber: 'RES-003',
      price: 150,
      totalAmount: 150,
      requester: { firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', phone: '+33123456791' },
      recipient: { firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', phone: '+33123456791' },
      provider: { id: 'p3', firstName: 'Dr', lastName: 'Brown', email: 'dr3@example.com', phone: '+33987654323', specialties: [] },
      selectedService: { id: 's3', name: 'Service 3', description: 'Description', price: 150 },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      _id: 'b4',
      userId: 'user4',
      providerId: 'provider4',
      date: new Date('2024-02-10'),
      status: 'cancelled',
      paymentStatus: 'refunded',
      reservationNumber: 'RES-004',
      price: 300,
      totalAmount: 300,
      requester: { firstName: 'Alice', lastName: 'Williams', email: 'alice@example.com', phone: '+33123456792' },
      recipient: { firstName: 'Alice', lastName: 'Williams', email: 'alice@example.com', phone: '+33123456792' },
      provider: { id: 'p4', firstName: 'Dr', lastName: 'Davis', email: 'dr4@example.com', phone: '+33987654324', specialties: [] },
      selectedService: { id: 's4', name: 'Service 4', description: 'Description', price: 300 },
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      _id: 'b5',
      userId: 'user5',
      providerId: 'provider5',
      date: new Date('2024-02-15'),
      status: 'completed',
      paymentStatus: 'paid',
      reservationNumber: 'RES-005',
      price: 250,
      totalAmount: 250,
      requester: { firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com', phone: '+33123456793' },
      recipient: { firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com', phone: '+33123456793' },
      provider: { id: 'p5', firstName: 'Dr', lastName: 'Wilson', email: 'dr5@example.com', phone: '+33987654325', specialties: [] },
      selectedService: { id: 's5', name: 'Service 5', description: 'Description', price: 250 },
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-25'),
    },
  ] as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait calculer totalBookings, confirmedBookings, pendingBookings, cancelledBookings', () => {
    const { result } = renderHook(() => useBookingStats(mockBookings));

    expect(result.current.totalBookings).toBe(5);
    expect(result.current.confirmedBookings).toBe(2);
    expect(result.current.pendingBookings).toBe(1);
    expect(result.current.cancelledBookings).toBe(1);
    expect(result.current.completedBookings).toBe(1);
  });

  it('devrait calculer totalRevenue (réservations payées)', () => {
    const { result } = renderHook(() => useBookingStats(mockBookings));

    // Seulement les réservations avec paymentStatus === 'paid'
    // b1: 100, b3: 150, b5: 250 = 500
    expect(result.current.totalRevenue).toBe(500);
  });

  it('devrait calculer averageAmount', () => {
    const { result } = renderHook(() => useBookingStats(mockBookings));

    // Total: 100 + 200 + 150 + 300 + 250 = 1000
    // Average: 1000 / 5 = 200
    expect(result.current.averageAmount).toBe(200);
  });

  it('devrait gérer un tableau vide', () => {
    const { result } = renderHook(() => useBookingStats([]));

    expect(result.current.totalBookings).toBe(0);
    expect(result.current.confirmedBookings).toBe(0);
    expect(result.current.totalRevenue).toBe(0);
    expect(result.current.averageAmount).toBe(0);
  });

  it('devrait gérer bookings null/undefined', () => {
    const { result: resultNull } = renderHook(() => useBookingStats(null as any));
    expect(resultNull.current.totalBookings).toBe(0);

    const { result: resultUndefined } = renderHook(() => useBookingStats(undefined as any));
    expect(resultUndefined.current.totalBookings).toBe(0);
  });

  it('devrait calculer correctement avec seulement des réservations confirmées', () => {
    const confirmedOnly = mockBookings.filter((b: any) => b.status === 'confirmed');
    const { result } = renderHook(() => useBookingStats(confirmedOnly));

    expect(result.current.totalBookings).toBe(2);
    expect(result.current.confirmedBookings).toBe(2);
    expect(result.current.pendingBookings).toBe(0);
  });

  it('devrait calculer correctement avec seulement des réservations payées', () => {
    const paidOnly = mockBookings.filter((b: any) => b.paymentStatus === 'paid');
    const { result } = renderHook(() => useBookingStats(paidOnly));

    expect(result.current.totalBookings).toBe(3);
    expect(result.current.totalRevenue).toBe(500); // 100 + 150 + 250
  });
});

