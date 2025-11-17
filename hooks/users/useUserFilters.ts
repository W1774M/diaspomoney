'use client';

/**
 * Custom Hook pour filtrer les utilisateurs localement
 * Implémente le Custom Hooks Pattern
 */

import { IUser, UserRole } from '@/types';
import { useCallback, useMemo, useState } from 'react';

export interface UserFilters {
  searchTerm?: string;
  roleFilter?: 'ADMIN' | 'PROVIDER' | 'CUSTOMER' | 'CSM' | 'ALL';
  statusFilter?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'ALL';
}

/**
 * Custom Hook pour gérer le filtrage des utilisateurs
 * Implémente le Custom Hooks Pattern
 */
export function useUserFilters(users: IUser[]) {
  const [filters, setFilters] = useState<UserFilters>({
    searchTerm: '',
    roleFilter: 'ALL',
    statusFilter: 'ALL',
  });

  const updateFilter = useCallback(
    <K extends keyof UserFilters>(key: K, value: UserFilters[K]) => {
      setFilters(prev => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      roleFilter: 'ALL',
      statusFilter: 'ALL',
    });
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Filtre par recherche (nom, email, entreprise)
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.company?.toLowerCase().includes(searchLower) ||
          false;

        if (!matchesSearch) {
          return false;
        }
      }

      // Filtre par rôle
      if (filters.roleFilter && filters.roleFilter !== 'ALL') {
        if (!user.roles?.includes(filters.roleFilter as UserRole)) {
          return false;
        }
      }

      // Filtre par statut
      if (filters.statusFilter && filters.statusFilter !== 'ALL') {
        if (user.status !== filters.statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [users, filters]);

  const hasActiveFilters = useMemo(() => {
    return (
      (filters.searchTerm && filters.searchTerm.length > 0) ||
      (filters.roleFilter && filters.roleFilter !== 'ALL') ||
      (filters.statusFilter && filters.statusFilter !== 'ALL')
    );
  }, [filters]);

  return {
    filteredUsers,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    filters,
  };
}
