"use client";
import { ModalImage } from "@/components/providers/ModalImage";
import { ModalIndicator } from "@/components/providers/ModalIndicateur";
import { ModalPayment } from "@/components/providers/ModalPayment";
import { ModalPreview } from "@/components/providers/ModalPreview";
import { ModalSelectService as Modal } from "@/components/providers/Modals";
import { useProvider } from "@/hooks/data/useProvider";
import { AppointmentInterface, paymentDataInterface } from "@/lib/definitions";
import DefaultTemplate from "@/template/DefaultTemplate";
import { Clock, Euro, MapPin, Phone, Star } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function ProviderPage() {
  const params = useParams();
  const providerId = params?.id?.[0];

  // États optimisés avec useMemo pour éviter les recalculs inutiles
  const [openImg, setOpenImg] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [steps, setSteps] = useState(0);
  const [retryToken, setRetryToken] = useState<string | null>(null);
  const [retryExpires, setRetryExpires] = useState<string | null>(null);

  // Utiliser le hook pour récupérer le prestataire
  const { provider, loading, error } = useProvider(providerId || "");

  // État initial optimisé
  const [appointment, setAppointment] = useState<AppointmentInterface>(() => ({
    requester: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
    },
    recipient: {
      firstName: "",
      lastName: "",
      phone: "",
    },
    provider: {
      id: 1,
      name: "",
      services: [],
      type: { id: "", value: "" },
      specialty: "",
      recommended: false,
      apiGeo: [],
      images: [],
      rating: 0,
    },
    selectedService: null,
    timeslot: "",
  }));

  const [paymentData, setPaymentData] = useState<paymentDataInterface>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  // Fonction optimisée avec useCallback
  const handleModalOpen = useCallback(() => {
    setModalOpen(true);
  }, [setModalOpen]);

  // Mise à jour du provider optimisée
  useEffect(() => {
    if (provider) {
      setAppointment((prev) => ({
        ...prev,
        provider: {
          id: provider.id,
          name: provider.name,
          services: provider.services.map((service: any, index: number) => ({
            id: index + 1,
            name: service.name,
            price: service.price,
          })),
          type: provider.type,
          specialty: provider.specialty,
          recommended: provider.recommended,
          apiGeo: provider.apiGeo,
          images: provider.images,
          rating: provider.rating,
          reviews: provider.reviews || 0,
          distance: provider.distance || "",
        },
      }));
    }
  }, [provider]);

  // Gestion des paramètres de retry dans l'URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const retry = urlParams.get("retry");
      const expires = urlParams.get("expires");

      if (retry && expires) {
        setRetryToken(retry);
        setRetryExpires(expires);

        // Valider le token de retry
        const validateRetryToken = async () => {
          try {
            const response = await fetch(
              `/api/validate-retry-token?token=${retry}&expires=${expires}`
            );
            const result = await response.json();

            if (result.expired) {
              alert(
                "❌ Le lien de retry a expiré. Veuillez refaire votre réservation."
              );
              // Nettoyer l'URL
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname
              );
            } else if (result.valid) {
              alert(
                "🔄 Lien de retry valide ! Vous pouvez reprendre votre réservation."
              );
              // Ouvrir automatiquement le modal de réservation
              setModalOpen(true);
              setSteps(0);
            }
          } catch (error) {
            console.error("Erreur lors de la validation du token:", error);
            alert("❌ Erreur lors de la validation du lien de retry.");
          }
        };

        validateRetryToken();
      }
    }
  }, []);

  // Gestionnaires optimisés
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSteps(0);
    // Réinitialiser les données par défaut
    setAppointment({
      requester: {
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
      },
      recipient: {
        firstName: "",
        lastName: "",
        phone: "",
      },
      provider: {
        id: 1,
        name: "",
        services: [],
        type: { id: "", value: "" },
        specialty: "",
        recommended: false,
        apiGeo: [],
        images: [],
        rating: 0,
      },
      selectedService: null,
      timeslot: "",
    });
    setPaymentData({
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: "",
    });
  }, [setAppointment, setPaymentData]);

  const handleModalOpenChange = useCallback(
    (open: boolean) => {
      if (!open) handleCloseModal();
    },
    [handleCloseModal]
  );

  const handleModalSteps = useCallback((step: number) => {
    setSteps(step);
  }, []);

  // Gestionnaire pour la validation finale (étape 2)
  const handleFinalValidation = useCallback(() => {
    // Fermer le modal et réinitialiser tout
    setModalOpen(false);
    setSteps(0);
    // Réinitialiser les données par défaut mais garder le prestataire actuel
    setAppointment({
      requester: {
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
      },
      recipient: {
        firstName: "",
        lastName: "",
        phone: "",
      },
      provider: provider || {
        id: 1,
        name: "",
        services: [],
        type: { id: "", value: "" },
        specialty: "",
        recommended: false,
        apiGeo: [],
        images: [],
        rating: 0,
      }, // Garder le prestataire actuel ou utiliser un fallback
      selectedService: null,
      timeslot: "",
    });
    setPaymentData({
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: "",
    });
  }, [setAppointment, setPaymentData, provider]);

  // Gestionnaire d'image optimisé
  const handleImageClick = useCallback((imageUrl: string) => {
    setOpenImg(imageUrl);
  }, []);

  // Gestionnaire pour fermer le modal d'image
  const handleCloseImageModal = useCallback(() => {
    setOpenImg(null);
  }, []);

  if (loading) {
    return (
      <DefaultTemplate>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du prestataire...</p>
          </div>
        </div>
      </DefaultTemplate>
    );
  }

  if (error || !provider) {
    return (
      <DefaultTemplate>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Prestataire introuvable
            </h1>
            <p className="text-gray-600">
              {error || "Le prestataire que vous recherchez n'existe pas."}
            </p>
          </div>
        </div>
      </DefaultTemplate>
    );
  }

  return (
    <DefaultTemplate>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-black text-white">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Image principale */}
              {provider.images && provider.images.length > 0 && (
                <div className="relative">
                  <Image
                    src={provider.images[0]}
                    alt={provider.name}
                    width={300}
                    height={300}
                    className="rounded-2xl shadow-2xl object-cover cursor-pointer"
                    onClick={() => handleImageClick(provider.images[0])}
                  />
                  {provider.recommended && (
                    <div className="absolute -top-2 -right-2 bg-yellow-100 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                      ⭐ Recommandé
                    </div>
                  )}
                </div>
              )}

              {/* Informations principales */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-500 px-3 py-1 rounded-full text-sm font-medium">
                    {provider.type.value}
                  </span>
                  {provider.recommended && (
                    <span className="bg-yellow-100 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                      Recommandé
                    </span>
                  )}
                </div>

                <h1 className="text-4xl font-bold mb-4">{provider.name}</h1>

                <div className="flex items-center gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="font-semibold">{provider.rating}/5</span>
                    <span className="text-blue-200">
                      ({provider.reviews || 0} avis)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{provider.apiGeo[0]?.display_name}</span>
                  </div>
                </div>

                <p className="text-blue-100 text-lg leading-relaxed">
                  {provider.specialty}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contenu principal */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>À
                  propos
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {provider?.description}
                </p>
              </div>

              {/* Services */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Euro className="w-6 h-6 text-blue-600" />
                  Services proposés
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {provider.services.map((service: any, idx: number) => (
                    <div
                      key={idx}
                      className="service-card flex justify-between bg-gray-50 rounded-lg p-4 border border-blue-300"
                    >
                      <h3 className="font-semibold text-gray-800">
                        {service.name}
                      </h3>
                      <span className="text-blue-600 font-bold">
                        {service.price} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Galerie d'images */}
              {provider.images && provider.images.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Galerie photos
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {provider.images.map((image: string, idx: number) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer"
                        onClick={() => handleImageClick(image)}
                      >
                        <Image
                          src={image}
                          alt={`${provider.name} - Image ${idx + 1}`}
                          width={200}
                          height={200}
                          className="rounded-lg object-cover w-full h-32 transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white">
                            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                              👁️
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informations de contact */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Phone className="w-6 h-6 text-blue-600" />
                  Informations de contact
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">
                      {provider.apiGeo[0]?.display_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">
                      Horaires d'ouverture disponibles
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Indicateur de progression */}
              {modalOpen && <ModalIndicator steps={steps} />}

              {/* Bouton de réservation */}
              <button
                onClick={() => handleModalOpen()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl cursor-pointer"
              >
                Prendre une réservation
              </button>

              {/* Contact */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  Contact
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">
                      {provider.apiGeo[0]?.display_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {modalOpen && (
          <>
            {steps === 0 && (
              <Modal
                appointment={appointment}
                setAppointment={setAppointment}
                setModalOpen={handleModalOpenChange}
                setSteps={handleModalSteps}
                provider={provider}
              />
            )}
            {steps === 1 && (
              <ModalPayment
                appointment={appointment}
                paymentData={paymentData}
                setPaymentData={setPaymentData}
                setModalOpen={handleModalOpenChange}
                setSteps={handleModalSteps}
              />
            )}
            {steps === 2 && (
              <ModalPreview
                appointment={appointment}
                paymentData={paymentData}
                setModalOpen={handleFinalValidation}
                setSteps={handleModalSteps}
              />
            )}
          </>
        )}

        {/* Modal d'image */}
        {openImg && (
          <ModalImage openImg={openImg} setOpenImg={handleCloseImageModal} />
        )}
      </div>
    </DefaultTemplate>
  );
}
