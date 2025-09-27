"use client";

import { useAuth, useUsers } from "@/hooks";
import { IUser, UserRole, UserStatus } from "@/types";
import {
  Edit,
  Eye,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const { isAdmin, isAuthenticated, isLoading, status } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL");

  // Récupérer les utilisateurs depuis la base de données
  const { users = [], loading } = useUsers({
    role: roleFilter !== "ALL" ? roleFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    limit: 1000,
  });

  // Vérifier l'authentification
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fix: useState for users to allow deletion
  const [localUsers, setLocalUsers] = useState<IUser[]>([]);

  // Sync localUsers with fetched users, ensuring type compatibility
  useEffect(() => {
    setLocalUsers(users as IUser[]);
  }, [users]);

  const filteredUsers = localUsers.filter((user) => {
    const matchesSearch =
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (user.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesRole =
      roleFilter === "ALL" || (user.roles?.includes(roleFilter) ?? false);
    const matchesStatus =
      statusFilter === "ALL" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      setLocalUsers((prev) => prev.filter((user) => user._id !== id));
      // Optionally, call an API to delete the user here and refetch
      // await deleteUser(id);
      // refetch();
    }
  };

  const handleSendEmail = (user: IUser) => {
    if (user.email) {
      window.open(`mailto:${user.email}`);
    }
  };

  const handleCall = (user: IUser) => {
    if (user.phone) {
      window.open(`tel:${user.phone}`);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "PROVIDER":
        return "bg-blue-100 text-blue-800";
      case "CUSTOMER":
        return "bg-green-100 text-green-800";
      case "CSM":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  };

  // Afficher un message de chargement ou d'accès refusé
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  // Redirection en cours
  if (!isAuthenticated || !isAdmin()) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Utilisateurs
        </h1>
        <p className="text-gray-600 mt-2">
          Gérez tous les utilisateurs de la plateforme
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "ALL")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
          >
            <option value="ALL">Tous les rôles</option>
            <option value="ADMIN">Administrateurs</option>
            <option value="PROVIDER">Prestataires</option>
            <option value="CUSTOMER">Clients</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as UserStatus | "ALL")
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
            <option value="PENDING">En attente</option>
            <option value="SUSPENDED">Suspendu</option>
          </select>
        </div>
        <div className="mt-4 text-sm text-gray-500 flex items-center justify-center sm:justify-start">
          {filteredUsers.length} utilisateur
          {filteredUsers.length > 1 ? "s" : ""} trouvé
          {filteredUsers.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            {/* Card Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                </div>
                <div className="flex flex-col space-y-1 ml-2">
                  {user.roles?.map((role) => (
                    <span
                      key={role}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                        role
                      )}`}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    user.status
                  )}`}
                >
                  {user.status}
                </span>
                {user.company && (
                  <span className="text-sm text-gray-500 truncate">
                    {user.company}
                  </span>
                )}
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Contact Info */}
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  {user.phone && (
                    <p className="text-sm text-gray-500">{user.phone}</p>
                  )}
                </div>
              </div>

              {/* Special Info */}
              {user.specialty && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Spécialité:</span>{" "}
                  {user.specialty}
                </div>
              )}
              {user.clientNotes && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Notes:</span> {user.clientNotes}
                </div>
              )}

              {/* Dates */}
              <div className="text-sm text-gray-500 space-y-1">
                <p>Créé le: {formatDate(user.createdAt)}</p>
                <p>Modifié le: {formatDate(user.updatedAt)}</p>
              </div>
            </div>

            {/* Card Actions */}
            <div className="px-4 sm:px-6 py-3 bg-gray-50 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/users/${user._id}`}
                    className="text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] p-1"
                    title="Voir"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  {user.phone && (
                    <button
                      onClick={() => handleCall(user)}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="Appeler"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleSendEmail(user)}
                    className="text-purple-600 hover:text-purple-900 p-1"
                    title="Envoyer par email"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/users/${user._id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900 p-1"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 mb-4">
            {searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL"
              ? "Aucun utilisateur trouvé avec ces critères"
              : "Aucun utilisateur pour le moment"}
          </div>
          {!searchTerm && roleFilter === "ALL" && statusFilter === "ALL" && (
            <Link
              href="/dashboard/users/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer votre premier utilisateur
            </Link>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <Link
        href="/dashboard/users/new"
        className="fixed bottom-6 right-6 bg-[hsl(25,100%,53%)] text-white p-4 rounded-full shadow-lg hover:bg-[hsl(25,90%,48%)] transition-colors z-10"
        title="Créer un utilisateur"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </>
  );
}
