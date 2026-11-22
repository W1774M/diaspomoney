"use client";

import Link from 'next/link';
import type { ComplaintsHeaderProps } from "@/lib/types";
import { Plus } from "lucide-react";
import React from "react";

const ComplaintsHeader = React.memo<ComplaintsHeaderProps>(
  function ComplaintsHeader({ onNewComplaint: _onNewComplaint }) {

    return (
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réclamations</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos réclamations et signalements
          </p>
        </div>
        <Link
          href={"/dashboard/complaints/new"}
          className="bg-brand-600 hover:bg-brand-700/90 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle réclamation
        </Link>
      </div>
    );
  },
);

ComplaintsHeader.displayName = "ComplaintsHeader";

export default ComplaintsHeader;
