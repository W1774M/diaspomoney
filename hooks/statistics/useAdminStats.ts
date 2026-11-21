'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { BOOKING_STATUSES } from '@/lib/constants';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';
import { logger } from '@/lib/logger';

export interface AdminStats {
  totalUsers: {
    all: number;
    customers: number;
    providers: number;
    csm: number;
  };
  todayTransactions: number;
  monthlyTransactions: number;
  platformRevenue: number;
  newRegistrations: number;
  openSupportTickets: number;
  // Statistiques de commandes
  activeOrders: number;
  completedOrders: number;
  totalAmountSpent: number;
}

interface UseAdminStatsParams {
  enabled: boolean;
}

interface AdminStatsData {
  totalUsers: { all: number; customers: number; providers: number; csm: number };
  todayTransactions: number;
  monthlyTransactions: number;
  platformRevenue: number;
  newRegistrations: number;
  openSupportTickets: number;
}

export function useAdminStats({ enabled }: UseAdminStatsParams) {
  // Récupérer toutes les commandes (sans filtre userId pour l'admin)
  const { bookings = [] } = useBookings({
    limit: 1000, // Limite élevée pour récupérer toutes les commandes
  });

  // État pour les statistiques admin
  const [adminStatsData, setAdminStatsData] = useState<AdminStatsData | null>(null);

  // Récupérer les statistiques admin depuis l'API
  const fetchAdminStats = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await fetch('/api/statistics/admin', {
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
        setAdminStatsData(data.statistics);
      } else {
        throw new Error('Format de données invalide');
      }
    } catch (err) {
      logger.error({ error: err }, 'Error fetching admin statistics');
      // En cas d'erreur, on garde les valeurs par défaut (0)
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      fetchAdminStats();
    }
  }, [enabled, fetchAdminStats]);

  const stats = useMemo<AdminStats | null>(() => {
    if (!enabled) return null;

    // Calculer les statistiques de commandes
    const activeBookings = bookings.filter(
      (b: BookingResponse) =>
        b.status === BOOKING_STATUSES.PENDING || b.status === BOOKING_STATUSES.CONFIRMED,
    );
    const completedBookings = bookings.filter(
      (b: BookingResponse) => b.status === BOOKING_STATUSES.FINISHED,
    );
    const totalAmountSpent = completedBookings.reduce(
      (sum: number, b: BookingResponse) => sum + ((b as any).price || (b as any).totalAmount || 0),
      0,
    );

    // Utiliser les statistiques admin si disponibles
    return {
      totalUsers: adminStatsData?.totalUsers || { all: 0, customers: 0, providers: 0, csm: 0 },
      todayTransactions: adminStatsData?.todayTransactions || 0,
      monthlyTransactions: adminStatsData?.monthlyTransactions || 0,
      platformRevenue: adminStatsData?.platformRevenue || 0,
      newRegistrations: adminStatsData?.newRegistrations || 0,
      openSupportTickets: adminStatsData?.openSupportTickets || 0,
      activeOrders: activeBookings.length,
      completedOrders: completedBookings.length,
      totalAmountSpent,
    };
  }, [enabled, bookings, adminStatsData]);

  return stats;
}

