'use client';

import { useMemo } from 'react';
import { usePlatformStatistics } from './usePlatformStatistics';

export interface SuperAdminStats {
  /** Paiements encaissés (transactions + réservations au paiement confirmé) */
  totalPayments: number;
  totalRevenue: number;
  loading: boolean;
  overview?: {
    totalUsers: number;
    totalCustomers: number;
    totalProviders: number;
    totalBookings: number;
    completedBookings: number;
    totalTransactions: number;
    completedTransactions: number;
    revenueThisMonth: number;
    newUsersThisMonth: number;
  };
  charts?: {
    monthlyData: Array<{
      month: string;
      revenue: number;
      transactions: number;
      bookings: number;
      newUsers: number;
    }>;
    usersByRole: {
      customers: number;
      providers: number;
      admins: number;
      others: number;
    };
    bookingsByStatus: {
      completed: number;
      pending: number;
      cancelled: number;
      others: number;
    };
    topServices: Array<{
      name: string;
      count: number;
    }>;
  };
}

interface UseSuperAdminStatsParams {
  enabled: boolean;
}

export function useSuperAdminStats({ enabled }: UseSuperAdminStatsParams) {
  const { statistics: platformStats, loading: statsLoading, error: statsError } =
    usePlatformStatistics();

  const stats = useMemo<SuperAdminStats | null>(() => {
    if (!enabled) return null;

    if (statsLoading || !platformStats) {
      return {
        totalPayments: 0,
        totalRevenue: 0,
        loading: true,
      };
    }

    const { overview } = platformStats;
    // Santé, uptime et performance étaient des ratios de transactions présentés
    // comme des métriques système (0 % en prod) : retirés. Les métriques serveur
    // vivent dans /dashboard/superadmin (endpoint santé) et le monitoring.
    return {
      totalPayments: overview.totalPayments ?? 0,
      totalRevenue: overview.totalRevenue,
      loading: false,
      overview,
      charts: platformStats.charts,
    };
  }, [enabled, platformStats, statsLoading]);

  return { stats, error: statsError, loading: statsLoading };
}

