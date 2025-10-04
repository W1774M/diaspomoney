"use client";

import { DashboardServicesContentProps } from "@/types/dashboard-services";
import React from "react";

const DashboardServicesContent = React.memo<DashboardServicesContentProps>(
  function DashboardServicesContent({ activeTab: _activeTab, children }) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {children}
      </div>
    );
  },
);

DashboardServicesContent.displayName = "DashboardServicesContent";

export default DashboardServicesContent;
