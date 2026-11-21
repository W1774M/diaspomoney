'use client';

/**
 * État async partagé pour les hooks UI (rewrite large).
 * Convention : isLoading / error / data — pas de logique métier.
 */

import { useCallback, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export function useAsyncState<T>(initial: T | null = null) {
  const [data, setData] = useState<T | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(async (fn: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(initial);
    setError(null);
    setIsLoading(false);
  }, [initial]);

  return { data, error, isLoading, setData, setError, setIsLoading, run, reset };
}
