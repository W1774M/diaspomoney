"use client";

import { useAppointments, useUsers } from "@/hooks";
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
  const { appointments = [], total: totalAppointments } = useAppointments({
    limit: 1000,
  });

  return useMemo(() => {
    if (isAdmin || isCSM) {
      return {
        users: totalUsers,
        customers: users.filter(u => u.roles.includes("CUSTOMER")).length,
        providers: users.filter(u => u.roles.includes("PROVIDER")).length,
        appointments: totalAppointments,
        invoices: 42, // TODO: Implémenter useInvoices hook
      };
    } else {
      return {
        appointments: appointments.filter(a => a.userId === userId).length,
        invoices: 5, // TODO: Implémenter useInvoices hook
      };
    }
  }, [
    users,
    totalUsers,
    appointments,
    totalAppointments,
    userId,
    isAdmin,
    isCSM,
  ]);
}
