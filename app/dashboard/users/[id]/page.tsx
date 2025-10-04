"use client";

import { IUser, USER_STATUSES } from "@/types";
import {
  ArrowLeft,
  Building2,
  Edit,
  Mail,
  Phone,
  Star,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
// import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserDetailPage() {
  // const params = useParams();
  const userId = "temp-user-id"; // TODO: Get from URL params
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Simuler des données pour l'exemple
  useEffect(() => {
    const mockUser: IUser = {
      _id: userId as string,
      id: userId as string,
      price: 0,
      email: "jean.dupont@email.com",
      name: "Jean Dupont",
      phone: "+33 1 23 45 67 89",
      company: "Entreprise ABC",
      address: "123 Rue de la Paix, 75001 Paris, France",
      roles: ["CUSTOMER"],
      status: "ACTIVE",
      clientNotes: "Client fidèle depuis 2020",
      avatar: {
        image: "",
        name: "",
      },
      preferences: {
        language: "fr",
        timezone: "Europe/Paris",
        notifications: true,
      },
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    };
    setUser(mockUser);
    setLoading(false);
  }, [userId]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "CSM":
        return "bg-purple-100 text-purple-800";
      case "PROVIDER":
        return "bg-[hsl(25,100%,53%)]/10 text-[hsl(25,100%,53%)]";
      case "CUSTOMER":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "SUSPENDED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <User className="h-4 w-4" />;
      case "CSM":
        return <User className="h-4 w-4" />;
      case "PROVIDER":
        return <Building2 className="h-4 w-4" />;
      case "CUSTOMER":
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement de l'utilisateur...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Utilisateur non trouvé</p>
        <Link
          href="/dashboard/users"
          className="mt-4 inline-flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux utilisateurs
        </Link>
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
          <Link
            href={`/dashboard/users/${user._id}/edit`}
            className="flex items-center px-3 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600 mt-2">
              Membre depuis le {formatDate(user.createdAt)}
            </p>
          </div>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
              user.status
            )}`}
          >
            {USER_STATUSES.find(s => s.value === user.status)?.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de base */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informations de base
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <p className="text-gray-900 font-medium">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              {user.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <p className="text-gray-900">{user.phone}</p>
                </div>
              )}
              {user.company && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entreprise
                  </label>
                  <p className="text-gray-900">{user.company}</p>
                </div>
              )}
              {user.address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <p className="text-gray-900">{user.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Rôles et statut */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Rôles et statut
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôles
                </label>
                <div className="flex flex-wrap gap-2">
                  {user.roles.map(role => (
                    <span
                      key={role}
                      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                        role
                      )}`}
                    >
                      {getRoleIcon(role)}
                      <span className="ml-1">{role}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    user.status
                  )}`}
                >
                  {USER_STATUSES.find(s => s.value === user.status)?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Informations spécifiques aux prestataires */}
          {user.roles.includes("PROVIDER") && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informations prestataire
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.specialty && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Spécialité
                    </label>
                    <p className="text-gray-900">{user.specialty}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recommandé
                  </label>
                  <div className="flex items-center">
                    {user.recommended ? (
                      <>
                        <Star className="h-4 w-4 text-yellow-500 mr-2" />
                        <span className="text-gray-900">Oui</span>
                      </>
                    ) : (
                      <span className="text-gray-500">Non</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informations spécifiques aux clients */}
          {user.roles.includes("CUSTOMER") && user.clientNotes && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informations client
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes client
                </label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {user.clientNotes}
                </p>
              </div>
            </div>
          )}

          {/* Préférences */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Préférences
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Langue
                </label>
                <p className="text-gray-900">
                  {user.preferences?.language === "fr"
                    ? "Français"
                    : user.preferences?.language === "en"
                    ? "English"
                    : "Español"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuseau horaire
                </label>
                <p className="text-gray-900">{user.preferences?.timezone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notifications
                </label>
                <p className="text-gray-900">
                  {user.preferences?.notifications ? "Activées" : "Désactivées"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Actions rapides
            </h2>
            <div className="space-y-2">
              <Link
                href={`/dashboard/users/${user._id}/edit`}
                className="w-full flex items-center justify-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier l'utilisateur
              </Link>
              {user.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer un email
                </a>
              )}
              {user.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Appeler
                </a>
              )}
            </div>
          </div>

          {/* Informations système */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informations système
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Utilisateur
                </label>
                <p className="text-sm text-gray-500 font-mono">{user._id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Créé le
                </label>
                <p className="text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modifié le
                </label>
                <p className="text-sm text-gray-500">
                  {formatDate(user.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Statistiques
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Factures</span>
                <span className="text-lg font-bold text-gray-900">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tâches</span>
                <span className="text-lg font-bold text-gray-900">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Projets</span>
                <span className="text-lg font-bold text-gray-900">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
