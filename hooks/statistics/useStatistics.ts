'use client';

/**
 * Custom Hook pour les statistiques personnelles
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services (évite les imports MongoDB côté client)
 */

import { UseStatisticsReturn } from '@/types/hooks';
import { PersonalStatistics } from '@/types/statistics';
import { useCallback, useState } from 'react';

/**
 * Custom Hook pour gérer les statistiques personnelles
 * Implémente le Custom Hooks Pattern
 */
export function useStatistics(): UseStatisticsReturn {
  const [statistics, setStatistics] = useState<PersonalStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/statistics/personal');

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques');
      }

      const data = await response.json();

      if (data.success && data.statistics) {
        // Transformer les dates string en Date objects
        const transformedStatistics: PersonalStatistics = {
          ...data.statistics,
          budget: {
            ...data.statistics.budget,
            monthly: {
              ...data.statistics.budget.monthly,
              period: {
                start: new Date(data.statistics.budget.monthly.period.start),
                end: new Date(data.statistics.budget.monthly.period.end),
              },
            },
            annual: {
              ...data.statistics.budget.annual,
              period: {
                start: new Date(data.statistics.budget.annual.period.start),
                end: new Date(data.statistics.budget.annual.period.end),
              },
            },
          },
          services: {
            ...data.statistics.services,
            mostUsed: data.statistics.services.mostUsed.map((service: any) => ({
              ...service,
              lastUsed: new Date(service.lastUsed),
            })),
          },
          savings: {
            ...data.statistics.savings,
            breakdown: data.statistics.savings.breakdown.map((saving: any) => ({
              ...saving,
              date: new Date(saving.date),
            })),
          },
          providers: {
            ...data.statistics.providers,
            favorites: data.statistics.providers.favorites.map(
              (provider: any) => ({
                ...provider,
                lastOrderDate: new Date(provider.lastOrderDate),
              })
            ),
          },
          period: {
            start: new Date(data.statistics.period.start),
            end: new Date(data.statistics.period.end),
          },
        };

        setStatistics(transformedStatistics);
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      // Le logging est fait côté serveur via les services avec @Log decorator
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
  };
}
