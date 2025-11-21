"use client";

import { useBookings, useInvoices, useUsers } from "@/hooks";
import { ROLES } from "@/lib/constants";
import type { DashboardStats } from "@/lib/types";
import { useMemo } from "react";

interface UseDashboardStatsProps {
  userId?: string;
  isAdmin: boolean;
  isCSM: boolean;
}

export function useDashboardStats({
  userId,
  isAdmin,
  isCSM,
}: UseDashboardStatsProps): DashboardStats {
  const { users = [], total: totalUsers } = useUsers({ limit: 100 }); // Maximum autorisé par l'API
  const { bookings = [], total: totalBookings } = useBookings({
    limit: 100, // Maximum autorisé par l'API
  });
  const { total: totalInvoices } = useInvoices({
    limit: 100, // Maximum autorisé par l'API
    userId: userId || undefined,
    isAdmin,
    isProvider: false,
    isCustomer: false,
  });

  return useMemo(() => {
    if (isAdmin || isCSM) {
      return {
        users: totalUsers,
        customers: (users || []).filter(u => u.roles.includes(ROLES.CUSTOMER)).length,
        providers: (users || []).filter(
          u =>
            u.roles.includes(ROLES.PROVIDER),
        ).length,
        bookings: totalBookings,
        invoices: totalInvoices,
      };
    }

    // Pour les utilisateurs non-admin
    return {
      bookings: (bookings || []).filter(a => a.userId === userId).length,
      invoices: totalInvoices,
    };
  }, [
    users,
    totalUsers,
    bookings,
    totalBookings,
    totalInvoices,
    userId,
    isAdmin,
    isCSM,
  ]);
}
