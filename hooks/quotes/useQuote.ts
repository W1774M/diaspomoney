'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Quote } from './useQuotes';

export interface UseQuoteReturn {
  quote: Quote | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer un devis individuel
 * Implémente les design patterns :
 * - Custom Hooks Pattern
 * - Error Handling Pattern
 */
export function useQuote(id: string | undefined): UseQuoteReturn {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!id) {
      setQuote(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quotes/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Devis non trouvé');
        }
        throw new Error('Erreur lors de la récupération du devis');
      }

      const data = await response.json();
      if (data.success) {
        // Le nouveau format standardisé utilise data directement pour les ressources
        setQuote(data.data || data.quote || null);
      } else {
        throw new Error(data.error || 'Erreur lors de la récupération du devis');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  return {
    quote,
    loading,
    error,
    refetch: fetchQuote,
  };
}

