"use client";

import { ISpeciality } from "@/types";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewSpecialityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ISpeciality>>({
    name: "",
    description: "",
    group: "sante",
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simuler un appel API
      console.log("Création de la spécialité:", formData);

      // Simuler un délai
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Rediriger vers la liste des spécialités
      router.push("/specialities");
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      alert("Erreur lors de la création de la spécialité");
    } finally {
      setLoading(false);
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

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link
            href="/dashboard/specialities"
            className="flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Nouvelle spécialité
        </h1>
        <p className="text-gray-600 mt-2">
          Créez une nouvelle spécialité pour les prestataires
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
                <option value="transport">Transport</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/dashboard/specialities"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer la spécialité
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
