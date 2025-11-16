'use client';

import { useNotificationManager } from '@/components/ui/Notification';
import { IInvoice } from '@/types';
import { useCallback, useState } from 'react';

interface UseInvoiceCreateReturn {
  createInvoice: (data: Partial<IInvoice>) => Promise<IInvoice | null>;
  creating: boolean;
  error: string | null;
}

/**
 * Custom Hook pour créer une facture
 * Implémente le Custom Hooks Pattern
 * Utilise l'API route qui utilise InvoiceService avec decorators (@Log, @InvalidateCache, @Validate)
 */
export function useInvoiceCreate(): UseInvoiceCreateReturn {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addSuccess, addError } = useNotificationManager();

  const createInvoice = useCallback(
    async (data: Partial<IInvoice>): Promise<IInvoice | null> => {
      setCreating(true);
      setError(null);

      try {
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 400) {
            throw new Error(errorData.error || 'Données invalides');
          } else if (response.status === 403) {
            throw new Error('Accès non autorisé');
          } else {
            throw new Error(
              errorData.error || 'Erreur lors de la création de la facture'
            );
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

          addSuccess('Facture créée avec succès');
          return invoiceData;
        } else {
          throw new Error(result.error || 'Format de réponse invalide');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        addError(errorMessage);
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [addSuccess, addError]
  );

  return {
    createInvoice,
    creating,
    error,
  };
}
