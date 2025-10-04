"use client";

import { UserFilters } from "@/types/users";
import { useCallback, useMemo, useState } from "react";

export function useUserFilters(users: any[]) {
  const [filters, setFilters] = useState<UserFilters>({
    searchTerm: "",
    roleFilter: "ALL",
    statusFilter: "ALL",
  });

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        (user.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ??
          false) ||
        (user.email?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ??
          false) ||
        (user.company
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ??
          false);

      const matchesRole =
        filters.roleFilter === "ALL" ||
        (user.roles?.includes(filters.roleFilter) ?? false);

      const matchesStatus =
        filters.statusFilter === "ALL" || user.status === filters.statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, filters]);

  const updateFilter = useCallback((key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      roleFilter: "ALL",
      statusFilter: "ALL",
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm.length > 0 ||
      filters.roleFilter !== "ALL" ||
      filters.statusFilter !== "ALL"
    );
  }, [filters]);

  return {
    filters,
    filteredUsers,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}
