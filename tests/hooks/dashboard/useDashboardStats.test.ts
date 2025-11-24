/**
 * Tests unitaires pour useDashboardStats
 * 
 * Implémente les tests pour :
 * - Statistiques du tableau de bord
 * - Filtrage selon le rôle utilisateur
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboardStats } from '@/hooks/dashboard/useDashboardStats';

// Mock des hooks utilisés
const mockUsers = [
  { id: 'u1', roles: ['CUSTOMER'] },
  { id: 'u2', roles: ['CUSTOMER'] },
  { id: 'u3', roles: ['PROVIDER'] },
  { id: 'u4', roles: ['PROVIDER'] },
  { id: 'u5', roles: ['ADMIN'] },
];

const mockBookings = [
  { id: 'b1', requesterId: 'user1' },
  { id: 'b2', requesterId: 'user1' },
  { id: 'b3', requesterId: 'user2' },
];

const mockUseUsers = vi.fn(() => ({
  users: mockUsers,
  total: 5,
}));

const mockUseBookings = vi.fn(() => ({
  bookings: mockBookings,
  total: 3,
}));

const mockUseInvoices = vi.fn(() => ({
  total: 10,
}));

vi.mock('@/hooks', () => ({
  useUsers: () => mockUseUsers(),
  useBookings: () => mockUseBookings(),
  useInvoices: () => mockUseInvoices(),
}));

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait calculer les statistiques pour admin', () => {
    const { result } = renderHook(() =>
      useDashboardStats({
        userId: 'admin1',
        isAdmin: true,
        isCSM: false,
      }),
    );

    expect(result.current.users).toBe(5);
    expect(result.current.customers).toBe(2);
    expect(result.current.providers).toBe(2);
    expect(result.current.bookings).toBe(3);
    expect(result.current.invoices).toBe(10);
  });

  it('devrait calculer les statistiques pour CSM', () => {
    const { result } = renderHook(() =>
      useDashboardStats({
        userId: 'csm1',
        isAdmin: false,
        isCSM: true,
      }),
    );

    expect(result.current.users).toBe(5);
    expect(result.current.customers).toBe(2);
    expect(result.current.providers).toBe(2);
    expect(result.current.bookings).toBe(3);
    expect(result.current.invoices).toBe(10);
  });

  it('devrait calculer les statistiques pour utilisateur non-admin', () => {
    const { result } = renderHook(() =>
      useDashboardStats({
        userId: 'user1',
        isAdmin: false,
        isCSM: false,
      }),
    );

    // Pour les non-admin, seulement bookings et invoices filtrés
    expect(result.current.bookings).toBe(2); // Filtré par requesterId === 'user1'
    expect(result.current.invoices).toBe(10);
    expect(result.current.users).toBeUndefined();
    expect(result.current.customers).toBeUndefined();
    expect(result.current.providers).toBeUndefined();
  });

  it('devrait filtrer les utilisateurs par rôle (CUSTOMER)', () => {
    const { result } = renderHook(() =>
      useDashboardStats({
        userId: 'admin1',
        isAdmin: true,
        isCSM: false,
      }),
    );

    expect(result.current.customers).toBe(2);
  });

  it('devrait filtrer les utilisateurs par rôle (PROVIDER)', () => {
    const { result } = renderHook(() =>
      useDashboardStats({
        userId: 'admin1',
        isAdmin: true,
        isCSM: false,
      }),
    );

    expect(result.current.providers).toBe(2);
  });

  it('devrait filtrer les réservations par requesterId pour non-admin', () => {
    const { result } = renderHook(() =>
      useDashboardStats({
        userId: 'user1',
        isAdmin: false,
        isCSM: false,
      }),
    );

    // Seulement les réservations avec requesterId === 'user1'
    expect(result.current.bookings).toBe(2);
  });

  it('devrait utiliser useUsers, useBookings, useInvoices', () => {
    renderHook(() =>
      useDashboardStats({
        userId: 'admin1',
        isAdmin: true,
        isCSM: false,
      }),
    );

    expect(mockUseUsers).toHaveBeenCalled();
    expect(mockUseBookings).toHaveBeenCalled();
    expect(mockUseInvoices).toHaveBeenCalled();
  });

  it('devrait gérer un userId undefined pour non-admin', () => {
    const { result } = renderHook(() =>
      useDashboardStats({
        isAdmin: false,
        isCSM: false,
      }),
    );

    // Si userId est undefined, le filtrage devrait retourner 0
    expect(result.current.bookings).toBe(0);
  });
});

