"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { MOCK_USERS } from "@/mocks";
import { Calendar, FileText, Users } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isAdmin, isCSM } = useAuth();

  // Statistiques selon le rôle
  const getStats = () => {
    if (isAdmin() || isCSM()) {
      return {
        users: MOCK_USERS.length,
        customers: MOCK_USERS.filter(u => u.roles.includes("CUSTOMER")).length,
        providers: MOCK_USERS.filter(u => u.roles.includes("PROVIDER")).length,
        appointments: 25, // Simulé
        invoices: 42, // Simulé
      };
    } else {
      return {
        appointments: 3, // Simulé - rendez-vous de l'utilisateur
        invoices: 5, // Simulé - factures de l'utilisateur
      };
    }
  };

  const stats = getStats();

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour, {user?.name || "Utilisateur"}
        </h1>
        <p className="text-gray-600 mt-2">
          Bienvenue sur votre tableau de bord Diaspomoney
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {(isAdmin() || isCSM()) && (
          <>
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Utilisateurs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.users}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {isAdmin() || isCSM()
                  ? "Tous les rendez-vous"
                  : "Mes rendez-vous"}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.appointments}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {isAdmin() || isCSM() ? "Toutes les factures" : "Mes factures"}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.invoices}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/dashboard/appointments"
          className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Gérer les rendez-vous
              </h3>
              <p className="text-gray-600">
                Consulter et organiser vos rendez-vous
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/invoices"
          className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Factures</h3>
              <p className="text-gray-600">Consulter et gérer vos factures</p>
            </div>
          </div>
        </Link>

        {(isAdmin() || isCSM()) && (
          <Link
            href="/dashboard/users"
            className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Gérer les utilisateurs
                </h3>
                <p className="text-gray-600">
                  Consulter et gérer les utilisateurs
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </>
  );
}
