'use client';

import { MOCK_INVOICES } from '@/mocks';
import { IInvoice } from '@/types';
import { useEffect, useMemo, useState } from 'react';

interface UseInvoicesProps {
  limit?: number;
  offset?: number;
  userId?: string | undefined;
  isAdmin?: boolean;
  isProvider?: boolean;
  isCustomer?: boolean;
}

interface UseInvoicesReturn {
  invoices: IInvoice[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useInvoices({
  limit = 50,
  offset = 0,
  userId,
  isAdmin = false,
  isProvider = false,
  isCustomer = false,
}: UseInvoicesProps = {}): UseInvoicesReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { invoices, total } = useMemo(() => {
    let filteredInvoices = [...MOCK_INVOICES];

    // Filtrer selon le rôle de l'utilisateur
    if (!isAdmin) {
      if (isProvider) {
        // Les providers voient leurs factures (où ils sont le providerId)
        filteredInvoices = filteredInvoices.filter(
          invoice => invoice.providerId === userId
        );
      } else if (isCustomer) {
        // Les customers voient leurs factures (où ils sont le customerId)
        filteredInvoices = filteredInvoices.filter(
          invoice => invoice.customerId === userId
        );
      } else if (userId) {
        // Si un userId est spécifié mais pas de rôle, filtrer par userId
        filteredInvoices = filteredInvoices.filter(
          invoice => invoice.userId === userId
        );
      }
    }

    // Appliquer la pagination
    const paginatedInvoices = filteredInvoices.slice(offset, offset + limit);

    return {
      invoices: paginatedInvoices,
      total: filteredInvoices.length,
    };
  }, [limit, offset, userId, isAdmin, isProvider, isCustomer]);

  const refetch = () => {
    setLoading(true);
    setError(null);

    // Simuler un délai de chargement
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  // Simuler le chargement initial
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [userId, isAdmin, isProvider, isCustomer]);

  return {
    invoices: invoices as unknown as IInvoice[],
    total,
    loading,
    error,
    refetch,
  };
}
