"use client";

import { useBeneficiaryFilters } from "@/hooks/beneficiaries";
import { useBeneficiaries } from "@/hooks/beneficiaries/useBeneficiaries";
import { Beneficiary, BeneficiaryFormData, CreateBeneficiaryData } from "@/lib/types";
import React, { useCallback, useState } from "react";
import BeneficiariesFilters from "./BeneficiariesFilters";
import BeneficiariesHeader from "./BeneficiariesHeader";
import BeneficiariesSearch from "./BeneficiariesSearch";
import BeneficiariesTable from "./BeneficiariesTable";
import BeneficiaryForm from "./BeneficiaryForm";

const BeneficiariesPage = React.memo(function BeneficiariesPage() {
  const {
    beneficiaries,
    loading,
    error,
    createBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
  } = useBeneficiaries();

  const {
    filters,
    filteredBeneficiaries,
    availableRelationships,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  } = useBeneficiaryFilters(beneficiaries);

  // const stats = useBeneficiaryStats(beneficiaries);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] =
    useState<Beneficiary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddBeneficiary = useCallback(() => {
    setShowAddForm(true);
    setEditingBeneficiary(null);
  }, []);

  const handleEditBeneficiary = useCallback((beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setShowAddForm(false);
  }, []);

  const handleDeleteBeneficiary = useCallback(
    async (id: string) => {
      if (confirm("Êtes-vous sûr de vouloir supprimer ce bénéficiaire ?")) {
        await deleteBeneficiary(id);
      }
    },
    [deleteBeneficiary],
  );

  const handleFormSubmit = useCallback(
    async (formData: BeneficiaryFormData) => {
      setIsSubmitting(true);
      try {
        if (editingBeneficiary) {
          const beneficiaryId = editingBeneficiary._id || editingBeneficiary.id;
          if (!beneficiaryId) {
            console.error("ID de bénéficiaire manquant");
            return;
          }
          const result = await updateBeneficiary(
            beneficiaryId,
            formData,
          );
          if (result) {
            setEditingBeneficiary(null);
          }
        } else {
          const { firstName, lastName, country, relationship, email, phone } = formData;
          const beneficiaryData: CreateBeneficiaryData = {
            name: `${firstName || ''} ${lastName || ''}`.trim() || 'Bénéficiaire',
            firstName: firstName ?? "",
            lastName: lastName ?? "",
            country: country ?? "",
            relationship: relationship ?? "OTHER",
          };
          // Ajouter email et phone seulement s'ils sont définis
          if (email) {
            beneficiaryData.email = email;
          }
          if (phone) {
            beneficiaryData.phone = phone;
          }
          const result = await createBeneficiary(beneficiaryData);
          if (result) {
            setShowAddForm(false);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la soumission:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingBeneficiary, createBeneficiary, updateBeneficiary],
  );

  const handleFormCancel = useCallback(() => {
    setShowAddForm(false);
    setEditingBeneficiary(null);
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      updateFilter("searchTerm", value);
    },
    [updateFilter],
  );

  // const handleRelationshipChange = useCallback(
  //   (value: string) => {
  //     updateFilter("relationship", value);
  //   },
  //   [updateFilter]
  // );

  // const handleAccountStatusChange = useCallback(
  //   (value: string) => {
  //     updateFilter("hasAccount", value);
  //   },
  //   [updateFilter]
  // );

  return (
    <div className="space-y-6">
      {/* Header */}
      <BeneficiariesHeader onAddBeneficiary={handleAddBeneficiary} />

      {/* Search */}
      <BeneficiariesSearch
        searchTerm={filters.searchTerm ?? ""}
        setSearchTerm={handleSearchChange}
      />

      {/* Filters */}
      <BeneficiariesFilters
        filters={filters}
        onFilterChange={(key, value) => updateFilter(key, value)}
        availableRelationships={availableRelationships}
      />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {filteredBeneficiaries.length} bénéficiaire
          {filteredBeneficiaries.length !== 1 ? "s" : ""} trouvé
          {filteredBeneficiaries.length !== 1 ? "s" : ""}
        </h2>

        {hasActiveFilters && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Filtres appliqués</span>
            <button
              onClick={clearFilters}
              className="text-sm text-[hsl(25,100%,53%)] hover:text-[hsl(25,100%,48%)] transition-colors"
            >
              Effacer
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <BeneficiariesTable
        beneficiaries={filteredBeneficiaries}
        loading={loading}
        error={error}
        onEdit={handleEditBeneficiary as (beneficiary: Beneficiary) => void}
        onDelete={handleDeleteBeneficiary}
      />

      {/* Form Modal */}
      {(showAddForm || editingBeneficiary) && (
        <BeneficiaryForm
          beneficiary={editingBeneficiary ?? (undefined as any)}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
});

BeneficiariesPage.displayName = "BeneficiariesPage";

export default BeneficiariesPage;
