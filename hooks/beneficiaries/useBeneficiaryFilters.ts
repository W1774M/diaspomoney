"use client";

import { Beneficiary, BeneficiaryFilters } from "@/types/beneficiaries";
import { useCallback, useMemo, useState } from "react";

export function useBeneficiaryFilters(beneficiaries: Beneficiary[]) {
  const [filters, setFilters] = useState<BeneficiaryFilters>({
    searchTerm: "",
    relationship: "",
    hasAccount: "",
  });

  // Sécurité : s'assurer que beneficiaries est un tableau
  const safeBeneficiaries = beneficiaries || [];

  // Extract unique relationships from beneficiaries
  const availableRelationships = useMemo(() => {
    return [
      ...new Set(safeBeneficiaries.map(b => b.relationship).filter(Boolean)),
    ].sort();
  }, [safeBeneficiaries]);

  // Filter beneficiaries based on current filters
  const filteredBeneficiaries = useMemo(() => {
    return safeBeneficiaries.filter(beneficiary => {
      // Search term filter
      if (
        filters.searchTerm &&
        !beneficiary.name
          ?.toLowerCase()
          ?.includes(filters.searchTerm.toLowerCase()) &&
        !beneficiary.email
          ?.toLowerCase()
          ?.includes(filters.searchTerm.toLowerCase()) &&
        !beneficiary.phone?.includes(filters.searchTerm)
      ) {
        return false;
      }

      // Relationship filter
      if (
        filters.relationship &&
        beneficiary.relationship !== filters.relationship
      ) {
        return false;
      }

      // Account status filter
      if (filters.hasAccount === "with" && !beneficiary.hasAccount) {
        return false;
      }
      if (filters.hasAccount === "without" && beneficiary.hasAccount) {
        return false;
      }

      return true;
    });
  }, [safeBeneficiaries, filters]);

  const updateFilter = useCallback(
    (key: keyof BeneficiaryFilters, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      relationship: "",
      hasAccount: "",
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm.length > 0 ||
      filters.relationship.length > 0 ||
      filters.hasAccount.length > 0
    );
  }, [filters]);

  return {
    filters,
    filteredBeneficiaries,
    availableRelationships,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}
