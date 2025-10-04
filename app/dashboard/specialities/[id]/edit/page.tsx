"use client";

import { ISpeciality } from "@/types";
import { ArrowLeft, Building, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditSpecialityPage() {
  // const params = useParams();
  const specialityId = "temp-speciality-id"; // TODO: Get from URL params
  const router = useRouter();
  const [speciality, setSpeciality] = useState<ISpeciality | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ISpeciality>>({
    name: "",
    group: "sante",
  });

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
      setFormData({
        name: mockSpeciality.name,
        description: mockSpeciality.description,
        group: mockSpeciality.group,
      });
      setLoading(false);
    }, 500);
  }, [specialityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Simuler un appel API
      console.log("Mise à jour de la spécialité:", formData);

      // Simuler un délai
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Rediriger vers la page de détail
      specialityId && router.push(`/dashboard/specialities/${specialityId}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour de la spécialité");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof ISpeciality,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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
        <div className="flex items-center mb-4">
          <Link
            href={`/dashboard/specialities/${speciality._id}`}
            className="flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Modifier {speciality.name}
        </h1>
        <p className="text-gray-600 mt-2">
          Modifiez les informations de cette spécialité
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Nom de la spécialité */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nom de la spécialité *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={e => handleInputChange("name", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                placeholder="Ex: Cardiologie, Dermatologie, Orthodontie..."
              />
            </div>

            {/* Type de spécialité */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Type de spécialité *
              </label>
              <select
                id="group"
                required
                value={formData.group}
                onChange={e => handleInputChange("group", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              >
                <option value="sante">Santé</option>
                <option value="immo">Immobilier</option>
                <option value="edu">Éducation</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description || ""}
                onChange={e => handleInputChange("description", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                placeholder="Description de la spécialité"
                rows={3}
              />
            </div>

            {/* Informations système */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Informations système
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">ID MongoDB:</span>
                  <p className="text-gray-900 font-mono">{speciality._id}</p>
                </div>
                <div>
                  <span className="text-gray-500">Créé le:</span>
                  <p className="text-gray-900">
                    {new Intl.DateTimeFormat("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }).format(speciality.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <Link
              href={`/dashboard/specialities/${speciality._id}`}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving || !formData.name}
              className="flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
