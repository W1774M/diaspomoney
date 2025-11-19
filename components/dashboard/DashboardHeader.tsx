"use client";

import { DashboardHeaderProps } from "@/types/dashboard";
import React from "react";

const DashboardHeader = React.memo<DashboardHeaderProps>(
  function DashboardHeader({
    userName,
    subtitle = "Bienvenue sur votre tableau de bord Diaspomoney",
  }) {
    return (
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour, {userName}
        </h1>
        <p className="text-gray-600 mt-2">{subtitle}</p>
      </div>
    );
  },
);

DashboardHeader.displayName = "DashboardHeader";

export default DashboardHeader;
