"use client";

import { IUser, USER_ROLES, USER_STATUSES } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    company: "",
    address: "",
    roles: [] as string[],
    status: "ACTIVE" as string,
    specialty: "",
    recommended: false,
    clientNotes: "",
    avatar: "",
    preferences: {
      language: "fr",
      timezone: "Europe/Paris",
      notifications: true,
    },
  });

  // Simuler des données pour l'exemple
  useEffect(() => {
    const mockUser: IUser = {
      _id: params["id"] as string,
      id: params["id"] as string,
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

    // Remplir le formulaire avec les données existantes
    setFormData({
      email: mockUser.email,
      name: mockUser.name,
      phone: mockUser.phone || "",
      company: mockUser.company || "",
      address: mockUser.address || "",
      roles: mockUser.roles,
      status: mockUser.status,
      specialty: mockUser.specialty || "",
      recommended: mockUser.recommended || false,
      clientNotes: mockUser.clientNotes || "",
      avatar:
        typeof mockUser.avatar === "string"
          ? mockUser.avatar
          : mockUser.avatar?.image || "",
      preferences: mockUser.preferences || {
        language: "fr",
        timezone: "Europe/Paris",
        notifications: true,
      },
    });
    setLoading(false);
  }, [params["id"]]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role),
    }));
  };

  const handlePreferenceChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser: Partial<IUser> = {
        ...formData,
        roles: formData.roles as IUser["roles"], // Cast to correct type
        status: formData.status as IUser["status"], // Ensure status is correct enum/type
        avatar: {
          image: formData.avatar,
          name: "",
        },
        updatedAt: new Date(),
      };

      console.log("Utilisateur mis à jour:", updatedUser);
      alert("Utilisateur mis à jour avec succès !");
      router.push(`/dashboard/users/${params["id"]}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour de l'utilisateur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement de l'utilisateur...</p>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href={`/dashboard/users/${params["id"]}`}
            className="flex items-center text-[hsl(25,100%,53%)] hover:text-[hsl(25,90%,48%)] mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'utilisateur
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Modifier l'Utilisateur
        </h1>
        <p className="text-gray-600 mt-2">
          Modifiez les informations de {formData.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de base */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informations de base
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                placeholder="Jean Dupont"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleInputChange("email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                placeholder="jean.dupont@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => handleInputChange("phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entreprise
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={e => handleInputChange("company", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                placeholder="Entreprise ABC"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <textarea
                value={formData.address}
                onChange={e => handleInputChange("address", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                placeholder="123 Rue de la Paix, 75001 Paris, France"
              />
            </div>
          </div>
        </div>

        {/* Rôles et statut */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Rôles et statut
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rôles *
              </label>
              <div className="space-y-2">
                {USER_ROLES.map(role => (
                  <label key={role.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(role.value)}
                      onChange={e =>
                        handleRoleChange(role.value, e.target.checked)
                      }
                      className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {role.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={e => handleInputChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              >
                {USER_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Informations spécifiques aux prestataires */}
        {formData.roles.includes("PROVIDER") && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informations prestataire
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécialité
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={e => handleInputChange("specialty", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                  placeholder="Cardiologie, BTP, etc."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.recommended}
                  onChange={e =>
                    handleInputChange("recommended", e.target.checked)
                  }
                  className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Prestataire recommandé
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Informations spécifiques aux clients */}
        {formData.roles.includes("CUSTOMER") && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informations client
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes client
              </label>
              <textarea
                value={formData.clientNotes}
                onChange={e => handleInputChange("clientNotes", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
                placeholder="Notes sur le client..."
              />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Langue
              </label>
              <select
                value={formData.preferences.language}
                onChange={e =>
                  handlePreferenceChange("language", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuseau horaire
              </label>
              <select
                value={formData.preferences.timezone}
                onChange={e =>
                  handlePreferenceChange("timezone", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
              >
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.preferences.notifications}
                onChange={e =>
                  handlePreferenceChange("notifications", e.target.checked)
                }
                className="h-4 w-4 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)] border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Notifications activées
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            href={`/dashboard/users/${params["id"]}`}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving || formData.roles.length === 0}
            className="px-6 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,90%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </form>
    </>
  );
}
