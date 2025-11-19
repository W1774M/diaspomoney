"use client";

import type { DashboardServicesTabsProps } from "@/lib/types";
import React from "react";

const DashboardServicesTabs = React.memo<DashboardServicesTabsProps>(
  function DashboardServicesTabs({
    tabs,
    activeTab,
    onTabChange: _onTabChange,
  }) {
    return (
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => _onTabChange(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>
    );
  },
);

DashboardServicesTabs.displayName = "DashboardServicesTabs";

export default DashboardServicesTabs;
