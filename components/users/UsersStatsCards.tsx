/**
 * UsersStatsCards - Cartes de statistiques pour la page Users
 * Inspiré de l'interface moderne avec statistiques clés
 */
"use client";

import { Users, FileText, Lock, TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface UsersStatsCardsProps {
  totalUsers: number;
  usersToday?: number;
  restRequests?: number;
  authRequests?: number;
  previousMonthUsers?: number;
}

export default function UsersStatsCards({
  totalUsers,
  usersToday = 0,
  restRequests = 0,
  authRequests = 0,
  previousMonthUsers = 0,
}: UsersStatsCardsProps) {
  const percentageChange = useMemo(() => {
    if (!previousMonthUsers || previousMonthUsers === 0) return 0;
    const change = ((totalUsers - previousMonthUsers) / previousMonthUsers) * 100;
    return Math.round(change * 10) / 10; // Arrondir à 1 décimale
  }, [totalUsers, previousMonthUsers]);

  const stats = [
    {
      label: "Total Users",
      value: totalUsers.toLocaleString('fr-FR'),
      icon: Users,
      change: percentageChange > 0 ? `+${percentageChange}%` : `${percentageChange}%`,
      changeLabel: "from last month",
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      label: "Users Today",
      value: usersToday.toLocaleString('fr-FR'),
      icon: Users,
      change: null,
      changeLabel: null,
      iconColor: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      label: "REST Requests",
      value: restRequests.toLocaleString('fr-FR'),
      icon: FileText,
      change: null,
      changeLabel: null,
      iconColor: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      label: "Auth Requests",
      value: authRequests.toLocaleString('fr-FR'),
      icon: Lock,
      change: null,
      changeLabel: null,
      iconColor: "text-orange-500",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.change && stat.changeLabel && (
                <div className="flex items-center mt-2">
                  <TrendingUp
                    className={`h-4 w-4 mr-1 ${
                      percentageChange >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      percentageChange >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change} {stat.changeLabel}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

