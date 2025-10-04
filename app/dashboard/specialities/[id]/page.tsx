"use client";

import { ISpeciality } from "@/types";
import { ArrowLeft, Building, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SpecialityDetailPage() {
  // const params = useParams();
  const specialityId = "temp-speciality-id"; // TODO: Get from URL params
  const router = useRouter();
  const [speciality, setSpeciality] = useState<ISpeciality | null>(null);
  const [loading, setLoading] = useState(true);

  // Simuler la récupération des données
  useEffect(() => {
    const mockSpeciality: ISpeciality = {
      _id: specialityId as string,
      name: "Cardiologie",
      description: "Spécialité médicale du cœur",
      group: "sante",
      isActive: true,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-15"),
    };

    // Simuler un délai de chargement
    setTimeout(() => {
      setSpeciality(mockSpeciality);
      setLoading(false);
    }, 500);
  }, [specialityId]);

  const handleDelete = async () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette spécialité ?")) {
      try {
        // Simuler un appel API
        console.log("Suppression de la spécialité:", speciality?._id);

        // Simuler un délai
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Rediriger vers la liste
        router.push("/specialities");
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression de la spécialité");
      }
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
        <p className="mt-4 text-gray-600">Chargement de la spécialité...</p>
      </div>
    );
  }

  if (!speciality) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Spécialité non trouvée
        </h2>
        <p className="text-gray-600 mb-4">
          La spécialité que vous recherchez n'existe pas.
        </p>
        <Link
          href="/dashboard/specialities"
          className="inline-flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/dashboard/specialities"
            className="flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Link>

          {/* Actions */}
          <div className="flex space-x-2">
            <Link
              href={`/dashboard/specialities/${speciality._id}/edit`}
              className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {speciality.name}
        </h1>
        <p className="text-gray-600 mt-2">Détails de la spécialité</p>
      </div>

      {/* Speciality Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informations générales
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Nom</span>
                  <span className="text-sm text-gray-900">
                    {speciality.name}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">
                    Type
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">
                    N/A
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  {/* Removed invalid 'id' property, as ISpeciality does not have 'id'. */}
                  <span className="text-sm font-medium text-gray-500">
                    ID MongoDB
                  </span>
                  <span className="text-sm text-gray-900 font-mono">
                    {speciality._id}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Actions rapides
              </h3>

              <div className="space-y-3">
                <Link
                  href={`/dashboard/specialities/${speciality._id}/edit`}
                  className="flex items-center w-full px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier la spécialité
                </Link>

                <button
                  onClick={handleDelete}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer la spécialité
                </button>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informations système
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Créé le:</span>
                  <p className="text-gray-900">
                    {formatDate(speciality.createdAt)}
                  </p>
                </div>

                <div>
                  <span className="text-gray-500">Modifié le:</span>
                  <p className="text-gray-900">
                    {formatDate(speciality.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
