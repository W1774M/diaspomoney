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

  // Extract unique values from complaints
  const availableStatuses = useMemo(() => {
    return [...new Set(complaints.map(c => c.status))].sort();
  }, [complaints]);

  const availableTypes = useMemo(() => {
    return [...new Set(complaints.map(c => c.type))].sort();
  }, [complaints]);

  const availablePriorities = useMemo(() => {
    return [...new Set(complaints.map(c => c.priority))].sort();
  }, [complaints]);

  // Filter complaints based on current filters
  const filteredComplaints = useMemo(() => {
    return complaints.filter(complaint => {
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
  }, [complaints, filters]);

  const updateFilter = useCallback(
    (key: keyof ComplaintFilters, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    []
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
