/**
 * Custom Hook pour les statistiques des utilisateurs
 * Implémente le Custom Hooks Pattern
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

export interface UserStatistics {
  totalUsers: number;
  usersToday: number;
  previousMonthUsers: number;
  restRequests: number;
  authRequests: number;
}

export interface UseUserStatisticsReturn {
  statistics: UserStatistics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserStatistics(): UseUserStatisticsReturn {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/statistics/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errorData.error || 'Erreur lors de la récupération des statistiques');
      }

      const data = await response.json();
      if (data.success && data.statistics) {
        setStatistics(data.statistics);
      } else {
        throw new Error('Format de données invalide');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      logger.error({ error: err }, 'Error fetching user statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
}
