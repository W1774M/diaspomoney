"use client";

import { ServiceStats } from "@/types/services";
import { Briefcase, CheckCircle, Star, Users } from "lucide-react";
import React from "react";

interface ServicesStatsProps {
  stats: ServiceStats;
}

const ServicesStats = React.memo<ServicesStatsProps>(function ServicesStats({
  stats,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">
              Total Prestataires
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalProviders}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Actifs</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.activeProviders}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Briefcase className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Spécialités</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.specialties.length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Star className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Services</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.services.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

ServicesStats.displayName = "ServicesStats";

export default ServicesStats;
