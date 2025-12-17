'use client';

import { useMemo } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { BOOKING_STATUSES } from '@/lib/constants';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

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

export function useAdminStats({ enabled }: UseAdminStatsParams) {
  // Récupérer toutes les commandes (sans filtre userId pour l'admin)
  const { bookings = [] } = useBookings({
    limit: 1000, // Limite élevée pour récupérer toutes les commandes
  });

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

    // TODO: À remplacer par vraies données depuis l'API pour les autres statistiques
    return {
      totalUsers: { all: 0, customers: 0, providers: 0, csm: 0 },
      todayTransactions: 0,
      monthlyTransactions: 0,
      platformRevenue: 0,
      newRegistrations: 0,
      openSupportTickets: 0,
      activeOrders: activeBookings.length,
      completedOrders: completedBookings.length,
      totalAmountSpent,
    };
  }, [enabled, bookings]);

  return stats;
}

