'use client';

import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/lib/constants';

interface PlatformStatistics {
  overview: {
    totalUsers: number;
    totalCustomers: number;
    totalProviders: number;
    totalAdmins: number;
    newUsersThisMonth: number;
    totalBookings: number;
    completedBookings: number;
    totalTransactions: number;
    completedTransactions: number;
    totalRevenue: number;
    revenueThisMonth: number;
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
  };
  charts: {
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

interface UsePlatformStatisticsReturn {
  statistics: PlatformStatistics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePlatformStatistics(): UsePlatformStatisticsReturn {
  const [statistics, setStatistics] = useState<PlatformStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/statistics/platform', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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
      console.error('Error fetching platform statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
}

