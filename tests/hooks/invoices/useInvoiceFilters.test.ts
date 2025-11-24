/**
 * Tests unitaires pour useInvoiceFilters
 * 
 * Implémente les tests pour :
 * - Filtrage côté client des factures
 * - Combinaison de filtres
 * - Gestion des états
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvoiceFilters } from '@/hooks/invoices/useInvoiceFilters';

describe('useInvoiceFilters', () => {
  const mockInvoices = [
    {
      id: 'inv1',
      invoiceNumber: 'INV-001',
      customerId: 'customer1',
      providerId: 'provider1',
      status: 'PENDING',
      issueDate: '2024-01-15T00:00:00.000Z',
      amount: 100,
    },
    {
      id: 'inv2',
      invoiceNumber: 'INV-002',
      customerId: 'customer2',
      providerId: 'provider2',
      status: 'PAID',
      issueDate: '2024-01-20T00:00:00.000Z',
      amount: 200,
    },
    {
      id: 'inv3',
      invoiceNumber: 'INV-003',
      customerId: 'customer1',
      providerId: 'provider3',
      status: 'PENDING',
      issueDate: '2024-02-01T00:00:00.000Z',
      amount: 300,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait filtrer par searchTerm (invoiceNumber)', () => {
    const { result } = renderHook(() => useInvoiceFilters(mockInvoices));

    act(() => {
      result.current.updateFilter('searchTerm', 'INV-001');
    });

    expect(result.current.filteredInvoices).toHaveLength(1);
    expect(result.current.filteredInvoices[0].invoiceNumber).toBe('INV-001');
  });

  it('devrait filtrer par searchTerm (customerId)', () => {
    const { result } = renderHook(() => useInvoiceFilters(mockInvoices));

    act(() => {
      result.current.updateFilter('searchTerm', 'customer1');
    });

    expect(result.current.filteredInvoices).toHaveLength(2);
    expect(result.current.filteredInvoices.every(inv => inv.customerId === 'customer1')).toBe(true);
  });

  it('devrait filtrer par searchTerm (providerId)', () => {
    const { result } = renderHook(() => useInvoiceFilters(mockInvoices));

    act(() => {
      result.current.updateFilter('searchTerm', 'provider2');
    });

    expect(result.current.filteredInvoices).toHaveLength(1);
    expect(result.current.filteredInvoices[0].providerId).toBe('provider2');
  });

  it('devrait filtrer par statusFilter (PENDING)', () => {
    const { result } = renderHook(() => useInvoiceFilters(mockInvoices));

    act(() => {
      result.current.updateFilter('statusFilter', 'PENDING');
    });

    expect(result.current.filteredInvoices).toHaveLength(2);
    expect(result.current.filteredInvoices.every(inv => inv.status === 'PENDING')).toBe(true);
  });

  it('devrait filtrer par statusFilter (PAID)', () => {
    const { result } = renderHook(() => useInvoiceFilters(mockInvoices));

    act(() => {
      result.current.updateFilter('statusFilter', 'PAID');
    });

    expect(result.current.filteredInvoices).toHaveLength(1);
    expect(result.current.filteredInvoices[0].status).toBe('PAID');
  });

  it('devrait filtrer par statusFilter (ALL)', () => {
    const { result } = renderHook(() => useInvoiceFilters(mockInvoices));

    act(() => {
      result.current.updateFilter('statusFilter', 'ALL');
    });

    expect(result.current.filteredInvoices).toHaveLength(3);
  });

  it('devrait filtrer par dateFilter', () => {
    const { result } = renderHook(() => useInvoiceFilters(mockInvoices));

    act(() => {
      result.current.updateFilter('dateFilter', '2024-01-15');
    });

    expect(result.current.filteredInvoices).toHaveLength(1);
    expect(result.current.filteredInvoices[0].id).toBe('inv1');
  });

  it('devrait combiner plusieurs filtres', () => {
    const { result } = renderHook(() => useInvoiceFilters(mockInvoices));

    act(() => {
      result.current.updateFilter('searchTerm', 'provider1');
      result.current.updateFilter('statusFilter', 'PENDING');
    });

    expect(result.current.filteredInvoices).toHaveLength(1);
    expect(result.current.filteredInvoices[0].customerId).toBe('customer1');
    expect(result.current.filteredInvoices[0].status).toBe('PENDING');
  });

  it('devrait mettre à jour un filtre avec updateFilter', () => {
    const { result } = renderHook(() => useInvoiceFilters(mockInvoices));

    act(() => {
      result.current.updateFilter('searchTerm', 'test');
    });

    expect(result.current.filters.searchTerm).toBe('test');
  });

  it('devrait réinitialiser tous les filtres avec clearFilters', () => {
    const { result } = renderHook(() => useInvoiceFilters(mockInvoices));

    act(() => {
      result.current.updateFilter('searchTerm', 'test');
      result.current.updateFilter('statusFilter', 'PAID');
      result.current.updateFilter('dateFilter', '2024-01-01');
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters.searchTerm).toBe('');
    expect(result.current.filters.statusFilter).toBe('ALL');
    expect(result.current.filters.dateFilter).toBe('');
    expect(result.current.filteredInvoices).toHaveLength(3);
  });

  it('devrait détecter les filtres actifs (hasActiveFilters)', () => {
    const { result } = renderHook(() => useInvoiceFilters(mockInvoices));

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.updateFilter('searchTerm', 'test');
    });

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.clearFilters();
      result.current.updateFilter('statusFilter', 'PAID');
    });

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.clearFilters();
      result.current.updateFilter('dateFilter', '2024-01-01');
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('devrait gérer invoices null/undefined (safeInvoices)', () => {
    const { result: resultNull } = renderHook(() => useInvoiceFilters(null as any));
    expect(resultNull.current.filteredInvoices).toHaveLength(0);

    const { result: resultUndefined } = renderHook(() => useInvoiceFilters(undefined as any));
    expect(resultUndefined.current.filteredInvoices).toHaveLength(0);
  });

  it('devrait être insensible à la casse pour searchTerm', () => {
    const { result } = renderHook(() => useInvoiceFilters(mockInvoices));

    act(() => {
      result.current.updateFilter('searchTerm', 'inv-001');
    });

    expect(result.current.filteredInvoices).toHaveLength(1);
    expect(result.current.filteredInvoices[0].invoiceNumber).toBe('INV-001');
  });
});

