'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface CsmStats {
  managedOrders: number;
  assignedClients: number;
  coordinatedProviders: number;
  satisfactionRate: number;
  resolvedTickets: number;
}

interface UseCsmStatsParams {
  userId?: string;
  enabled: boolean;
}

interface CsmStatsData {
  managedOrders: number;
  assignedClients: number;
  coordinatedProviders: number;
  satisfactionRate: number;
  resolvedTickets: number;
}

export function useCsmStats({ userId, enabled }: UseCsmStatsParams) {
  // État pour les statistiques CSM
  const [csmStatsData, setCsmStatsData] = useState<CsmStatsData | null>(null);

  // Récupérer les statistiques CSM depuis l'API
  const fetchCsmStats = useCallback(async () => {
    if (!enabled || !userId) return;

    try {
      const response = await fetch('/api/statistics/csm', {
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
        setCsmStatsData(data.statistics);
      } else {
        throw new Error('Format de données invalide');
      }
    } catch (err) {
      logger.error({ error: err }, 'Error fetching CSM statistics');
      // En cas d'erreur, on garde les valeurs par défaut (0)
    }
  }, [enabled, userId]);

  useEffect(() => {
    if (enabled && userId) {
      fetchCsmStats();
    }
  }, [enabled, userId, fetchCsmStats]);

  const stats = useMemo<CsmStats | null>(() => {
    if (!enabled || !userId) return null;

    // Utiliser les statistiques CSM si disponibles
    return {
      managedOrders: csmStatsData?.managedOrders || 0,
      assignedClients: csmStatsData?.assignedClients || 0,
      coordinatedProviders: csmStatsData?.coordinatedProviders || 0,
      satisfactionRate: csmStatsData?.satisfactionRate || 0,
      resolvedTickets: csmStatsData?.resolvedTickets || 0,
    };
  }, [enabled, userId, csmStatsData]);

  return stats;
}

