"use client";

import { useAuth, useUsers } from "@/hooks";
import { useUserFilters } from "@/hooks/users";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import UsersFilters from "./UsersFilters";
import UsersHeader from "./UsersHeader";
import UsersTable from "./UsersTable";

const UsersPage = React.memo(function UsersPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "ADMIN" | "PROVIDER" | "CUSTOMER" | "CSM" | "ALL"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED" | "ALL"
  >("ALL");

  const { users = [], loading } = useUsers({
    role: roleFilter !== "ALL" ? roleFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    limit: 1000,
  });

  const [localUsers, setLocalUsers] = useState(users);

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  const { filteredUsers, updateFilter, clearFilters, hasActiveFilters } =
    useUserFilters(localUsers);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      setLocalUsers(prev => prev.filter(user => user._id !== id));
    }
  }, []);

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/dashboard/users/${id}/edit`);
    },
    [router]
  );

  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/users/${id}`);
    },
    [router]
  );

  const handleSendEmail = useCallback((user: any) => {
    if (user.email) {
      window.open(`mailto:${user.email}`);
    }
  }, []);

  const handleCall = useCallback((user: any) => {
    if (user.phone) {
      window.open(`tel:${user.phone}`);
    }
  }, []);

  const handleAddUser = useCallback(() => {
    router.push("/dashboard/users/new");
  }, [router]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      updateFilter("searchTerm", value);
    },
    [updateFilter]
  );

  const handleRoleChange = useCallback(
    (value: "ADMIN" | "PROVIDER" | "CUSTOMER" | "CSM" | "ALL") => {
      setRoleFilter(value);
      updateFilter("roleFilter", value);
    },
    [updateFilter]
  );

  const handleStatusChange = useCallback(
    (value: "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED" | "ALL") => {
      setStatusFilter(value);
      updateFilter("statusFilter", value);
    },
    [updateFilter]
  );

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Accès non autorisé
        </h1>
        <p className="text-gray-600">
          Vous n&apos;avez pas les permissions pour accéder à cette page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UsersHeader
        totalUsers={filteredUsers.length}
        onAddUser={handleAddUser}
      />

      <UsersFilters
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        roleFilter={roleFilter}
        setRoleFilter={handleRoleChange}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusChange}
      />

      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Effacer tous les filtres
          </button>
        </div>
      )}

      <UsersTable
        users={filteredUsers}
        loading={loading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onView={handleView}
        onSendEmail={handleSendEmail}
        onCall={handleCall}
      />
    </div>
  );
});

UsersPage.displayName = "UsersPage";

export default UsersPage;
