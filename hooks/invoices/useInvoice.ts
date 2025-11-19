'use client';

import { IInvoice } from '@/types';
import { useCallback, useEffect, useState } from 'react';

interface UseInvoiceReturn {
  invoice: IInvoice | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom Hook pour récupérer une facture par ID
 * Implémente le Custom Hooks Pattern
 */
export function useInvoice(invoiceId: string | null): UseInvoiceReturn {
  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) {
      setError('ID de facture manquant');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/invoices/${invoiceId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Facture non trouvée');
        } else if (response.status === 403) {
          setError('Accès non autorisé');
        } else {
          setError('Erreur lors du chargement de la facture');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success && data.invoice) {
        // Transformer les dates string en objets Date
        const invoiceData: IInvoice = {
          ...data.invoice,
          issueDate: data.invoice.issueDate
            ? new Date(data.invoice.issueDate)
            : new Date(),
          dueDate: data.invoice.dueDate
            ? new Date(data.invoice.dueDate)
            : new Date(),
          paidDate: data.invoice.paidDate
            ? new Date(data.invoice.paidDate)
            : undefined,
          paymentDate: data.invoice.paymentDate
            ? new Date(data.invoice.paymentDate)
            : undefined,
          createdAt: data.invoice.createdAt
            ? new Date(data.invoice.createdAt)
            : new Date(),
          updatedAt: data.invoice.updatedAt
            ? new Date(data.invoice.updatedAt)
            : new Date(),
        };
        setInvoice(invoiceData);
      } else {
        setError('Format de réponse invalide');
      }
    } catch (err) {
      // Le logging est fait côté serveur via InvoiceService avec @Log decorator
      setError('Erreur lors du chargement de la facture');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  return {
    invoice,
    loading,
    error,
    refetch: fetchInvoice,
  };
}
