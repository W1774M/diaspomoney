'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Transaction } from '@/lib/types';

export interface UseTransactionsOptions {
  limit?: number;
  offset?: number;
  page?: number;
  userId?: string | undefined;
  status?: string | string[];
  serviceType?: 'HEALTH' | 'BTP' | 'EDUCATION';
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface UseTransactionsReturn {
  transactions: Transaction[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer les transactions
 * Implémente les design patterns :
 * - Custom Hooks Pattern
 * - Error Handling Pattern
 */
export function useTransactions(
  options: UseTransactionsOptions = {},
): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const fetchingRef = useRef(false);
  const optionsRef = useRef(options);

  // Extraire les valeurs individuelles pour créer une clé stable
  const limit = options.limit;
  const offset = options.offset;
  const page = options.page;
  const userId = options.userId;
  const status = options.status;
  const serviceType = options.serviceType;
  const currency = options.currency;
  const dateFrom = options.dateFrom;
  const dateTo = options.dateTo;
  const minAmount = options.minAmount;
  const maxAmount = options.maxAmount;

  // Mettre à jour le ref seulement si les valeurs ont vraiment changé
  const optionsChanged =
    optionsRef.current.limit !== limit ||
    optionsRef.current.offset !== offset ||
    optionsRef.current.page !== page ||
    optionsRef.current.userId !== userId ||
    optionsRef.current.status !== status ||
    optionsRef.current.serviceType !== serviceType ||
    optionsRef.current.currency !== currency ||
    optionsRef.current.dateFrom !== dateFrom ||
    optionsRef.current.dateTo !== dateTo ||
    optionsRef.current.minAmount !== minAmount ||
    optionsRef.current.maxAmount !== maxAmount;

  if (optionsChanged) {
    optionsRef.current = options;
  }

  // Créer une clé stable pour les dépendances
  const optionsKey = JSON.stringify({
    limit: limit || null,
    offset: offset ?? null,
    page: page || null,
    userId: userId || null,
    status: status || null,
    serviceType: serviceType || null,
    currency: currency || null,
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    minAmount: minAmount ?? null,
    maxAmount: maxAmount ?? null,
  });

  // Fonction pour récupérer les transactions
  const fetchTransactions = useCallback(async () => {
    // Éviter les appels multiples simultanés
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Utiliser les valeurs actuelles depuis optionsRef
      const currentOptions = optionsRef.current;

      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (currentOptions.page) {
        params.append('page', currentOptions.page.toString());
      } else if (currentOptions.offset !== undefined && currentOptions.limit) {
        // Convertir offset en page si nécessaire
        const calculatedPage = Math.floor(currentOptions.offset / currentOptions.limit) + 1;
        params.append('page', calculatedPage.toString());
      }
      if (currentOptions.limit) {
        params.append('limit', currentOptions.limit.toString());
      }
      if (currentOptions.status) {
        const statusArray = Array.isArray(currentOptions.status)
          ? currentOptions.status
          : [currentOptions.status];
        statusArray.forEach(status => {
          params.append('status', status);
        });
      }
      if (currentOptions.serviceType) {
        params.append('serviceType', currentOptions.serviceType);
      }
      if (currentOptions.currency) {
        params.append('currency', currentOptions.currency);
      }
      if (currentOptions.dateFrom) {
        params.append('dateFrom', currentOptions.dateFrom);
      }
      if (currentOptions.dateTo) {
        params.append('dateTo', currentOptions.dateTo);
      }
      if (currentOptions.minAmount !== undefined) {
        params.append('minAmount', currentOptions.minAmount.toString());
      }
      if (currentOptions.maxAmount !== undefined) {
        params.append('maxAmount', currentOptions.maxAmount.toString());
      }

      // Appeler l'API route
      const response = await fetch(`/api/transactions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des transactions');
      }

      const data = await response.json();
      if (data.success) {
        // Le nouveau format standardisé utilise data directement pour les listes
        setTransactions(Array.isArray(data.data) ? data.data : []);
        setTotal(data.pagination?.total || data.metadata?.count || 0);
      } else {
        throw new Error(data.error || 'Erreur lors de la récupération des transactions');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [optionsKey]);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  return {
    transactions,
    total,
    loading,
    error,
    refetch: fetchTransactions,
  };
}

