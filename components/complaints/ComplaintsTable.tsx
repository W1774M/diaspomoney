"use client";

import { ComplaintsTableProps } from "@/types/complaints";
import { AlertTriangle, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import ComplaintCard from "./ComplaintCard";

const ComplaintsTable = React.memo<ComplaintsTableProps>(
  function ComplaintsTable({ complaints, loading, error, onView, onComment }) {
    const router = useRouter();

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(25,100%,53%)]" />
          <span className="ml-2 text-gray-600">
            Chargement des réclamations...
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[hsl(25,100%,53%)] text-white px-4 py-2 rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    if (complaints.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune réclamation trouvée
          </h3>
          <p className="text-gray-600 mb-4">
            Vous n&apos;avez pas encore de réclamations.
          </p>
          <button
            onClick={() => router.push("/dashboard/complaints/new")}
            className="bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/90 text-white px-4 py-2 rounded-lg flex items-center mx-auto transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer votre première réclamation
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {complaints.map(complaint => (
          <ComplaintCard
            key={complaint.id}
            complaint={complaint}
            onView={onView}
            onComment={onComment}
          />
        ))}
      </div>
    );
  }
);

ComplaintsTable.displayName = "ComplaintsTable";

export default ComplaintsTable;
