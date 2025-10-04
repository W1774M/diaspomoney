"use client";

import { Calendar, Clock, Mail, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppointmentPage() {
  const router = useRouter();
  // const params = useParams();
  const serviceId = "temp-service-id"; // TODO: Get from URL params
  // Correction: accès à l'id via index signature pour éviter l'erreur TS
  const providerId = serviceId;
  const [provider, setProvider] = useState<any>(null);

  // Vérifier que le prestataire est actif
  const isProviderActive = () => {
    return (
      provider &&
      provider.roles.includes("PROVIDER") &&
      provider.status === "ACTIVE"
    );
  };

  useEffect(() => {
    // Récupérer les informations du prestataire depuis l'API
    const fetchProvider = async () => {
      try {
        const response = await fetch(`/api/providers/${providerId}`);

        if (response.ok) {
          const data = await response.json();
          setProvider(data.data);
        } else {
          // Si le prestataire n'est pas trouvé, rediriger
          router.push("/providers");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du prestataire:", error);
        router.push("/providers");
      } finally {
      }
    };

    fetchProvider();
  }, [providerId, router]);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    service: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  // Vérifier que le prestataire est actif au chargement
  useEffect(() => {
    if (!isProviderActive()) {
      router.push("/providers");
    }
    // Ajout de router dans les dépendances pour éviter le warning React
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Vérifier que le prestataire est toujours actif
    if (!isProviderActive()) {
      alert(
        "Ce prestataire n'est plus disponible. Veuillez choisir un autre prestataire."
      );
      router.push("/providers");
      return;
    }

    // Ici vous pourriez envoyer les données à votre API
    console.log("Données du rendez-vous:", { providerId, ...formData });

    // Redirection vers une page de confirmation
    router.push(`/providers/${providerId}/appointment/confirmation`);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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

        {/* Titre */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Prendre un rendez-vous
          </h1>
          <p className="text-xl text-gray-600">
            Remplissez le formulaire ci-dessous pour réserver votre créneau
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date et heure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date souhaitée
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Heure souhaitée
                </label>
                <select
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionnez une heure</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                </select>
              </div>
            </div>

            {/* Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service souhaité
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionnez un service</option>
                <option value="consultation">Consultation</option>
                <option value="suivi">Suivi</option>
                <option value="urgence">Urgence</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Prénom
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nom
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (optionnel)
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                placeholder="Décrivez brièvement votre besoin ou ajoutez des informations importantes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Confirmer le rendez-vous
              </button>
              <button
                type="button"
                onClick={() => router.push(`/providers/${providerId}`)}
                className="flex-1 border border-gray-300 text-gray-700 px-8 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
