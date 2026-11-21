'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

export interface Quote {
  _id?: string;
  id?: string;
  quoteNumber?: string;
  customerId?: string;
  providerId?: string;
  serviceId?: string;
  amount?: number;
  currency?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

export interface UseQuotesProps {
  limit?: number;
  offset?: number;
  page?: number;
  userId?: string | undefined;
  status?: string | undefined;
  isAdmin?: boolean;
}

export interface UseQuotesReturn {
  quotes: Quote[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuotes({
  limit = 50,
  offset = 0,
  page,
  userId,
  status,
  isAdmin = false,
}: UseQuotesProps = {}): UseQuotesReturn {
  const [quotes, setQuotes] = useState<Quote[]>([]);
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
    }),
    [limit, offset, page, userId, status, isAdmin],
  );

  // Fonction pour récupérer les devis
  const fetchQuotes = useCallback(async () => {
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
      if (memoizedOptions.userId && !memoizedOptions.isAdmin) {
        params.append('userId', memoizedOptions.userId);
      }

      // Appeler l'API route
      const response = await fetch(`/api/quotes?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }

      const data = await response.json();
      if (data.success) {
        // Le nouveau format standardisé utilise data directement pour les listes
        setQuotes(Array.isArray(data.data) ? data.data : []);
        setTotal(data.pagination?.total || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch quotes');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      setQuotes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [memoizedOptions]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  return {
    quotes,
    total,
    loading,
    error,
    refetch: fetchQuotes,
  };
}

