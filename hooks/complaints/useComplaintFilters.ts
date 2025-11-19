"use client";

import { Complaint, ComplaintFilters } from "@/types/complaints";
import { useCallback, useMemo, useState } from "react";

export function useComplaintFilters(complaints: Complaint[]) {
  const [filters, setFilters] = useState<ComplaintFilters>({
    searchTerm: "",
    status: "all",
    type: "all",
    priority: "all",
  });

  // Sécurité : s'assurer que complaints est un tableau
  const safeComplaints = complaints || [];

  // Extract unique values from complaints
  const availableStatuses = useMemo(() => {
    return [...new Set(safeComplaints.map(c => c.status))].sort();
  }, [safeComplaints]);

  const availableTypes = useMemo(() => {
    return [...new Set(safeComplaints.map(c => c.type))].sort();
  }, [safeComplaints]);

  const availablePriorities = useMemo(() => {
    return [...new Set(safeComplaints.map(c => c.priority))].sort();
  }, [safeComplaints]);

  // Filter complaints based on current filters
  const filteredComplaints = useMemo(() => {
    return safeComplaints.filter(complaint => {
      // Search term filter
      if (
        filters.searchTerm &&
        !complaint.title
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) &&
        !complaint.description
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) &&
        !complaint.provider
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) &&
        !complaint.number
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (filters.status !== "all" && complaint.status !== filters.status) {
        return false;
      }

      // Type filter
      if (filters.type !== "all" && complaint.type !== filters.type) {
        return false;
      }

      // Priority filter
      if (
        filters.priority !== "all" &&
        complaint.priority !== filters.priority
      ) {
        return false;
      }

      return true;
    });
  }, [safeComplaints, filters]);

  const updateFilter = useCallback(
    (key: keyof ComplaintFilters, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      status: "all",
      type: "all",
      priority: "all",
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm.length > 0 ||
      filters.status !== "all" ||
      filters.type !== "all" ||
      filters.priority !== "all"
    );
  }, [filters]);

  return {
    filters,
    filteredComplaints,
    availableStatuses,
    availableTypes,
    availablePriorities,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}
