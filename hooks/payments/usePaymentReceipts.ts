'use client';

import { useNotificationManager } from '@/components/ui/Notification';
import type { UsePaymentReceiptsReturn } from '@/types/hooks';
import type { PaymentReceipt } from '@/types/payments';
import { useCallback, useEffect, useState } from 'react';

/**
 * Custom Hook pour récupérer les reçus de paiement
 * Implémente le Custom Hooks Pattern
 * Utilise l'API route qui utilise les repositories avec decorators
 */
export function usePaymentReceipts(): UsePaymentReceiptsReturn {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addError } = useNotificationManager();

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payment-receipts');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 'Erreur lors du chargement des reçus',
        );
      }

      const data = await response.json();
      if (data.success && data.receipts) {
        setReceipts(data.receipts);
      } else {
        throw new Error(data.error || 'Format de réponse invalide');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      addError(errorMessage);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [addError]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  return {
    receipts,
    loading,
    error,
    refetch: fetchReceipts,
  };
}
