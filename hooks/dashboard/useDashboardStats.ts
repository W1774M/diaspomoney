"use client";

import { useBookings, useInvoices, useUsers } from "@/hooks";
import { DashboardStats } from "@/types/dashboard";
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
  const { users = [], total: totalUsers } = useUsers({ limit: 1000 });
  const { bookings = [], total: totalBookings } = useBookings({
    limit: 1000,
  });
  const { total: totalInvoices } = useInvoices({
    limit: 1000,
    userId: userId || undefined,
    isAdmin,
    isProvider: false,
    isCustomer: false,
  });

  return useMemo(() => {
    if (isAdmin || isCSM) {
      return {
        users: totalUsers,
        customers: (users || []).filter(u => u.roles.includes("CUSTOMER")).length,
        providers: (users || []).filter(
          u =>
            u.roles.includes("{PROVIDER:INSTITUTION}") ||
            u.roles.includes("{PROVIDER:INDIVIDUAL}"),
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
