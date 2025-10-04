"use client";

import { ComplaintStats } from "@/types/complaints";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import React from "react";

interface ComplaintsStatsProps {
  stats: ComplaintStats;
}

const ComplaintsStats = React.memo<ComplaintsStatsProps>(
  function ComplaintsStats({ stats }) {
    return (
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total réclamations
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalComplaints}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ouvertes</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.openComplaints}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.inProgressComplaints}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Résolues</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.resolvedComplaints}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ComplaintsStats.displayName = "ComplaintsStats";

export default ComplaintsStats;
