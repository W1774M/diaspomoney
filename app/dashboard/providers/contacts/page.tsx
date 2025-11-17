"use client";

import { useAuth, useProviders } from "@/hooks";
import {
  ArrowLeft,
  Building,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProviderContactsPage() {
  const { isCSM, isAuthenticated, isLoading, status } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const { providers, loading } = useProviders();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);


  const filteredProviders = providers.filter(provider => {
    const fullName = `${provider.firstName} ${provider.lastName}`;
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.specialties?.join(", ").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSendEmail = (provider: any) => {
    window.open(`mailto:${provider.email}`);
  };

  const handleCall = (provider: any) => {
    if (provider.phone) {
      window.open(`tel:${provider.phone}`);
    }
  };

  const getStatusColor = (status: string) => {
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <h2 className="text-xl font-semibold">Accès non autorisé</h2>
          <p className="text-gray-600">
            Vous devez être connecté pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoading && !isCSM()) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <h2 className="text-xl font-semibold">Accès non autorisé</h2>
          <p className="text-gray-600">
            Vous n'avez pas les permissions nécessaires pour accéder à cette
            page. Seuls les CSM peuvent consulter les contacts des prestataires.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des contacts...</p>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/dashboard/users"
            className="flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux utilisateurs
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Contacts des prestataires
        </h1>
        <p className="text-gray-600 mt-2">
          Consultez les informations de contact de tous les prestataires
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un prestataire..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
          />
        </div>
        <div className="mt-4 text-sm text-gray-500">
          {filteredProviders.length} prestataire
          {filteredProviders.length > 1 ? "s" : ""} trouvé
          {filteredProviders.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProviders.map(provider => (
          <div
            key={provider['id']}
            className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            {/* Card Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {provider.firstName} {provider.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {provider.specialties?.join(", ")}
                  </p>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    provider.status,
                  )}`}
                >
                  {provider.status}
                </span>
              </div>
              {provider.specialties && provider.specialties.length > 0 && (
                <p className="text-sm text-gray-600">
                  <Building className="h-4 w-4 inline mr-1" />
                  {provider.specialties.join(", ")}
                </p>
              )}
            </div>

            {/* Card Body */}
            <div className="p-6 space-y-4">
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-3" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {provider.email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSendEmail(provider)}
                    className="text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] p-1"
                    title="Envoyer un email"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                </div>

                {provider.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{provider.phone}</p>
                    </div>
                    <button
                      onClick={() => handleCall(provider)}
                      className="text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] p-1"
                      title="Appeler"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {provider.specialties && provider.specialties.length > 0 && (
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {provider.specialties.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Membre depuis</span>
                  <span>{formatDate(new Date(provider.createdAt))}</span>
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="px-6 py-3 bg-gray-50 rounded-b-lg">
              <div className="flex justify-between items-center">
                <Link
                  href={`/dashboard/users/${provider['id']}`}
                  className="text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] text-sm font-medium"
                >
                  Voir le profil complet
                </Link>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSendEmail(provider)}
                    className="text-gray-600 hover:text-gray-900 p-1"
                    title="Envoyer un email"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  {provider.phone && (
                    <button
                      onClick={() => handleCall(provider)}
                      className="text-gray-600 hover:text-gray-900 p-1"
                      title="Appeler"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProviders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 mb-4">
            {searchTerm
              ? "Aucun prestataire trouvé avec ces critères"
              : "Aucun prestataire pour le moment"}
          </div>
        </div>
      )}
    </>
  );
}
