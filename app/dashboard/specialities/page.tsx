"use client";

import { ROLES } from "@/lib/constants";
import { AuthorizedRoute } from "@/components/auth";
import { Building, Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSpecialities } from "@/hooks/specialities/useSpecialities";
import { useSpeciality } from "@/hooks/specialities/useSpeciality";

/**
 * Contenu de la page des spécialités
 */
function SpecialitiesPageContent() {
  const { specialities, loading, error, refetch } = useSpecialities();
  const { deleteSpeciality } = useSpeciality();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const filteredSpecialities = specialities.filter(speciality => {
    const matchesSearch = speciality.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || speciality.group === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette spécialité ?")) {
      try {
        await deleteSpeciality(id);
        // Recharger la liste après suppression
        await refetch();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression de la spécialité");
      }
    }
  };

  const getTypeColor = (group: string) => {
    switch (group) {
      case "sante":
        return "bg-blue-100 text-blue-800";
      case "immo":
        return "bg-orange-100 text-orange-800";
      case "edu":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des spécialités...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Erreur: {error}</div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)]"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Spécialités
        </h1>
        <p className="text-gray-600 mt-2">
          Gérez les spécialités des prestataires
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une spécialité..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
            />
          </div>
          <select
            title="Type de spécialité"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
          >
            <option value="ALL">Tous les types</option>
            <option value="sante">Santé</option>
            <option value="immo">Immobilier</option>
            <option value="edu">Éducation</option>
            <option value="transport">Transport</option>
          </select>
        </div>
        <div className="mt-4 text-sm text-gray-500 flex items-center justify-center sm:justify-start">
          {filteredSpecialities.length} spécialité
          {filteredSpecialities.length > 1 ? "s" : ""} trouvée
          {filteredSpecialities.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Specialities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredSpecialities.map(speciality => (
          <div
            key={speciality._id}
            className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            {/* Card Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {speciality.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    ID: {speciality._id}
                  </p>
                </div>
                <div className="flex space-x-1 ml-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(
                      speciality.group,
                    )}`}
                  >
                    {speciality.group}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Type Info */}
              <div className="flex items-start space-x-3">
                <Building className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Type de service
                  </p>
                  <p className="text-sm text-gray-500">{speciality.group}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="text-sm text-gray-500 space-y-1">
                <p>Créé le: {formatDate(speciality.createdAt)}</p>
                <p>Modifié le: {formatDate(speciality.updatedAt)}</p>
              </div>
            </div>

            {/* Card Actions */}
            <div className="px-4 sm:px-6 py-3 bg-gray-50 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/specialities/${speciality._id}`}
                    className="text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] p-1"
                    title="Voir"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/specialities/${speciality._id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900 p-1"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(speciality._id)}
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
      {filteredSpecialities.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 mb-4">
            {searchTerm || typeFilter !== "ALL"
              ? "Aucune spécialité trouvée avec ces critères"
              : "Aucune spécialité pour le moment"}
          </div>
          {!searchTerm && typeFilter === "ALL" && (
            <Link
              href="/dashboard/specialities/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[hsl(25,100%,53%)] hover:bg-[hsl(25,90%,48%)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer votre première spécialité
            </Link>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <Link
        href="/dashboard/specialities/new"
        className="fixed bottom-6 right-6 bg-[hsl(25,100%,53%)] text-white p-4 rounded-full shadow-lg hover:bg-[hsl(25,90%,48%)] transition-colors z-10"
        title="Créer une spécialité"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </>
  );
}

/**
 * Page des spécialités
 * Implémente les design patterns :
 * - Authorization Pattern (via AuthorizedRoute aligné avec @Authorize decorator backend)
 */
export default function SpecialitiesPage() {
  return (
    <AuthorizedRoute roles={[ROLES.ADMIN]} redirectTo="/dashboard">
      <SpecialitiesPageContent />
    </AuthorizedRoute>
  );
}
