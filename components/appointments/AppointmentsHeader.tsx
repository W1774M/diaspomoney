"use client";

import { AppointmentsHeaderProps } from "@/types/appointments";
import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

const AppointmentsHeader = React.memo<AppointmentsHeaderProps>(
  function AppointmentsHeader({ onNewAppointment: _onNewAppointment }) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rendez-vous</h1>
            <p className="mt-2 text-gray-600">
              Gérez vos rendez-vous et suivez leur statut
            </p>
          </div>
          <Link
            href="/dashboard/appointments/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau rendez-vous
          </Link>
        </div>
      </div>
    );
  },
);

AppointmentsHeader.displayName = "AppointmentsHeader";

export default AppointmentsHeader;
