'use client';

import { useMemo, useEffect } from 'react';
import { useStatistics } from '@/hooks/statistics/useStatistics';

interface FavoriteProvider {
  id: string;
  name: string;
  rating: number;
  count: number;
}

export interface CustomerStats {
  totalBookings: number;
  activeOrders: number;
  completedOrders: number;
  totalSpent: number;
  favoriteProviders: FavoriteProvider[];
}

interface UseCustomerStatsParams {
  userId?: string;
  enabled: boolean;
}

export function useCustomerStats({ userId, enabled }: UseCustomerStatsParams) {
  const { statistics, loading, fetchStatistics } = useStatistics();

  // Charger les statistiques si nécessaire
  useEffect(() => {
    if (enabled && userId && !statistics && !loading) {
      fetchStatistics();
    }
  }, [enabled, userId, statistics, loading, fetchStatistics]);

  const stats = useMemo<CustomerStats | null>(() => {
    if (!enabled || !userId) return null;
    
    // Utiliser les données de l'API statistics si disponibles
    if (statistics) {
      const favoriteProviders = (statistics.providers?.favorites || []).slice(0, 3).map((p) => ({
        id: p.providerId,
        name: p.providerName,
        rating: p.rating || 0,
        count: p.orderCount || 0,
      }));

      return {
        totalBookings: statistics.bookings?.total || 0,
        activeOrders: statistics.bookings?.active || 0,
        completedOrders: statistics.bookings?.completed || 0,
        totalSpent: statistics.bookings?.totalSpent || 0,
        averageBasketValue: statistics.bookings?.averageBasketValue || 0,
        favoriteProviders,
      };
    }

    // Fallback si les statistiques ne sont pas encore chargées
    return {
      totalBookings: 0,
      activeOrders: 0,
      completedOrders: 0,
      totalSpent: 0,
      averageBasketValue: 0,
      favoriteProviders: [],
    };
  }, [statistics, userId, enabled]);

  return stats;
}

