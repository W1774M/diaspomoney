'use client';

import { IInvoice } from '@/lib/types';
import { useCallback, useState } from 'react';

interface UseInvoiceEditReturn {
  updateInvoice: (
    invoiceId: string,
    data: Partial<IInvoice>
  ) => Promise<IInvoice | null>;
  saving: boolean;
  error: string | null;
}

/**
 * Custom Hook pour mettre à jour une facture
 * Implémente le Custom Hooks Pattern
 * Utilise l'API route qui utilise InvoiceService avec decorators (@Log, @InvalidateCache)
 */
export function useInvoiceEdit(): UseInvoiceEditReturn {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateInvoice = useCallback(
    async (
      invoiceId: string,
      data: Partial<IInvoice>,
    ): Promise<IInvoice | null> => {
      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Facture non trouvée');
          } else if (response.status === 403) {
            throw new Error('Accès non autorisé');
          } else if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Données invalides');
          } else {
            throw new Error('Erreur lors de la mise à jour de la facture');
          }
        }

        const result = await response.json();

        if (result.success && result.invoice) {
          // Transformer les dates string en objets Date
          const invoiceData: IInvoice = {
            ...result.invoice,
            issueDate: result.invoice.issueDate
              ? new Date(result.invoice.issueDate)
              : new Date(),
            dueDate: result.invoice.dueDate
              ? new Date(result.invoice.dueDate)
              : new Date(),
            paidDate: result.invoice.paidDate
              ? new Date(result.invoice.paidDate)
              : undefined,
            paymentDate: result.invoice.paymentDate
              ? new Date(result.invoice.paymentDate)
              : undefined,
            createdAt: result.invoice.createdAt
              ? new Date(result.invoice.createdAt)
              : new Date(),
            updatedAt: result.invoice.updatedAt
              ? new Date(result.invoice.updatedAt)
              : new Date(),
          };
          return invoiceData;
        } else {
          throw new Error(result.error || 'Format de réponse invalide');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur inconnue';
        setError(errorMessage);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return {
    updateInvoice,
    saving,
    error,
  };
}
