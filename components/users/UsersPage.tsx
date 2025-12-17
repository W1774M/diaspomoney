/**
 * UsersPage - Page de gestion des utilisateurs
 * 
 * Implémente les design patterns :
 * - Custom Hooks Pattern (via useUsers, useUserFilters, useUserActions)
 * - Authorization Pattern (via useAuthorization)
 * - Notification Pattern (via useUserActions qui utilise useNotificationManager)
 * - Logger Pattern (structured logging)
 * 
 * Architecture :
 * - Le composant utilise useUsers qui appelle /api/users (GET)
 * - /api/users utilise le Facade Pattern (userFacade.getUsers)
 * - useUserActions utilise /api/users/[id] (DELETE) qui utilise userService
 * - Service Layer Pattern : userService utilise userRepository
 * - Repository Pattern : abstraction de l'accès aux données
 */
"use client";

import { useUsers, useAuthorization } from "@/hooks";
import { useUserFilters, useUserActions } from "@/hooks/users";
import { ROLES, USER_STATUSES } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CreateUserModal from "./CreateUserModal";
import UsersFilters from "./UsersFilters";
import UsersHeader from "./UsersHeader";
import UsersTableModern from "./UsersTableModern";
import UsersStatsCards from "./UsersStatsCards";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

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

  const { users = [], loading, error, refetch } = useUsers(usersOptions);
  
  // Utiliser directement users au lieu de localUsers pour éviter les mises à jour inutiles
  // localUsers n'est nécessaire que pour les suppressions locales
  const [deletedUserIds, setDeletedUserIds] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const usersToday = users.filter((user: any) => {
      const createdAt = user.createdAt ? new Date(user.createdAt) : null;
      if (!createdAt) return false;
      createdAt.setHours(0, 0, 0, 0);
      return createdAt.getTime() === today.getTime();
    }).length;

    // Pour l'instant, on simule les requêtes REST et Auth
    // TODO: Intégrer avec les vraies statistiques API
    const restRequests = 0; // À remplacer par les vraies données
    const authRequests = 0; // À remplacer par les vraies données

    // Calculer le nombre d'utilisateurs du mois précédent (simulation)
    const previousMonthUsers = Math.floor(users.length * 0.9); // Approximation

    return {
      totalUsers: users.length,
      usersToday,
      restRequests,
      authRequests,
      previousMonthUsers,
    };
  }, [users]);

  // Hook d'actions pour la suppression (conforme au pattern)
  const handleUserCreated = useCallback(() => {
    logger.debug({}, '[UsersPage] Utilisateur créé, rafraîchissement de la liste');
    // Forcer le rafraîchissement immédiatement
    if (refetch) {
      refetch();
    }
  }, [refetch]);

  const handleDeleteSuccess = useCallback(() => {
    // Callback de succès : rafraîchir la liste et marquer comme supprimé localement
    if (userToDelete) {
      setDeletedUserIds(prev => new Set([...prev, userToDelete]));
      if (refetch) {
        setTimeout(() => {
          refetch();
        }, 300);
      }
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  }, [userToDelete, refetch]);

  const { deleteUser, isDeleting } = useUserActions(handleDeleteSuccess);
  
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
    return users.filter(user => {
      const userId = user._id || user["id"];
      return userId && !deletedUserIds.has(userId);
    });
  }, [users, deletedUserIds]);

  const { filteredUsers, updateFilter, clearFilters, hasActiveFilters } =
    useUserFilters(localUsers as any);

  const handleDelete = useCallback((id: string) => {
    logger.debug({ userId: id }, '[UsersPage] Ouverture dialog de confirmation de suppression');
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!userToDelete) return;
    
    // Utiliser le hook d'actions pour la suppression
    await deleteUser(userToDelete);
  }, [userToDelete, deleteUser]);

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
    logger.debug({}, '[UsersPage] Ouverture modal création utilisateur');
    setIsCreateModalOpen(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);


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
    <>
    <div className="space-y-6">
      <UsersHeader
        onAddUser={handleAddUser}
      />

      {/* Statistiques */}
      <UsersStatsCards
        totalUsers={stats.totalUsers}
        usersToday={stats.usersToday}
        restRequests={stats.restRequests}
        authRequests={stats.authRequests}
        previousMonthUsers={stats.previousMonthUsers}
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

      {/* Tableau moderne */}
      <UsersTableModern
        users={filteredUsers}
        loading={loading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onView={handleView}
        onSendEmail={handleSendEmail}
        onCall={handleCall}
      />
    </div>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSuccess={handleUserCreated}
      />

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'utilisateur"
        message="Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?\n\nCette action est irréversible et supprimera toutes les données associées à cet utilisateur."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}

UsersPage.displayName = "UsersPage";

export default React.memo(UsersPage);
