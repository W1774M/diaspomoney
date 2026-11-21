'use client';

import { IInvoice } from '@/lib/types';
import { useEffect, useState, useCallback, useMemo } from 'react';

interface UseInvoicesProps {
  limit?: number;
  offset?: number;
  page?: number;
  userId?: string | undefined;
  status?: string | undefined;
  isAdmin?: boolean;
  isProvider?: boolean;
  isCustomer?: boolean;
}

interface UseInvoicesReturn {
  invoices: IInvoice[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInvoices({
  limit = 50,
  offset = 0,
  page,
  userId,
  status,
  isAdmin = false,
  isProvider = false,
  isCustomer = false,
}: UseInvoicesProps = {}): UseInvoicesReturn {
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Mémoriser les options pour éviter les re-renders inutiles
  const memoizedOptions = useMemo(
    () => ({
      limit,
      offset,
      page,
      userId,
      status,
      isAdmin,
      isProvider,
      isCustomer,
    }),
    [limit, offset, page, userId, status, isAdmin, isProvider, isCustomer],
  );

  // Fonction pour récupérer les factures
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (memoizedOptions.page) {
        params.append('page', memoizedOptions.page.toString());
      } else if (memoizedOptions.offset !== undefined && memoizedOptions.limit) {
        // Convertir offset en page si nécessaire
        const calculatedPage = Math.floor(memoizedOptions.offset / memoizedOptions.limit) + 1;
        params.append('page', calculatedPage.toString());
      }
      if (memoizedOptions.limit) {
        params.append('limit', memoizedOptions.limit.toString());
      }
      if (memoizedOptions.status && memoizedOptions.status !== 'ALL') {
        params.append('status', memoizedOptions.status);
      }

      // Appeler l'API route
      const response = await fetch(`/api/invoices?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      if (data.success) {
        // Le nouveau format standardisé utilise data directement pour les listes
        setInvoices(Array.isArray(data.data) ? data.data : []);
        setTotal(data.pagination?.total || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch invoices');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      setInvoices([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [memoizedOptions]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    total,
    loading,
    error,
    refetch: fetchInvoices,
  };
}
