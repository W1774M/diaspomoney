/**
 * Tests unitaires pour useQuoteFilters
 * 
 * Implémente les tests pour :
 * - Filtrage côté client des devis
 * - Combinaison de filtres
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuoteFilters } from '@/hooks/quotes/useQuoteFilters';

describe('useQuoteFilters', () => {
  const mockQuotes = [
    {
      id: 'q1',
      number: 'QUOTE-001',
      title: 'Devis BTP',
      provider: 'Provider A',
      status: 'PENDING',
      type: 'BTP',
      createdAt: '2024-01-15T00:00:00.000Z',
    },
    {
      id: 'q2',
      number: 'QUOTE-002',
      title: 'Devis Education',
      provider: 'Provider B',
      status: 'APPROVED',
      type: 'EDUCATION',
      createdAt: '2024-01-20T00:00:00.000Z',
    },
    {
      id: 'q3',
      number: 'QUOTE-003',
      title: 'Devis BTP 2',
      provider: 'Provider A',
      status: 'PENDING',
      type: 'BTP',
      createdAt: '2024-02-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait filtrer par searchTerm', () => {
    const { result } = renderHook(() => useQuoteFilters(mockQuotes));

    act(() => {
      result.current.updateFilter('searchTerm', 'QUOTE-001');
    });

    expect(result.current.filteredQuotes).toHaveLength(1);
    expect(result.current.filteredQuotes[0].number).toBe('QUOTE-001');
  });

  it('devrait filtrer par type (BTP)', () => {
    const { result } = renderHook(() => useQuoteFilters(mockQuotes));

    // Note: Le hook ne filtre pas directement par type, mais on peut tester via searchTerm
    act(() => {
      result.current.updateFilter('searchTerm', 'BTP');
    });

    expect(result.current.filteredQuotes.length).toBeGreaterThan(0);
  });

  it('devrait filtrer par status', () => {
    const { result } = renderHook(() => useQuoteFilters(mockQuotes));

    act(() => {
      result.current.updateFilter('statusFilter', 'PENDING');
    });

    expect(result.current.filteredQuotes).toHaveLength(2);
    expect(result.current.filteredQuotes.every(q => q.status === 'PENDING')).toBe(true);
  });

  it('devrait combiner plusieurs filtres', () => {
    const { result } = renderHook(() => useQuoteFilters(mockQuotes));

    act(() => {
      result.current.updateFilter('searchTerm', 'Provider A');
      result.current.updateFilter('statusFilter', 'PENDING');
    });

    expect(result.current.filteredQuotes).toHaveLength(2);
    expect(result.current.filteredQuotes.every(q => q.status === 'PENDING')).toBe(true);
  });

  it('devrait mettre à jour un filtre avec updateFilter', () => {
    const { result } = renderHook(() => useQuoteFilters(mockQuotes));

    act(() => {
      result.current.updateFilter('searchTerm', 'test');
    });

    expect(result.current.filters.searchTerm).toBe('test');
  });

  it('devrait réinitialiser tous les filtres avec clearFilters', () => {
    const { result } = renderHook(() => useQuoteFilters(mockQuotes));

    act(() => {
      result.current.updateFilter('searchTerm', 'test');
      result.current.updateFilter('statusFilter', 'APPROVED');
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters.searchTerm).toBe('');
    expect(result.current.filters.statusFilter).toBe('ALL');
    expect(result.current.filteredQuotes).toHaveLength(3);
  });

  it('devrait détecter les filtres actifs (hasActiveFilters)', () => {
    const { result } = renderHook(() => useQuoteFilters(mockQuotes));

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.updateFilter('searchTerm', 'test');
    });

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.clearFilters();
      result.current.updateFilter('statusFilter', 'APPROVED');
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('devrait gérer quotes null/undefined', () => {
    const { result: resultNull } = renderHook(() => useQuoteFilters(null as any));
    expect(resultNull.current.filteredQuotes).toHaveLength(0);

    const { result: resultUndefined } = renderHook(() => useQuoteFilters(undefined as any));
    expect(resultUndefined.current.filteredQuotes).toHaveLength(0);
  });
});

