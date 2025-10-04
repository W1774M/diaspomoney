"use client";

import { DashboardQuickActionsProps } from "@/types/dashboard";
import { Calendar, FileText, Users } from "lucide-react";
import React from "react";
import DashboardActionCard from "./DashboardActionCard";

const DashboardQuickActions = React.memo<DashboardQuickActionsProps>(
  function DashboardQuickActions({ isAdmin, isCSM }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardActionCard
          title="Gérer les rendez-vous"
          description="Consulter et organiser vos rendez-vous"
          href="/dashboard/appointments"
          icon={Calendar as any}
          color="blue"
        />

        <DashboardActionCard
          title="Factures"
          description="Consulter et gérer vos factures"
          href="/dashboard/invoices"
          icon={FileText as any}
          color="green"
        />

        {(isAdmin || isCSM) && (
          <DashboardActionCard
            title="Gérer les utilisateurs"
            description="Consulter et gérer les utilisateurs"
            href="/dashboard/users"
            icon={Users as any}
            color="purple"
          />
        )}
      </div>
    );
  },
);

DashboardQuickActions.displayName = "DashboardQuickActions";

export default DashboardQuickActions;
