"use client";

import { useAuth } from "@/hooks";
import { useDashboardStats } from "@/hooks/dashboard";
import React from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardQuickActions from "./DashboardQuickActions";
import DashboardStats from "./DashboardStats";

const DashboardPage = React.memo(function DashboardPage() {
  const { user, isAdmin, isCSM } = useAuth();

  const stats = useDashboardStats({
    userId: user?.id || "",
    isAdmin: isAdmin(),
    isCSM: isCSM(),
  });

  return (
    <>
      <DashboardHeader userName={user?.name || "Utilisateur"} />
      <DashboardStats stats={stats} isAdmin={isAdmin()} isCSM={isCSM()} />
      <DashboardQuickActions isAdmin={isAdmin()} isCSM={isCSM()} />
    </>
  );
});

DashboardPage.displayName = "DashboardPage";

export default DashboardPage;
