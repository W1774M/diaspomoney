'use client';

/**
 * Custom Hook pour récupérer la liste des spécialités
 * Implémente le Custom Hooks Pattern avec gestion d'erreurs standardisée
 */

import { ISpeciality } from '@/lib/types';
import { useCallback, useEffect, useState, useMemo } from 'react';
import * as Sentry from '@sentry/nextjs';

export interface UseSpecialitiesOptions {
  group?: string | undefined;
  isActive?: boolean | undefined;
}

export interface UseSpecialitiesReturn {
  specialities: ISpeciality[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom Hook pour récupérer la liste des spécialités
 * Implémente le Custom Hooks Pattern avec gestion d'erreurs standardisée
 */
export function useSpecialities(options: UseSpecialitiesOptions = {}): UseSpecialitiesReturn {
  const [specialities, setSpecialities] = useState<ISpeciality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mémoriser les options pour éviter les re-renders inutiles
  const memoizedOptions = useMemo(() => options, [options]);

  const fetchSpecialities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (memoizedOptions.group) {
        params.append('group', memoizedOptions.group);
      }
      if (memoizedOptions.isActive !== undefined) {
        params.append('isActive', memoizedOptions.isActive.toString());
      }

      const response = await fetch(`/api/specialities?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Erreur lors du chargement des spécialités';

        setError(errorMessage);
        setSpecialities([]);

        // Capturer les erreurs critiques avec Sentry
        if (response.status >= 500) {
          Sentry.captureException(new Error(errorMessage), {
            tags: {
              component: 'useSpecialities',
              action: 'fetchSpecialities',
              status: response.status,
            },
            extra: { options: memoizedOptions, errorData },
          });
        }

        return;
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        // Transformer les dates string en objets Date
        const mappedSpecialities: ISpeciality[] = data.data.map((s: any) => ({
          ...s,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
        }));
        setSpecialities(mappedSpecialities);
      } else {
        setError('Format de réponse invalide');
        setSpecialities([]);
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      setSpecialities([]);

      Sentry.captureException(err, {
        tags: {
          component: 'useSpecialities',
          action: 'fetchSpecialities',
        },
        extra: { options: memoizedOptions },
      });
    } finally {
      setLoading(false);
    }
  }, [memoizedOptions]);

  useEffect(() => {
    fetchSpecialities();
  }, [fetchSpecialities]);

  return {
    specialities,
    loading,
    error,
    refetch: fetchSpecialities,
  };
}

