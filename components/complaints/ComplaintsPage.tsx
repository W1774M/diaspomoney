"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useComplaintFilters, useComplaintStats } from "@/hooks/complaints";
import { Complaint } from "@/types/complaints";
import { useRouter } from "next/navigation";
import React, { useCallback, useState } from "react";
import ComplaintsFilters from "./ComplaintsFilters";
import ComplaintsHeader from "./ComplaintsHeader";
import ComplaintsSearch from "./ComplaintsSearch";
import ComplaintsStats from "./ComplaintsStats";
import ComplaintsTable from "./ComplaintsTable";

// Mock data pour les réclamations - à remplacer par des données réelles
const mockComplaints: Complaint[] = [
  {
    id: "1",
    number: "REC-2024-001",
    title: "Service non conforme aux attentes",
    type: "QUALITY",
    priority: "HIGH",
    status: "OPEN",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-16",
    description:
      "Le service fourni ne correspond pas à ce qui était convenu dans le devis.",
    provider: "Dr. Marie Dubois",
    appointmentId: "APT-001",
  },
  {
    id: "2",
    number: "REC-2024-002",
    title: "Retard important du prestataire",
    type: "DELAY",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-12",
    description: "Le prestataire a eu plus de 2h de retard sans prévenir.",
    provider: "Institut Éducatif Plus",
    appointmentId: "APT-002",
  },
  {
    id: "3",
    number: "REC-2024-003",
    title: "Problème de facturation",
    type: "BILLING",
    priority: "LOW",
    status: "RESOLVED",
    createdAt: "2024-01-05",
    updatedAt: "2024-01-08",
    description: "Facture incorrecte avec des montants erronés.",
    provider: "BTP Excellence",
    appointmentId: "APT-003",
  },
];

const ComplaintsPage = React.memo(function ComplaintsPage() {
  const { isCustomer } = useAuth();
  const router = useRouter();
  const [complaints] = useState(mockComplaints);

  const {
    filters,
    filteredComplaints,
    availableStatuses,
    availableTypes,
    availablePriorities,
    updateFilter,
    // clearFilters,
    hasActiveFilters,
  } = useComplaintFilters(complaints);

  const stats = useComplaintStats(complaints);

  const handleViewComplaint = useCallback(
    (complaint: Complaint) => {
      router.push(`/dashboard/complaints/${complaint.id}`);
    },
    [router],
  );

  const handleCommentComplaint = useCallback(
    (complaint: Complaint) => {
      router.push(`/dashboard/complaints/${complaint.id}#comments`);
    },
    [router],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      updateFilter("searchTerm", value);
    },
    [updateFilter],
  );

  // const handleStatusChange = useCallback(
  //   (value: string) => {
  //     updateFilter("status", value);
  //   },
  //   [updateFilter],
  // );

  // const handleTypeChange = useCallback(
  //   (value: string) => {
  //     updateFilter("type", value);
  //   },
  //   [updateFilter],
  // );

  // const handlePriorityChange = useCallback(
  //   (value: string) => {
  //     updateFilter("priority", value);
  //   },
  //   [updateFilter],
  // );

  if (!isCustomer()) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Accès non autorisé
          </h1>
          <p className="text-gray-600 mt-2">
            Vous n&apos;avez pas les permissions pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <ComplaintsHeader onNewComplaint={() => {}} />

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4">
        <ComplaintsSearch
          searchTerm={filters.searchTerm}
          setSearchTerm={handleSearchChange}
        />
        <ComplaintsFilters
          filters={filters}
          onFilterChange={(key, value) => updateFilter(key, value)}
          availableStatuses={availableStatuses}
          availableTypes={availableTypes}
          availablePriorities={availablePriorities}
        />
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {filteredComplaints.length} réclamation
          {filteredComplaints.length !== 1 ? "s" : ""} trouvé
          {filteredComplaints.length !== 1 ? "es" : ""}
        </h2>
        {hasActiveFilters && (
          <p className="text-sm text-gray-600">Filtres appliqués</p>
        )}
      </div>

      {/* Table */}
      <ComplaintsTable
        complaints={filteredComplaints}
        loading={false}
        error={null}
        onView={handleViewComplaint}
        onComment={handleCommentComplaint}
      />

      {/* Stats */}
      <ComplaintsStats stats={stats} />
    </div>
  );
});

ComplaintsPage.displayName = "ComplaintsPage";

export default ComplaintsPage;
