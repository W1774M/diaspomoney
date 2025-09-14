"use client";

import { MOCK_USERS } from "@/mocks";
import { Calendar, CheckCircle, Mail, MapPin, Phone, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppointmentConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const providerId = params["id"] as string;
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    // Récupérer les informations du prestataire
    const foundProvider = MOCK_USERS.find(
      user =>
        user._id === providerId &&
        user.roles.includes("PROVIDER") &&
        user.status === "ACTIVE"
    );

    if (foundProvider) {
      setProvider(foundProvider);
    } else {
      // Si le prestataire n'est pas trouvé ou n'est pas actif, rediriger
      router.push("/providers");
    }
  }, [providerId, router]);

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête avec bouton retour */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/providers/${providerId}`)}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour au prestataire
          </button>
        </div>

        {/* Message de confirmation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Rendez-vous confirmé !
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Votre demande de rendez-vous a été enregistrée avec succès. Le
            prestataire vous contactera dans les plus brefs délais pour
            confirmer le créneau.
          </p>
        </div>

        {/* Détails du prestataire */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Informations du prestataire
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Nom</p>
                <p className="font-medium text-gray-900">{provider.name}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Spécialité</p>
                <p className="font-medium text-gray-900">
                  {provider.specialty}
                </p>
              </div>
            </div>
            {provider.company && (
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Entreprise</p>
                  <p className="font-medium text-gray-900">
                    {provider.company}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{provider.email}</p>
              </div>
            </div>
            {provider.phone && (
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-medium text-gray-900">{provider.phone}</p>
                </div>
              </div>
            )}
            {provider.apiGeo && provider.apiGeo.length > 0 && (
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Localisation</p>
                  <p className="font-medium text-gray-900">
                    {provider.apiGeo
                      ?.map((geo: any) => geo?.name)
                      .filter(Boolean)
                      .join(", ") || "Non spécifié"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prochaines étapes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
          <h3 className="text-xl font-semibold text-blue-900 mb-4">
            Prochaines étapes
          </h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium text-blue-900">
                  Confirmation du créneau
                </p>
                <p className="text-blue-700 text-sm">
                  Le prestataire vérifiera sa disponibilité et vous confirmera
                  le créneau exact.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium text-blue-900">
                  Détails du rendez-vous
                </p>
                <p className="text-blue-700 text-sm">
                  Vous recevrez tous les détails pratiques (adresse, documents à
                  apporter, etc.).
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium text-blue-900">Rappel automatique</p>
                <p className="text-blue-700 text-sm">
                  Un rappel vous sera envoyé 24h avant votre rendez-vous.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informations importantes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">
            ⚠️ Informations importantes
          </h3>
          <ul className="space-y-2 text-yellow-700">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Conservez cette confirmation pour référence</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Le prestataire peut prendre jusqu'à 24h pour confirmer
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                En cas d'urgence, contactez directement le prestataire
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Vous pouvez annuler jusqu'à 24h avant le rendez-vous</span>
            </li>
          </ul>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push(`/providers/${providerId}`)}
            className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Retour au prestataire
          </button>
          <button
            onClick={() => router.push("/providers")}
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium"
          >
            Voir d'autres prestataires
          </button>
        </div>
      </div>
    </div>
  );
}
