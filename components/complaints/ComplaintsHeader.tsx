"use client";

import { ComplaintsHeaderProps } from "@/types/complaints";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

const ComplaintsHeader = React.memo<ComplaintsHeaderProps>(
  function ComplaintsHeader({ onNewComplaint: _onNewComplaint }) {
    const router = useRouter();

    return (
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réclamations</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos réclamations et signalements
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/complaints/new")}
          className="bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/90 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle réclamation
        </button>
      </div>
    );
  }
);

ComplaintsHeader.displayName = "ComplaintsHeader";

export default ComplaintsHeader;
