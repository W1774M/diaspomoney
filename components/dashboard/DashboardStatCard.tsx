"use client";

import { DashboardStatCardProps } from "@/types/dashboard";
import React from "react";

const DashboardStatCard = React.memo<DashboardStatCardProps>(
  function DashboardStatCard({
    title,
    value,
    icon: Icon,
    color: _color,
    description,
  }) {
    const colorClasses = {
      blue: "bg-blue-100 text-blue-600",
      orange: "bg-orange-100 text-orange-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      red: "bg-red-100 text-red-600",
    };

    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${colorClasses[_color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>
    );
  },
);

DashboardStatCard.displayName = "DashboardStatCard";

export default DashboardStatCard;
