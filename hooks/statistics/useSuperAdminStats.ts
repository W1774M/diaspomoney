'use client';

import { useMemo } from 'react';
import { usePlatformStatistics } from './usePlatformStatistics';

export interface SuperAdminStats {
  platformHealth: number;
  systemUptime: number;
  serverPerformance: number;
  totalRevenue: number;
  operatingCosts: number;
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
        platformHealth: 0,
        systemUptime: 0,
        serverPerformance: 0,
        totalRevenue: 0,
        operatingCosts: 0,
        loading: true,
      };
    }

    const { overview } = platformStats;
    const platformHealth =
      overview.totalUsers > 0
        ? Math.round(
            (overview.completedTransactions / Math.max(overview.totalTransactions, 1)) * 100,
          )
        : 0;
    const systemUptime =
      overview.totalTransactions > 0
        ? Math.round((overview.completedTransactions / overview.totalTransactions) * 100)
        : 0;
    const serverPerformance =
      overview.totalBookings > 0
        ? Math.round((overview.completedBookings / overview.totalBookings) * 100)
        : 0;

    return {
      platformHealth,
      systemUptime,
      serverPerformance,
      totalRevenue: overview.totalRevenue,
      operatingCosts: overview.totalRevenue * 0.1, // Estimation: 10% des revenus
      loading: false,
      overview,
      charts: platformStats.charts,
    };
  }, [enabled, platformStats, statsLoading]);

  return { stats, error: statsError, loading: statsLoading };
}

