"use client";

import { BookingForm } from "@/components/features/providers/BookingForm";
import { InfiniteReviewsCarousel } from "@/components/providers/index";
import { StatusBadge } from "@/components/ui";
import { useNotificationManager } from "@/components/ui/Notification";
import type { AppointmentFormData } from "@/lib/validations";
import { IUser } from "@/types";
import { Building, Calendar, Clock, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// Définir les propriétés additionnelles attendues sur le mock utilisateur
type ProviderType = IUser & {
  profileImage?: string;
  description?: string;
  rating?: number;
  specialty?: string;
  company?: string;
  apiGeo?: { name?: string }[];
  selectedServices?: string;
  recommended?: boolean;
  address?: string;
  availabilities?: { start: string; end: string }[];
  appointments?: { start: string; end: string }[];
  images?: string[];
};

export default function ProviderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addSuccess, addError } = useNotificationManager();
  // Fix: useParams() can return string | string[] | undefined, so handle accordingly
  const id =
    typeof params === "object" && params !== null
      ? (params as { [key: string]: string | string[] })["id"]
      : undefined;
  // If id is an array, take the first element
  const providerId = Array.isArray(id) ? id[0] : id;

  const [provider, setProvider] = useState<ProviderType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const ratingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-yellow-600";
    return "text-red-600";
  };

  const ratingText = (rating: number) => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 4.0) return "Très bien";
    if (rating >= 3.5) return "Bien";
    return "Moyen";
  };

  const availableSlots = useMemo(() => {
    type TimeSlot = { start: string; end: string };
    const isTimeSlot = (v: unknown): v is TimeSlot =>
      !!v &&
      typeof v === "object" &&
      v !== null &&
      "start" in (v as any) &&
      "end" in (v as any);

    if (!provider) return [] as TimeSlot[];
    const allAvail = Array.isArray(provider.availabilities)
      ? (provider.availabilities as unknown[]).filter(isTimeSlot)
      : [];
    const taken = Array.isArray(provider.appointments)
      ? (provider.appointments as unknown[]).filter(isTimeSlot)
      : [];
    return allAvail.filter(
      slot => !taken.some(appt => appt.start === slot.start)
    );
  }, [provider]);

  const handleBookingClick = () => {
    setShowBookingModal(true);
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setShowBookingForm(false);
  };

  const handleContinueToForm = () => {
    setShowBookingForm(true);
  };

  const handleFormSubmit = async (data: AppointmentFormData) => {
    try {
      // Ici on pourrait envoyer les données à l'API
      console.log("Données du formulaire:", data);
      console.log("Prestataire:", provider?.name);

      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fermer le formulaire et afficher un message de succès
      handleCloseModal();

      // Ici on pourrait rediriger vers une page de confirmation
      // ou afficher une notification de succès
      addSuccess("Rendez-vous confirmé avec succès !");
    } catch (error) {
      addError("Erreur lors de la prise de rendez-vous. Veuillez réessayer.");
      console.error("Erreur lors de la prise de rendez-vous:", error);
    }
  };

  useEffect(() => {
    const loadProvider = async () => {
      try {
        setLoading(true);
        if (!providerId) {
          setProvider(null);
          setLoading(false);
          return;
        }
        
        // Récupérer le prestataire depuis l'API
        try {
          const response = await fetch(`/api/providers/${providerId}`);
          if (response.ok) {
            const data = await response.json();
            const foundProvider = data.data;
            
            if (foundProvider && 
                Array.isArray(foundProvider.roles) &&
                foundProvider.roles.includes("PROVIDER") &&
                foundProvider.status === "ACTIVE") {
              // Correction: Ajout d'un fallback pour availabilities et appointments si absents
              setProvider({
                ...foundProvider,
                availabilities: foundProvider.availabilities || [],
                appointments: foundProvider.appointmentsAsProvider || [],
                images: foundProvider.images || [],
              } as unknown as ProviderType);
            } else {
              setProvider(null);
            }
          } else {
            setProvider(null);
          }
        } catch (error) {
          console.error("Erreur lors du chargement du prestataire:", error);
          setProvider(null);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du prestataire:", error);
        setProvider(null);
      } finally {
        setLoading(false);
      }
    };

    loadProvider();
  }, [providerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Prestataire non trouvé
          </h2>
          <p className="text-gray-600">
            Le prestataire que vous recherchez n&apos;existe pas.
          </p>
          <button
            onClick={() => router.push("/providers")}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            type="button"
          >
            Retour aux prestataires
          </button>
        </div>
      </div>
    );
  }

  // Subcomponents for readability
  const HeaderSection = () => (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
        <StatusBadge status="ACTIVE" size="md" />
      </div>
      <p className="text-xl text-gray-600 mb-2">{provider.specialty}</p>
      {provider.company && (
        <div className="flex items-center text-gray-600 mb-2">
          <Building className="w-5 h-5 mr-2" />
          <span>{provider.company}</span>
        </div>
      )}
    </div>
  );

  const ImageAndRating = () => (
    <div className="lg:w-1/3">
      <div className="relative w-full h-64 rounded-lg flex items-center justify-center overflow-hidden bg-gray-100 mb-4">
        {provider.avatar ? (
          <Image
            src={provider.avatar.image}
            alt={provider.avatar.name || ""}
            fill
            className="object-contain object-center"
            sizes="(max-width: 1024px) 100vw, 33vw"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-500 text-6xl">
              {provider.name?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
        )}
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Star className="w-6 h-6 text-yellow-400 mr-2" />
          <span
            className={`text-2xl font-bold ${ratingColor(provider.rating ?? 0)}`}
          >
            {provider.rating !== undefined && provider.rating !== null
              ? provider.rating
              : "N/A"}
          </span>
        </div>
        <p className="text-gray-600 mb-2">{ratingText(provider.rating ?? 0)}</p>
        <p className="text-sm text-gray-500">Basé sur les avis clients</p>
      </div>
    </div>
  );

  const LocationSection = () =>
    provider.apiGeo &&
    Array.isArray(provider.apiGeo) &&
    provider.apiGeo.length > 0 ? (
      <div className="flex items-center text-gray-600 mb-4">
        <MapPin className="w-5 h-5 mr-2" />
        <span>
          {provider.apiGeo
            .map(geo => geo?.name)
            .filter(Boolean)
            .join(", ")}
        </span>
      </div>
    ) : null;

  const AvailabilitySection = () => (
    <div className="mb-6">
      <div className="flex items-center text-gray-600 mb-2">
        <Clock className="w-5 h-5 mr-2" />
        <span className="font-medium">Disponibilités</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableSlots.length > 0 ? (
          availableSlots.map((slot, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
            >
              {slot.start} - {slot.end}
            </span>
          ))
        ) : (
          <span className="text-gray-500 text-sm">
            Aucun créneau disponible
          </span>
        )}
      </div>
    </div>
  );

  const ServicesSection = () =>
    provider.selectedServices ? (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Services disponibles
        </h3>
        <div className="flex flex-wrap gap-2">
          {provider.selectedServices.split(",").map((service, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
            >
              {service.trim()}
            </span>
          ))}
        </div>
      </div>
    ) : null;

  const BookingButton = () => (
    <div className="mb-6">
      <button
        onClick={handleBookingClick}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
        data-testid="booking-button"
        type="button"
      >
        <Calendar className="w-5 h-5" />
        Prendre rendez-vous
      </button>
    </div>
  );

  const PhotosSection = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Photos</h3>
      {provider.images && provider.images.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {provider.images.map((image, index) => (
            <button
              key={index}
              type="button"
              className="focus:outline-none"
              onClick={() => setSelectedImage(image)}
              style={{ border: "none", background: "none", padding: 0 }}
            >
              <Image
                src={image}
                alt={provider.name || ""}
                width={100}
                height={100}
                className="rounded shadow hover:scale-105 transition-transform"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      ) : (
        <span className="text-gray-500 text-sm">
          Aucune photo enregistrée pour ce prestataire.
        </span>
      )}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setSelectedImage(null)}
          style={{ cursor: "zoom-out" }}
        >
          <div className="relative" onClick={e => e.stopPropagation()}>
            <Image
              src={selectedImage}
              alt={provider.name || ""}
              width={800}
              height={800}
              className="rounded-lg shadow-lg max-h-[80vh] max-w-[90vw] object-contain"
              sizes="(max-width: 800px) 100vw, 800px"
            />
            <button
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-200"
              onClick={() => setSelectedImage(null)}
              aria-label="Fermer"
              type="button"
            >
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const BookingModal = () => (
    <>
      {showBookingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleCloseModal}
          data-testid="booking-modal-overlay"
        >
          {showBookingForm ? (
            <div onClick={e => e.stopPropagation()}>
              <BookingForm
                provider={{
                  _id: provider._id,
                  name: provider.name,
                  specialty: provider.specialty ?? "",
                  selectedServices:
                    typeof provider.selectedServices === "string"
                      ? provider.selectedServices
                      : "",
                  availabilities: availableSlots,
                }}
                onClose={handleCloseModal}
                onSubmit={handleFormSubmit}
              />
            </div>
          ) : (
            <div
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={e => e.stopPropagation()}
              data-testid="booking-modal"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Prendre rendez-vous
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                  data-testid="close-booking-modal"
                  type="button"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Prendre rendez-vous avec <strong>{provider.name}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Spécialité: {provider.specialty}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  Annuler
                </button>
                <button
                  onClick={handleContinueToForm}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  data-testid="confirm-booking-button"
                  type="button"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête avec bouton retour */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/providers")}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            type="button"
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
            Retour aux prestataires
          </button>
        </div>

        {/* Informations principales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <ImageAndRating />
            <div className="lg:w-2/3">
              <HeaderSection />
              <LocationSection />
              {provider.specialty !== "Ecole" && <AvailabilitySection />}
              <ServicesSection />
              <BookingButton />
            </div>
          </div>
        </div>

        {/* Photos */}
        <PhotosSection />

        {/* Description et détails */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">À propos</h3>
          <p className="text-gray-700 leading-relaxed">
            {provider.description ||
              `${provider.name} est un prestataire qualifié dans le domaine de ${provider.specialty}. 
Avec une expertise reconnue et une approche centrée sur le client, 
nous nous engageons à fournir des services de qualité adaptés à vos besoins.`}
          </p>
        </div>

        {/* Recommandations */}
        {provider.recommended && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <Star className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h4 className="text-lg font-semibold text-green-800">
                  Prestataire recommandé
                </h4>
                <p className="text-green-700">
                  Ce prestataire a été recommandé par notre équipe pour la
                  qualité de ses services.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Carousel d'avis clients infini */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Avis clients
          </h3>
          <InfiniteReviewsCarousel />
        </div>
      </div>

      {/* Modal de prise de rendez-vous */}
      <BookingModal />
    </div>
  );
}
