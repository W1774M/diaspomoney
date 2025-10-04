"use client";

import { InvoiceFilters } from "@/types/invoices";
import { useCallback, useMemo, useState } from "react";

export function useInvoiceFilters(invoices: any[]) {
  const [filters, setFilters] = useState<InvoiceFilters>({
    searchTerm: "",
    statusFilter: "ALL",
    dateFilter: "",
  });

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch =
        invoice.invoiceNumber
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        invoice.customerId
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        invoice.providerId
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase());

      const matchesStatus =
        filters.statusFilter === "ALL" ||
        invoice.status === filters.statusFilter;

      const matchesDate =
        !filters.dateFilter ||
        new Date(invoice.issueDate).toISOString().split("T")[0] ===
          filters.dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [invoices, filters]);

  const updateFilter = useCallback(
    (key: keyof InvoiceFilters, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    []
  );

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
    filteredInvoices,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}
