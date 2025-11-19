"use client";

import type { DashboardServicesHeaderProps } from "@/lib/types";
import React from "react";

const DashboardServicesHeader = React.memo<DashboardServicesHeaderProps>(
  function DashboardServicesHeader({ title, description }: DashboardServicesHeaderProps) {
    return (
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-2">{description}</p>
      </div>
    );
  },
);

DashboardServicesHeader.displayName = "DashboardServicesHeader";

export default DashboardServicesHeader;
