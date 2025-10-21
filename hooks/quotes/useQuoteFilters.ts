"use client";

import { QuoteFilters } from "@/types/quotes";
import { useCallback, useMemo, useState } from "react";

export function useQuoteFilters(quotes: any[]) {
  const [filters, setFilters] = useState<QuoteFilters>({
    searchTerm: "",
    statusFilter: "ALL",
    dateFilter: "",
  });

  // Sécurité : s'assurer que quotes est un tableau
  const safeQuotes = quotes || [];

  const filteredQuotes = useMemo(() => {
    return safeQuotes.filter(quote => {
      const matchesSearch =
        quote.number
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        quote.title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        quote.provider
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase());

      const matchesStatus =
        filters.statusFilter === "ALL" || quote.status === filters.statusFilter;

      const matchesDate =
        !filters.dateFilter ||
        new Date(quote.createdAt).toISOString().split("T")[0] ===
          filters.dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [safeQuotes, filters]);

  const updateFilter = useCallback((key: keyof QuoteFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      statusFilter: "ALL",
      dateFilter: "",
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm.length > 0 ||
      filters.statusFilter !== "ALL" ||
      filters.dateFilter.length > 0
    );
  }, [filters]);

  return {
    filters,
    filteredQuotes,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}
