/**
 * Tests unitaires pour useInvoiceStats
 * 
 * Implémente les tests pour :
 * - Statistiques des factures
 * - Filtrage selon le rôle utilisateur
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInvoiceStats } from '@/hooks/invoices/useInvoiceStats';

// Mock de MOCK_INVOICES - utiliser vi.hoisted() pour que les variables soient disponibles dans vi.mock
const { mockInvoices } = vi.hoisted(() => {
  return {
    mockInvoices: [
      {
        _id: 'inv1',
        invoiceNumber: 'INV-001',
        providerId: 'provider1',
        customerId: 'customer1',
        status: 'PAID',
        amount: 100,
        currency: 'EUR',
        dueDate: new Date('2024-02-15'),
        issueDate: new Date('2024-01-15'),
        paidDate: new Date('2024-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        notes: '',
      },
      {
        _id: 'inv2',
        invoiceNumber: 'INV-002',
        providerId: 'provider1',
        customerId: 'customer2',
        status: 'SENT',
        amount: 200,
        currency: 'EUR',
        dueDate: new Date('2024-02-20'),
        issueDate: new Date('2024-01-20'),
        paidDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        notes: '',
      },
      {
        _id: 'inv3',
        invoiceNumber: 'INV-003',
        providerId: 'provider2',
        customerId: 'customer1',
        status: 'OVERDUE',
        amount: 300,
        currency: 'EUR',
        dueDate: new Date('2024-01-10'),
        issueDate: new Date('2024-01-01'),
        paidDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        notes: '',
      },
      {
        _id: 'inv4',
        invoiceNumber: 'INV-004',
        providerId: 'provider2',
        customerId: 'customer3',
        status: 'CANCELLED',
        amount: 150,
        currency: 'EUR',
        dueDate: new Date('2024-02-25'),
        issueDate: new Date('2024-01-25'),
        paidDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        notes: '',
      },
      {
        _id: 'inv5',
        invoiceNumber: 'INV-005',
        providerId: 'provider1',
        customerId: 'customer1',
        status: 'PAID',
        amount: 250,
        currency: 'EUR',
        dueDate: new Date('2024-02-28'),
        issueDate: new Date('2024-01-28'),
        paidDate: new Date('2024-01-28'),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        notes: '',
      },
    ],
  };
});

vi.mock('@/mocks', () => ({
  MOCK_INVOICES: mockInvoices,
  MOCK_USERS: [],
  MOCK_SERVICES: [],
  MOCK_APPOINTMENTS: [],
}));

describe('useInvoiceStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait calculer les statistiques pour admin (toutes les factures)', () => {
    const { result } = renderHook(() =>
      useInvoiceStats({
        isAdmin: true,
      }),
    );

    expect(result.current.totalInvoices).toBe(5);
    expect(result.current.paidInvoices).toBe(2);
    expect(result.current.pendingInvoices).toBe(1);
    expect(result.current.overdueInvoices).toBe(1);
    expect(result.current.cancelledInvoices).toBe(1);
  });

  it('devrait calculer les statistiques pour provider (filtré par providerId)', () => {
    const { result } = renderHook(() =>
      useInvoiceStats({
        userId: 'provider1',
        isProvider: true,
      }),
    );

    expect(result.current.totalInvoices).toBe(3);
    expect(result.current.paidInvoices).toBe(2);
    expect(result.current.pendingInvoices).toBe(1);
  });

  it('devrait calculer les statistiques pour customer (filtré par customerId)', () => {
    const { result } = renderHook(() =>
      useInvoiceStats({
        userId: 'customer1',
        isCustomer: true,
      }),
    );

    expect(result.current.totalInvoices).toBe(3);
    expect(result.current.paidInvoices).toBe(2);
    expect(result.current.overdueInvoices).toBe(1);
  });

  it('devrait calculer totalInvoices, paidInvoices, pendingInvoices, overdueInvoices, cancelledInvoices', () => {
    const { result } = renderHook(() =>
      useInvoiceStats({
        isAdmin: true,
      }),
    );

    expect(result.current.totalInvoices).toBe(5);
    expect(result.current.paidInvoices).toBe(2);
    expect(result.current.pendingInvoices).toBe(1);
    expect(result.current.overdueInvoices).toBe(1);
    expect(result.current.cancelledInvoices).toBe(1);
  });

  it('devrait calculer totalAmount, paidAmount, pendingAmount, overdueAmount', () => {
    const { result } = renderHook(() =>
      useInvoiceStats({
        isAdmin: true,
      }),
    );

    expect(result.current.totalAmount).toBe(1000); // 100 + 200 + 300 + 150 + 250
    expect(result.current.paidAmount).toBe(350); // 100 + 250
    expect(result.current.pendingAmount).toBe(200); // 200
    expect(result.current.overdueAmount).toBe(300); // 300
  });

  it('devrait filtrer selon le rôle utilisateur (provider)', () => {
    const { result } = renderHook(() =>
      useInvoiceStats({
        userId: 'provider2',
        isProvider: true,
      }),
    );

    expect(result.current.totalInvoices).toBe(2);
    expect(result.current.overdueInvoices).toBe(1);
    expect(result.current.cancelledInvoices).toBe(1);
  });

  it('devrait filtrer selon le rôle utilisateur (customer)', () => {
    const { result } = renderHook(() =>
      useInvoiceStats({
        userId: 'customer2',
        isCustomer: true,
      }),
    );

    expect(result.current.totalInvoices).toBe(1);
    expect(result.current.pendingInvoices).toBe(1);
  });

  it('devrait gérer userId sans rôle spécifique', () => {
    const { result } = renderHook(() =>
      useInvoiceStats({
        userId: 'customer1',
      }),
    );

    // Devrait filtrer par customerId ou providerId
    expect(result.current.totalInvoices).toBeGreaterThan(0);
  });

  it('devrait retourner 0 pour tous les montants si aucune facture', () => {
    // Ce test nécessite un mock séparé, mais comme vi.mock est hoisted,
    // on ne peut pas le modifier dans un test individuel.
    // On va plutôt tester avec un filtre qui ne correspond à aucune facture
    const { result } = renderHook(() =>
      useInvoiceStats({
        userId: 'nonexistent-user',
        isProvider: true,
      }),
    );

    expect(result.current.totalInvoices).toBe(0);
    expect(result.current.totalAmount).toBe(0);
    expect(result.current.paidAmount).toBe(0);
  });
});

