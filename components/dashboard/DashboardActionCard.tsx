"use client";

import type { DashboardActionCardProps } from "@/lib/types";
import Link from "next/link";
import React from "react";

const DashboardActionCard = React.memo<DashboardActionCardProps>(
  function DashboardActionCard({
    title,
    description,
    href,
    icon: Icon,
    color,
  }) {
    const colorClasses: Record<"blue" | "orange" | "green" | "purple" | "red", string> = {
      blue: "bg-blue-100 text-blue-600",
      orange: "bg-orange-100 text-orange-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      red: "bg-red-100 text-red-600",
    };

    return (
      <Link
        href={href}
        className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
      </Link>
    );
  },
);

DashboardActionCard.displayName = "DashboardActionCard";

export default DashboardActionCard;
