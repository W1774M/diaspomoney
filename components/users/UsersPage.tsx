"use client";

import { useUsers, useAuthorization } from "@/hooks";
import { useUserFilters } from "@/hooks/users";
import { ROLES, USER_STATUSES } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import UsersFilters from "./UsersFilters";
import UsersHeader from "./UsersHeader";
import UsersTable from "./UsersTable";

function UsersPage() {
  const router = useRouter();
  
  // Mémoriser les options d'autorisation pour éviter les re-renders
  const authOptions = useMemo(() => ({ roles: [ROLES.ADMIN] }), []);
  const { isAuthorized } = useAuthorization(authOptions);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    typeof ROLES.ADMIN | typeof ROLES.PROVIDER | typeof ROLES.CUSTOMER | typeof ROLES.CSM | "ALL"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<
    typeof USER_STATUSES.ACTIVE | typeof USER_STATUSES.INACTIVE | typeof USER_STATUSES.PENDING | typeof USER_STATUSES.SUSPENDED | "ALL"
  >("ALL");

  // Mémoriser les options pour éviter les re-renders infinis
  const usersOptions = useMemo(() => {
    const opts = {
      role: roleFilter !== "ALL" ? roleFilter : undefined,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      limit: 100, // Maximum autorisé par l'API
    };
    return opts;
  }, [roleFilter, statusFilter]);

  const { users = [], loading, error } = useUsers(usersOptions);
  
  // Utiliser directement users au lieu de localUsers pour éviter les mises à jour inutiles
  // localUsers n'est nécessaire que pour les suppressions locales
  const [deletedUserIds, setDeletedUserIds] = useState<Set<string>>(new Set());
  
  // Logger les erreurs de récupération des utilisateurs
  useEffect(() => {
    if (error) {
      logger.error({ error, roleFilter, statusFilter }, '[UsersPage] Erreur lors de la récupération des utilisateurs');
    }
  }, [error, roleFilter, statusFilter]);

  // Logger les tentatives d'accès non autorisées
  useEffect(() => {
    if (!isAuthorized) {
      logger.warn({}, '[UsersPage] Tentative d\'accès non autorisée à la page utilisateurs');
    }
  }, [isAuthorized]);
  
  // Filtrer les utilisateurs supprimés localement
  const localUsers = useMemo(() => {
    if (deletedUserIds.size === 0) {
      return users;
    }
    return users.filter(user => !deletedUserIds.has(user._id));
  }, [users, deletedUserIds]);

  const { filteredUsers, updateFilter, clearFilters, hasActiveFilters } =
    useUserFilters(localUsers as any);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      logger.info({ userId: id }, '[UsersPage] Suppression d\'utilisateur demandée');
      setDeletedUserIds(prev => new Set([...prev, id]));
    }
  }, []);

  const handleEdit = useCallback(
    (id: string) => {
      logger.debug({ userId: id }, '[UsersPage] Navigation vers édition utilisateur');
      router.push(`/dashboard/users/${id}/edit`);
    },
    [router],
  );

  const handleView = useCallback(
    (id: string) => {
      logger.debug({ userId: id }, '[UsersPage] Navigation vers détails utilisateur');
      router.push(`/dashboard/users/${id}`);
    },
    [router],
  );

  const handleSendEmail = useCallback((user: any) => {
    if (user.email) {
      logger.debug({ userId: user._id, email: user.email }, '[UsersPage] Ouverture client email');
      window.open(`mailto:${user.email}`);
    }
  }, []);

  const handleCall = useCallback((user: any) => {
    if (user.phone) {
      logger.debug({ userId: user._id, phone: user.phone }, '[UsersPage] Appel utilisateur');
      window.open(`tel:${user.phone}`);
    }
  }, []);

  const handleAddUser = useCallback(() => {
    logger.debug({}, '[UsersPage] Navigation vers création utilisateur');
    router.push("/dashboard/users/new");
  }, [router]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      updateFilter("searchTerm", value);
    },
    [updateFilter],
  );

  const handleRoleChange = useCallback(
    (value: typeof ROLES.ADMIN | typeof ROLES.PROVIDER | typeof ROLES.CUSTOMER | typeof ROLES.CSM | "ALL") => {
      setRoleFilter(value);
      updateFilter("roleFilter", value);
    },
    [updateFilter],
  );

  const handleStatusChange = useCallback(
    (value: typeof USER_STATUSES.ACTIVE | typeof USER_STATUSES.INACTIVE | typeof USER_STATUSES.PENDING | typeof USER_STATUSES.SUSPENDED | "ALL") => {
      setStatusFilter(value);
      updateFilter("statusFilter", value);
    },
    [updateFilter],
  );

  if (!isAuthorized) {
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
}

UsersPage.displayName = "UsersPage";

export default React.memo(UsersPage);
