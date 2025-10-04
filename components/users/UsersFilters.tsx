"use client";

import { UsersFiltersProps } from "@/types/users";
import { Search } from "lucide-react";
import React, { useCallback } from "react";

const UsersFilters = React.memo<UsersFiltersProps>(function UsersFilters({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
}) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [setSearchTerm]
  );

  const handleRoleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setRoleFilter(e.target.value as any);
    },
    [setRoleFilter]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setStatusFilter(e.target.value as any);
    },
    [setStatusFilter]
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rechercher
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Nom, email, entreprise..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rôle
          </label>
          <select
            value={roleFilter}
            onChange={handleRoleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tous les rôles</option>
            <option value="ADMIN">Administrateur</option>
            <option value="PROVIDER">Prestataire</option>
            <option value="CUSTOMER">Client</option>
            <option value="CSM">CSM</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
            <option value="PENDING">En attente</option>
            <option value="SUSPENDED">Suspendu</option>
          </select>
        </div>
      </div>
    </div>
  );
});

UsersFilters.displayName = "UsersFilters";

export default UsersFilters;
