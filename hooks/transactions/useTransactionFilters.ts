'use client';

import type { Transaction, TransactionStatus } from '@/lib/types';
import { useCallback, useMemo, useState } from 'react';

export interface TransactionFilters {
  searchTerm: string;
  status: 'all' | TransactionStatus;
  serviceType?: 'HEALTH' | 'BTP' | 'EDUCATION';
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Hook pour filtrer les transactions
 * Implémente les design patterns :
 * - Custom Hooks Pattern
 * - Filter Pattern
 */
export function useTransactionFilters(transactions: Transaction[]) {
  const [filters, setFilters] = useState<TransactionFilters>({
    searchTerm: '',
    status: 'all',
  });

  // Sécurité : s'assurer que transactions est un tableau
  const safeTransactions = useMemo(() => transactions || [], [transactions]);

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    return safeTransactions.filter(transaction => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesId = transaction._id?.toLowerCase().includes(searchLower);
        const matchesDescription = transaction.description
          ?.toLowerCase()
          .includes(searchLower);
        const matchesMetadata = transaction.metadata
          ? JSON.stringify(transaction.metadata).toLowerCase().includes(searchLower)
          : false;

        if (!matchesId && !matchesDescription && !matchesMetadata) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all' && transaction.status !== filters.status) {
        return false;
      }

      // Service type filter
      if (filters.serviceType && transaction.serviceType !== filters.serviceType) {
        return false;
      }

      // Currency filter
      if (filters.currency && transaction.currency !== filters.currency) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const transactionDate = new Date(transaction.createdAt);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

        if (fromDate && transactionDate < fromDate) {
          return false;
        }
        if (toDate && transactionDate > toDate) {
          return false;
        }
      }

      // Amount range filter
      if (filters.minAmount !== undefined && transaction.amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && transaction.amount > filters.maxAmount) {
        return false;
      }

      return true;
    });
  }, [safeTransactions, filters]);

  const updateFilter = useCallback(
    (key: keyof TransactionFilters, value: string | number | undefined) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      status: 'all',
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm.length > 0 ||
      filters.status !== 'all' ||
      filters.serviceType !== undefined ||
      filters.currency !== undefined ||
      filters.dateFrom !== undefined ||
      filters.dateTo !== undefined ||
      filters.minAmount !== undefined ||
      filters.maxAmount !== undefined
    );
  }, [filters]);

  return {
    filters,
    filteredTransactions,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}

