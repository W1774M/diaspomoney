"use client";

import { DashboardStatsProps } from "@/types/dashboard";
import { Calendar, FileText, Users } from "lucide-react";
import React from "react";
import DashboardStatCard from "./DashboardStatCard";

const DashboardStats = React.memo<DashboardStatsProps>(function DashboardStats({
  stats,
  isAdmin,
  isCSM,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {(isAdmin || isCSM) && (
        <DashboardStatCard
          title="Utilisateurs"
          value={stats.users || 0}
          icon={Users as any}
          color="blue"
        />
      )}

      <DashboardStatCard
        title={isAdmin || isCSM ? "Tous les rendez-vous" : "Mes rendez-vous"}
        value={stats.appointments}
        icon={Calendar as any}
        color="orange"
      />

      <DashboardStatCard
        title={isAdmin || isCSM ? "Toutes les factures" : "Mes factures"}
        value={stats.invoices}
        icon={FileText as any}
        color="green"
      />
    </div>
  );
});

DashboardStats.displayName = "DashboardStats";

export default DashboardStats;
