"use client";

import { StripeCheckout } from "@/components/payments/StripeCheckout";
import {
  Button,
  Form,
  FormField,
  FormLabel,
  Input,
  PhoneInput,
} from "@/components/ui";
import { useAuth } from "@/hooks/auth/useAuth";
import { useForm } from "@/hooks/forms";
import { calculatePriceWithCommission } from "@/lib/services/utils";
import { bookingSchema, type BookingFormData } from "@/lib/validations";
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Lock,
  MapPin,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface BookingFormProps {
  provider: {
    [x: string]: any;
    _id: string;
    name: string;
    specialty: string;
    services?: Array<{
      id: string;
      name: string;
      price: number;
      description?: string;
      isVideoAvailable?: boolean;
    }>;
    role?: "{PROVIDER:INSTITUTION}" | "{PROVIDER:INDIVIDUAL}";
    acceptsFirstConsultation?: boolean;
    acceptsVideoConsultation?: boolean;
    selectedServices?: string | undefined;
    availabilities?: { start: string; end: string }[];
  };
  onClose: () => void;
  onSubmit: (data: BookingFormData) => void;
}

// Helper to ensure error prop is always a string (never undefined)
function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof (error as any).message === "string"
  ) {
    return (error as any).message;
  }
  return "";
}

export function BookingForm({ provider, onClose, onSubmit }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "validating" | "processing" | "success" | "error"
  >("idle");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [expandedConsignes, setExpandedConsignes] = useState<Set<number>>(
    new Set()
  );
  const [kycConsent, setKycConsent] = useState(false);
  // Indique qu'une inscription vient d'être effectuée (sans connexion auto)
  const [registrationCompleted, setRegistrationCompleted] = useState(false);

  const { user, isAuthenticated } = useAuth();

  // Fonction pour réinitialiser l'état du formulaire
  const resetFormState = () => {
    setCurrentStep(1);
    setPaymentStatus("idle");
    setPaymentError(null);
    setExpandedConsignes(new Set());
    setKycConsent(false);
    // Réinitialiser les valeurs du formulaire
    setValue("consultationMode", undefined);
    setValue("timeslot", "");
    setValue("selectedService", null);
    setValue("hasConsultedBefore", undefined);
    setValue("country", "");
    setValue("address1", "");
    setValue("address2", "");
    setValue("postalCode", "");
    setValue("city", "");
    setValue("isBillingDefault", false);
    setValue("cardNumber", "");
    setValue("expiryDate", "");
    setValue("cvv", "");
    setValue("cardholderName", "");
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    schema: bookingSchema,
    defaultValues: {
      requester: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      },
      recipient: {
        firstName: "",
        lastName: "",
        phone: "",
      },
      timeslot: "",
      selectedService: null,
      consultationMode: undefined as any,
      hasConsultedBefore: undefined as any,
      country: "",
      address1: "",
      address2: "",
      postalCode: "",
      city: "",
      isBillingDefault: false,
      // Champs de paiement
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: "",
    },
  });

  // Restaurer les données sauvegardées après connexion/inscription
  useEffect(() => {
    const savedData = localStorage.getItem("bookingFormData");
    if (savedData && isAuthenticated) {
      try {
        const formData = JSON.parse(savedData);
        // Restaurer les valeurs du formulaire
        Object.keys(formData).forEach(key => {
          if (formData[key] !== undefined && formData[key] !== null) {
            setValue(key as any, formData[key]);
          }
        });
        // Nettoyer le localStorage après restauration
        localStorage.removeItem("bookingFormData");
      } catch (error) {
        console.error("Erreur lors de la restauration des données:", error);
      }
    }
  }, [isAuthenticated, setValue]);

  // Écouter les messages de la popup d'inscription
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "REGISTRATION_SUCCESS") {
        // L'inscription a réussi, passer directement à l'étape de paiement
        setRegistrationCompleted(true);
        setCurrentStep(7);
      }
    };

    const handleFocus = () => {
      // Si une inscription/connexion vient d'être réalisée, avancer
      if (
        (registrationCompleted || (isAuthenticated && user)) &&
        currentStep === 6
      ) {
        setCurrentStep(7);
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, user, currentStep]);

  const watchedValues = watch();
  const totalSteps = 7;

  const prevModeRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const mode = String(watchedValues?.consultationMode || "");
    const videoAllowed = provider.acceptsVideoConsultation !== false;
    const prevMode = prevModeRef.current;

    const isAtSelectionStep =
      (provider.role === "{PROVIDER:INSTITUTION}" && currentStep === 1) ||
      (provider.role === "{PROVIDER:INDIVIDUAL}" && currentStep === 2);

    if (mode !== prevMode) {
      if (mode === "video" && videoAllowed && isAtSelectionStep) {
        setCurrentStep(2);
      }
      prevModeRef.current = mode;
    }
  }, [
    watchedValues?.consultationMode,
    provider.acceptsVideoConsultation,
    provider.role,
    currentStep,
  ]);

  // S'assurer que le champ timeslot est bien enregistré pour la validation
  useEffect(() => {
    register("timeslot");
  }, [register]);

  // Pré-remplissage depuis la session (si accessible)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) return;
        const data = await res.json();
        const user = data?.user || {};
        if (cancelled) return;
        const requester = watchedValues.requester || {};
        const name = typeof user.name === "string" ? user.name : "";
        const firstName = user.firstName || name.split(" ")[0] || "";
        const lastName =
          user.lastName || name.split(" ").slice(1).join(" ") || "";
        if (!requester.firstName && firstName)
          setValue("requester.firstName", firstName);
        if (!requester.lastName && lastName)
          setValue("requester.lastName", lastName);
        if (!requester.email && user.email)
          setValue("requester.email", user.email);
        if (!requester.phone && user.phone)
          setValue("requester.phone", user.phone);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [setValue, watchedValues.requester]);

  // Fonction pour traiter le paiement après l'inscription
  const processPaymentAfterRegistration = async (
    data: BookingFormData,
    paymentId: string
  ) => {
    try {
      setPaymentStatus("success");
      await new Promise(resolve => setTimeout(resolve, 800));
      await onSubmit({ ...data, paymentId });
      onClose();
    } catch (error) {
      console.error("Erreur lors du traitement du paiement:", error);
      setPaymentStatus("error");
      setPaymentError("Une erreur inattendue s'est produite");
    }
  };

  const handleFormSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    setPaymentError(null);

    try {
      // Si on est à l'étape 7, laisser StripeCheckout gérer la confirmation
      if (currentStep === 7 && isAuthenticated) {
        // Si l'utilisateur n'est pas authentifié, sauvegarder les données et ouvrir l'inscription
        if (!isAuthenticated) {
          // Calculer le prix total
          let basePrice = 0;
          if (watchedValues.consultationMode === "video") {
            // Pour les consultations vidéo, utiliser le prix du service "Consultation"
            const consultationService = provider["services"]?.find(
              (service: any) => service.name === "Consultation"
            );
            basePrice = consultationService?.price || provider["price"] || 0;
          } else {
            // Pour les autres cas, utiliser le service sélectionné ou le prix du provider
            basePrice =
              watchedValues.selectedService?.price || provider["price"] || 0;
          }
          const totalPrice = calculatePriceWithCommission(basePrice);

          // Sauvegarder les données de booking dans localStorage
          const bookingData = {
            requester: data.requester,
            recipient: data.recipient,
            country: data.country,
            address1: data.address1,
            address2: data.address2,
            postalCode: data.postalCode,
            city: data.city,
            timeslot: data.timeslot,
            selectedService: data.selectedService,
            consultationMode: data.consultationMode,
            provider: {
              id: provider._id,
              name: provider.name,
              specialty: provider.specialty,
            },
            totalPrice: totalPrice,
          };

          localStorage.setItem("bookingData", JSON.stringify(bookingData));

          // Ouvrir l'inscription dans une popup
          const popup = window.open(
            "/register-popup",
            "registerPopup",
            "width=800,height=900,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no"
          );

          // Écouter les messages de la popup
          const handleMessage = (event: MessageEvent) => {
            if (event.data.type === "REGISTRATION_SUCCESS") {
              // L'inscription a réussi, traiter le paiement
              popup?.close();
              window.removeEventListener("message", handleMessage);

              // Le paiement sera confirmé via StripeCheckout après inscription
              // Rien à faire ici
            }
          };

          window.addEventListener("message", handleMessage);

          // Nettoyer l'écouteur si la popup est fermée manuellement
          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              window.removeEventListener("message", handleMessage);
              clearInterval(checkClosed);
            }
          }, 1000);

          return;
        }

        // Le bouton de paiement Stripe prendra le relais
        return;
      } else {
        // Pour les autres étapes, soumettre normalement
        await onSubmit(data);
        onClose();
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      setPaymentStatus("error");
      setPaymentError("Une erreur inattendue s'est produite");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    const isInstitution = provider["roles"]?.includes("{PROVIDER:INSTITUTION}");
    const isIndividual = provider["roles"]?.includes("{PROVIDER:INDIVIDUAL}");
    const firstConsultationAllowed =
      provider.acceptsFirstConsultation !== false;
    const isFirstConsultation = watchedValues.hasConsultedBefore === false;

    // Gestion des cas bloquants
    if (isIndividual && isFirstConsultation && !firstConsultationAllowed) {
      return false; // Bloqué par la politique du provider
    }

    switch (currentStep) {
      case 1:
        // Étape 1: Mode de consultation ou vérification des autorisations
        if (isIndividual && isFirstConsultation && !firstConsultationAllowed) {
          return false; // Cas bloqué
        }
        if (isInstitution) {
          return !!watchedValues.consultationMode;
        }
        if (isIndividual) {
          if (typeof watchedValues.hasConsultedBefore !== "boolean")
            return false;
          return !!watchedValues.consultationMode;
        }
        return true;

      case 2:
        // Étape 2: Choix du motif (institution + cabinet) ou sélection de créneaux
        if (isInstitution && watchedValues.consultationMode === "cabinet") {
          return !!watchedValues.selectedService;
        }
        if (isIndividual && watchedValues.consultationMode === "cabinet") {
          return !!watchedValues.selectedService;
        }
        // Pour les consultations vidéo, passer directement aux créneaux
        return true;

      case 3:
        // Étape 3: Sélection des créneaux
        return !!watchedValues.timeslot;

      case 4:
        // Étape 4: Informations personnelles
        return (
          watchedValues.requester?.firstName &&
          watchedValues.requester?.lastName &&
          watchedValues.requester?.email &&
          watchedValues.requester?.phone &&
          watchedValues.recipient?.firstName &&
          watchedValues.recipient?.lastName &&
          watchedValues.recipient?.phone &&
          !errors.requester?.firstName &&
          !errors.requester?.lastName &&
          !errors.requester?.email &&
          !errors.requester?.phone &&
          !errors.recipient?.firstName &&
          !errors.recipient?.lastName &&
          !errors.recipient?.phone
        );

      case 5:
        // Étape 5: Adresse de facturation
        return (
          watchedValues.country &&
          watchedValues.address1 &&
          watchedValues.postalCode &&
          watchedValues.city &&
          !errors.country &&
          !errors.address1 &&
          !errors.postalCode &&
          !errors.city
        );

      case 6:
        // Étape 6: Informations importantes
        return kycConsent;

      case 7:
        // Étape 7: Paiement géré par Stripe Elements
        if (!isAuthenticated && !registrationCompleted) return false;
        return true;

      default:
        return true;
    }
  };

  const renderStepIndicator = () => null; // Retiré à la demande

  const renderStep1 = () => {
    const isInstitution =
      provider["roles"]?.includes("{PROVIDER:INSTITUTION}") ||
      provider.role === "{PROVIDER:INSTITUTION}";
    const isIndividual =
      provider["roles"]?.includes("{PROVIDER:INDIVIDUAL}") ||
      provider.role === "{PROVIDER:INDIVIDUAL}";
    const videoAllowed = provider.acceptsVideoConsultation !== false;
    const firstConsultationAllowed =
      provider.acceptsFirstConsultation !== false;
    const isFirstConsultation = watchedValues.hasConsultedBefore === false;

    // CAS 1: PROVIDER:INSTITUTION
    if (isInstitution) {
      // Si vidéo autorisée, proposer les deux options
      if (videoAllowed) {
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Mode de consultation
              </h3>
              <p className="text-gray-600">
                Choisissez comment vous souhaitez réaliser la consultation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setValue("consultationMode", "video")}
                className={`flex flex-col items-center justify-center p-6 border rounded-lg transition-colors
                ${
                  watchedValues.consultationMode === "video"
                    ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,95%)]"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <svg
                  className={`w-8 h-8 mb-2 ${
                    watchedValues.consultationMode === "video"
                      ? "text-[hsl(25,100%,53%)]"
                      : "text-gray-500"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium text-gray-900">Vidéo</span>
                <span className="text-sm text-gray-500">
                  Consultation à distance
                </span>
              </button>

              <button
                type="button"
                onClick={() => setValue("consultationMode", "cabinet")}
                className={`flex flex-col items-center justify-center p-6 border rounded-lg transition-colors
                ${
                  watchedValues.consultationMode === "cabinet"
                    ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,95%)]"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <svg
                  className={`w-8 h-8 mb-2 ${
                    watchedValues.consultationMode === "cabinet"
                      ? "text-[hsl(25,100%,53%)]"
                      : "text-gray-500"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="font-medium text-gray-900">Cabinet</span>
                <span className="text-sm text-gray-500">
                  Consultation en personne
                </span>
              </button>
            </div>
          </div>
        );
      } else {
        // Si vidéo non autorisée, afficher message et options
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Mode de consultation
              </h3>
              <p className="text-gray-600">
                Choisissez comment vous souhaitez réaliser la consultation
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-amber-800 mb-1">
                    Consultation vidéo non disponible
                  </h4>
                  <p className="text-sm text-amber-700">
                    {provider.name} propose uniquement des consultations en
                    cabinet. Vous pouvez contacter directement le secrétariat ou
                    choisir un autre prestataire.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option vidéo désactivée */}
              <div className="opacity-50 cursor-not-allowed">
                <div className="flex flex-col items-center justify-center p-6 border border-gray-300 rounded-lg bg-gray-50">
                  <svg
                    className="w-8 h-8 mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium text-gray-500">Vidéo</span>
                  <span className="text-sm text-gray-400">Non disponible</span>
                </div>
              </div>

              {/* Option cabinet disponible */}
              <button
                type="button"
                onClick={() => setValue("consultationMode", "cabinet")}
                className={`flex flex-col items-center justify-center p-6 border rounded-lg transition-colors
                ${
                  watchedValues.consultationMode === "cabinet"
                    ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,95%)]"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <svg
                  className={`w-8 h-8 mb-2 ${
                    watchedValues.consultationMode === "cabinet"
                      ? "text-[hsl(25,100%,53%)]"
                      : "text-gray-500"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="font-medium text-gray-900">Cabinet</span>
                <span className="text-sm text-gray-500">
                  Consultation en personne
                </span>
              </button>
            </div>
          </div>
        );
      }
    }

    // CAS 2: PROVIDER:INDIVIDUAL
    if (isIndividual) {
      // Si première consultation et non autorisée
      if (isFirstConsultation && !firstConsultationAllowed) {
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Consultation non autorisée
              </h3>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-amber-800 mb-1">
                    Ce soignant n'accepte pas de nouveaux patients
                  </h4>
                  <p className="text-sm text-amber-700">
                    Veuillez choisir un autre prestataire ou contacter
                    directement le secrétariat.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const category = provider["category"];
                  const url = category
                    ? `/services?type=${category}`
                    : "/services";
                  window.location.href = url;
                }}
                className="flex-1 bg-[hsl(25,100%,53%)] text-white py-3 px-4 rounded-md font-medium hover:bg-[hsl(25,100%,45%)] transition-colors"
              >
                Voir d&apos;autres prestataires
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue("hasConsultedBefore", undefined as any);
                  setCurrentStep(1);
                }}
                className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-md font-medium hover:bg-gray-600 transition-colors"
              >
                Retour
              </button>
            </div>
          </div>
        );
      }

      // Si première consultation autorisée ou consultation de suivi
      return (
        <div className="space-y-4">
          {/* Question: Avez-vous déjà consulté ce soignant ? */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-900 mb-2">
              Avez-vous déjà consulté ce soignant ?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setValue("hasConsultedBefore", true)}
                className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                  watchedValues.hasConsultedBefore === true
                    ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,95%)] text-[hsl(25,100%,35%)]"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                Oui
              </button>
              <button
                type="button"
                onClick={() => setValue("hasConsultedBefore", false)}
                className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                  watchedValues.hasConsultedBefore === false
                    ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,95%)] text-[hsl(25,100%,35%)]"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                Non
              </button>
            </div>
          </div>
          {/* La sélection Oui/Non ci-dessus constitue l'étape 1 pour INDIVIDUAL */}
        </div>
      );
    }

    // Fallback par défaut
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Mode de consultation
          </h3>
          <p className="text-gray-600">
            Choisissez comment vous souhaitez réaliser la consultation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videoAllowed && (
            <button
              type="button"
              onClick={() => setValue("consultationMode", "video")}
              className={`flex flex-col items-center justify-center p-6 border rounded-lg transition-colors
                ${
                  watchedValues.consultationMode === "video"
                    ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,95%)]"
                    : "border-gray-300 hover:border-gray-400"
                }`}
            >
              <svg
                className={`w-8 h-8 mb-2 ${
                  watchedValues.consultationMode === "video"
                    ? "text-[hsl(25,100%,53%)]"
                    : "text-gray-500"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="font-medium text-gray-900">Vidéo</span>
              <span className="text-sm text-gray-500">
                Consultation à distance
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setValue("consultationMode", "cabinet")}
            className={`flex flex-col items-center justify-center p-6 border rounded-lg transition-colors
              ${
                watchedValues.consultationMode === "cabinet"
                  ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,95%)]"
                  : "border-gray-300 hover:border-gray-400"
              }`}
          >
            <svg
              className={`w-8 h-8 mb-2 ${
                watchedValues.consultationMode === "cabinet"
                  ? "text-[hsl(25,100%,53%)]"
                  : "text-gray-500"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span className="font-medium text-gray-900">Cabinet</span>
            <span className="text-sm text-gray-500">
              Consultation en personne
            </span>
          </button>
        </div>
      </div>
    );
  };

  // Sélecteur de créneaux (réutilisé)
  const renderSlotPicker = () => {
    const byDay = new Map<string, { start: string; end: string }[]>();
    const now = new Date();

    (Array.isArray(provider.availabilities) ? provider.availabilities : [])
      .filter(slot => {
        // Filtrer les créneaux qui sont déjà passés
        const slotStart = new Date(slot.start);
        return slotStart > now;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()) // Trier par ordre chronologique
      .forEach(s => {
        const key = `${s.start}`.split("T")[0] || "";
        const list = byDay.get(key) || [];
        list.push(s);
        byDay.set(key, list);
      });

    if (byDay.size === 0) {
      return (
        <div className="mt-2 text-sm text-gray-500">
          Aucun créneau disponible (les créneaux passés sont automatiquement
          masqués)
        </div>
      );
    }

    return (
      <div className="mt-2 space-y-3">
        {Array.from(byDay.entries()).map(([day, slots]) => (
          <details key={day} className="rounded-md border border-gray-200">
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium bg-gray-50">
              {new Date(day).toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </summary>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 select-none">
              {slots.map((slot, idx) => {
                const value = `${slot.start}|${slot.end}`;
                const selected = watchedValues.timeslot === value;
                return (
                  <button
                    key={`${value}-${idx}`}
                    type="button"
                    onClick={() =>
                      setValue("timeslot", value, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                    className={`px-3 py-2 rounded-md border text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    aria-pressed={selected}
                  >
                    <span className="font-medium">
                      {slot.start.slice(11, 16)}
                    </span>
                    <span className="mx-1 text-gray-400">–</span>
                    <span>{slot.end.slice(11, 16)}</span>
                  </button>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    );
  };

  const renderStep2 = () => {
    const isInstitution = provider["roles"]?.includes("{PROVIDER:INSTITUTION}");
    const isIndividual =
      provider["roles"]?.includes("{PROVIDER:INDIVIDUAL}") ||
      provider.role === "{PROVIDER:INDIVIDUAL}";

    // INDIVIDUAL: si aucun mode encore choisi, afficher le choix du mode ici
    if (isIndividual && !watchedValues.consultationMode) {
      return (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Mode de consultation
            </h3>
            <p className="text-gray-600">
              Choisissez comment vous souhaitez réaliser la consultation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {provider.acceptsVideoConsultation !== false && (
              <button
                type="button"
                onClick={() => setValue("consultationMode", "video")}
                className={`flex flex-col items-center justify-center p-6 border rounded-lg transition-colors ${
                  watchedValues.consultationMode === "video"
                    ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,95%)]"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <svg
                  className={`w-8 h-8 mb-2 ${
                    watchedValues.consultationMode === "video"
                      ? "text-[hsl(25,100%,53%)]"
                      : "text-gray-500"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium text-gray-900">Vidéo</span>
                <span className="text-sm text-gray-500">
                  Consultation à distance
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setValue("consultationMode", "cabinet")}
              className={`flex flex-col items-center justify-center p-6 border rounded-lg transition-colors ${
                watchedValues.consultationMode === "cabinet"
                  ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,95%)]"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <svg
                className={`w-8 h-8 mb-2 ${
                  watchedValues.consultationMode === "cabinet"
                    ? "text-[hsl(25,100%,53%)]"
                    : "text-gray-500"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span className="font-medium text-gray-900">Cabinet</span>
              <span className="text-sm text-gray-500">
                Consultation en personne
              </span>
            </button>
          </div>
        </div>
      );
    }

    // Si consultation vidéo, afficher un message de confirmation
    if (watchedValues.consultationMode === "video") {
      return (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Consultation vidéo confirmée
            </h3>
            <p className="text-gray-600">
              Vous avez choisi une consultation vidéo. Vous pouvez maintenant
              sélectionner un créneau.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-blue-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                Consultation vidéo sélectionnée
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Si institution et cabinet, proposer sélection du motif
    if (isInstitution && watchedValues.consultationMode === "cabinet") {
      const availableServices = provider.selectedServices
        ? provider.selectedServices.split(",").map(s => s.trim())
        : [];

      return (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Motif de la consultation
            </h3>
            <p className="text-gray-600">
              Sélectionnez le motif de votre consultation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableServices.map((serviceName, index) => (
              <button
                type="button"
                key={index}
                onClick={() =>
                  setValue("selectedService", {
                    id: index,
                    name: serviceName,
                    price: provider["price"] || 0,
                  })
                }
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors
                  ${
                    watchedValues.selectedService?.name === serviceName
                      ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,95%)]"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
              >
                <span className="font-medium text-gray-900">{serviceName}</span>
                <span className="text-gray-600">
                  {calculatePriceWithCommission(provider["price"] || 0)}€
                </span>
              </button>
            ))}
          </div>
          {getErrorMessage(errors.selectedService?.message) && (
            <p className="text-red-500 text-sm">
              {getErrorMessage(errors.selectedService?.message)}
            </p>
          )}
        </div>
      );
    }

    // Pour les autres cas (individuel + cabinet), utiliser les services du provider
    const availableServices = provider.services || [];

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Motif de la consultation
          </h3>
          <p className="text-gray-600">
            Sélectionnez le service correspondant à votre consultation
          </p>
        </div>

        {availableServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableServices.map((service, index) => (
              <button
                type="button"
                key={service.id || index}
                onClick={() =>
                  setValue("selectedService", {
                    id: parseInt(service.id) || index,
                    name: service.name,
                    price: service.price,
                  })
                }
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  watchedValues.selectedService?.id ===
                  (parseInt(service.id) || index)
                    ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,95%)]"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">
                    {service.name}
                  </span>
                  <span className="text-gray-600">
                    {calculatePriceWithCommission(service.price)}€
                  </span>
                </div>
                {service.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {service.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Aucun service spécifique disponible pour ce prestataire.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Vous pourrez préciser votre motif lors de la consultation.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Créneau de consultation
        </h3>
        <p className="text-gray-600">Choisissez le créneau horaire</p>
      </div>

      {renderSlotPicker()}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Vos informations
        </h3>
        <p className="text-gray-600">
          Renseignez les informations du demandeur et du bénéficiaire
        </p>
      </div>

      {/* Demandeur */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          error={getErrorMessage(errors.requester?.firstName?.message)}
        >
          <FormLabel htmlFor="requester.firstName">
            <User className="w-4 h-4 inline mr-2" />
            Prénom du demandeur *
          </FormLabel>
          <Input
            id="requester.firstName"
            placeholder="Votre prénom"
            {...register("requester.firstName")}
          />
        </FormField>
        <FormField error={getErrorMessage(errors.requester?.lastName?.message)}>
          <FormLabel htmlFor="requester.lastName">
            <User className="w-4 h-4 inline mr-2" />
            Nom du demandeur *
          </FormLabel>
          <Input
            id="requester.lastName"
            placeholder="Votre nom"
            {...register("requester.lastName")}
          />
        </FormField>
      </div>
      <FormField error={getErrorMessage(errors.requester?.email?.message)}>
        <FormLabel htmlFor="requester.email">Email du demandeur *</FormLabel>
        <Input
          id="requester.email"
          type="email"
          placeholder="votre.email@exemple.com"
          {...register("requester.email")}
        />
      </FormField>
      <FormField error={getErrorMessage(errors.requester?.phone?.message)}>
        <FormLabel htmlFor="requester.phone">
          Téléphone du demandeur *
        </FormLabel>
        <PhoneInput
          id="requester.phone"
          value={watchedValues.requester?.phone || ""}
          onChange={v => setValue("requester.phone", v)}
          placeholder="6 12 34 56 78"
        />
      </FormField>

      {/* Bénéficiaire */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          error={getErrorMessage(errors.recipient?.firstName?.message)}
        >
          <FormLabel htmlFor="recipient.firstName">
            <User className="w-4 h-4 inline mr-2" />
            Prénom du bénéficiaire *
          </FormLabel>
          <Input
            id="recipient.firstName"
            placeholder="Prénom du bénéficiaire"
            {...register("recipient.firstName")}
          />
        </FormField>
        <FormField error={getErrorMessage(errors.recipient?.lastName?.message)}>
          <FormLabel htmlFor="recipient.lastName">
            <User className="w-4 h-4 inline mr-2" />
            Nom du bénéficiaire *
          </FormLabel>
          <Input
            id="recipient.lastName"
            placeholder="Nom du bénéficiaire"
            {...register("recipient.lastName")}
          />
        </FormField>
      </div>
      <FormField error={getErrorMessage(errors.recipient?.phone?.message)}>
        <FormLabel htmlFor="recipient.phone">
          Téléphone du bénéficiaire *
        </FormLabel>
        <PhoneInput
          id="recipient.phone"
          value={watchedValues.recipient?.phone || ""}
          onChange={v => setValue("recipient.phone", v)}
          placeholder="6 12 34 56 78"
        />
      </FormField>
    </div>
  );

  const consignes = [
    {
      id: 1,
      title: "Praticien habituel",
      short:
        "Prenez rendez-vous avec le praticien qui vous suit habituellement.",
      details:
        "Pour assurer la continuité des soins et un suivi optimal, il est recommandé de consulter le même professionnel de santé qui connaît votre historique médical. Cela permet un meilleur diagnostic et un traitement personnalisé.",
    },
    {
      id: 2,
      title: "Nouveaux patients",
      short:
        "Le médecin n&apos;accepte plus de nouveaux patients en tant que médecin traitant.",
      details:
        "En raison d&apos;une forte demande, ce praticien ne peut plus accepter de nouveaux patients comme médecin traitant principal. Vous pouvez toujours le consulter en tant que spécialiste pour des consultations ponctuelles.",
    },
    {
      id: 3,
      title: "Médecin traitant déclaré",
      short:
        "Si le docteur n&apos;est pas votre médecin traitant déclaré, contactez le secrétariat.",
      details:
        "Pour bénéficier du remboursement optimal de la Sécurité Sociale, assurez-vous que ce médecin est bien déclaré comme votre médecin traitant. Sinon, contactez le secrétariat pour les démarches administratives nécessaires.",
    },
    {
      id: 4,
      title: "Examen physique requis",
      short:
        "Pour un examen physique ou certificat d'aptitude, privilégiez la consultation en cabinet.",
      details:
        "Certains actes médicaux nécessitent un examen physique complet (auscultation, palpation, tests spécifiques). Les téléconsultations ne permettent pas de réaliser ces examens. Prévoyez une consultation en cabinet pour ces cas.",
    },
    {
      id: 5,
      title: "Un patient par rendez-vous",
      short:
        "Un rendez-vous est dédié à un seul patient. Un rendez-vous par personne pour les familles.",
      details:
        "Chaque consultation est personnalisée et nécessite un temps dédié. Pour une famille, chaque membre doit avoir son propre rendez-vous pour garantir la qualité des soins et le respect du secret médical.",
    },
    {
      id: 6,
      title: "Connexion stable",
      short:
        "Assurez-vous d'avoir une connexion internet stable pour les téléconsultations.",
      details:
        "Pour une téléconsultation de qualité, vérifiez votre connexion internet (minimum 2 Mbps), utilisez un appareil avec caméra et micro fonctionnels, et choisissez un environnement calme et bien éclairé.",
    },
    {
      id: 7,
      title: "En cas d'urgence",
      short:
        "En cas d'urgence, contactez les services d'urgence ou votre médecin traitant habituel.",
      details:
        "Les téléconsultations ne remplacent pas les urgences médicales. En cas de symptômes graves (douleur thoracique, difficultés respiratoires, perte de conscience), appelez le 15 (SAMU) ou rendez-vous aux urgences.",
    },
  ];

  const toggleConsigne = (id: number) => {
    setExpandedConsignes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderStep4ImportantInfo = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          À lire avant de prendre un rendez-vous
        </h3>
        <p className="text-gray-600">
          Veuillez prendre connaissance des informations importantes ci-dessous.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center mb-3">
          <span className="text-sm font-medium text-gray-900 mr-2">
            Motif de consultation :
          </span>
          <span className="text-sm text-gray-700 font-semibold">
            {watchedValues.consultationMode === "video"
              ? "Consultation vidéo"
              : "Consultation en cabinet"}{" "}
            - patient suivi
          </span>
        </div>

        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Consignes importantes ({consignes.length}) :
        </h4>

        <div className="space-y-2">
          {consignes.map(consigne => (
            <div
              key={consigne.id}
              className="border border-gray-200 rounded-lg"
            >
              <button
                type="button"
                onClick={() => toggleConsigne(consigne.id)}
                className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">
                  {consigne.id}. {consigne.title}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    expandedConsignes.has(consigne.id) ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {expandedConsignes.has(consigne.id) && (
                <div className="px-3 pb-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mt-2 mb-2">
                    <strong>Résumé :</strong> {consigne.short}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Détails :</strong> {consigne.details}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Checkbox de validation KYC */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={kycConsent}
              onChange={e => setKycConsent(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              J&apos;ai lu et j&apos;accepte toutes les consignes ci-dessus. Je
              comprends que ces informations sont importantes pour la qualité
              des soins et je m&apos;engage à les respecter.{" "}
              <span className="text-red-500">*</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Adresse de facturation
        </h3>
        <p className="text-gray-600">
          Renseignez votre adresse de résidence pour la facturation
        </p>
      </div>

      {/* Pays de résidence */}
      <FormField error={getErrorMessage(errors.country?.message)}>
        <FormLabel htmlFor="country">
          <MapPin className="w-4 h-4 inline mr-2" />
          Pays de résidence *
        </FormLabel>
        <Input id="country" placeholder="France" {...register("country")} />
      </FormField>

      {/* Adresse 1 - obligatoire */}
      <FormField error={getErrorMessage(errors.address1?.message)}>
        <FormLabel htmlFor="address1">
          <MapPin className="w-4 h-4 inline mr-2" />
          Adresse 1 *
        </FormLabel>
        <Input
          id="address1"
          placeholder="123 Rue de la Paix"
          {...register("address1")}
        />
      </FormField>

      {/* Adresse 2 - facultative */}
      <FormField error={getErrorMessage(errors.address2?.message)}>
        <FormLabel htmlFor="address2">
          <MapPin className="w-4 h-4 inline mr-2" />
          Adresse 2 (facultatif)
        </FormLabel>
        <Input
          id="address2"
          placeholder="Appartement 4B, Bâtiment A"
          {...register("address2")}
        />
      </FormField>

      {/* Code postal et ville */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField error={getErrorMessage(errors.postalCode?.message)}>
          <FormLabel htmlFor="postalCode">
            <MapPin className="w-4 h-4 inline mr-2" />
            Code postal *
          </FormLabel>
          <Input
            id="postalCode"
            placeholder="75001"
            {...register("postalCode")}
          />
        </FormField>
        <FormField error={getErrorMessage(errors.city?.message)}>
          <FormLabel htmlFor="city">
            <MapPin className="w-4 h-4 inline mr-2" />
            Ville *
          </FormLabel>
          <Input id="city" placeholder="Paris" {...register("city")} />
        </FormField>
      </div>

      {/* Bouton pour ajouter d'autres adresses */}
      <div className="pt-4">
        <button
          type="button"
          className="text-[hsl(25,100%,53%)] hover:text-[hsl(25,100%,45%)] text-sm font-medium flex items-center"
        >
          <span className="mr-2">+</span>
          Ajouter une autre adresse
        </button>
      </div>

      {/* Checkbox pour adresse par défaut de facturation */}
      <div className="pt-4 border-t">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            {...register("isBillingDefault")}
            className="rounded border-gray-300 text-[hsl(25,100%,53%)] focus:ring-[hsl(25,100%,53%)]"
          />
          <span className="text-sm text-gray-700">
            Utiliser cette adresse comme adresse par défaut de facturation
          </span>
        </label>
      </div>

      {/* Note pour l'API GeoLocation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note :</strong> À l&apos;avenir, vous pourrez remplir
          automatiquement ces informations grâce à l&apos;API GeoLocation.
        </p>
      </div>
    </div>
  );

  const renderStep6 = () => {
    if (!isAuthenticated && !registrationCompleted) {
      // Utilisateur non connecté - afficher les options de connexion/inscription
      return (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connexion requise
            </h3>
            <p className="text-gray-600">
              Vous devez être connecté pour procéder au paiement
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Lock className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Vos informations sont sauvegardées
                </h4>
                <p className="text-sm text-blue-800">
                  Toutes les informations que vous avez saisies seront
                  conservées et pré-remplies lors de votre inscription ou
                  connexion.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              className="w-full bg-[hsl(25,100%,53%)] text-white py-3 px-4 rounded-md font-medium hover:bg-[hsl(25,100%,45%)] transition-colors"
              onClick={() => {
                const formData = {
                  requester: watchedValues.requester,
                  recipient: watchedValues.recipient,
                  timeslot: watchedValues.timeslot,
                  selectedService: watchedValues.selectedService,
                  consultationMode: watchedValues.consultationMode,
                  hasConsultedBefore: watchedValues.hasConsultedBefore,
                  country: watchedValues.country,
                  address1: watchedValues.address1,
                  address2: watchedValues.address2,
                  postalCode: watchedValues.postalCode,
                  city: watchedValues.city,
                  isBillingDefault: watchedValues.isBillingDefault,
                };
                localStorage.setItem("bookingData", JSON.stringify(formData));
                // Ouvrir la connexion dans une nouvelle fenêtre
                window.open(
                  "/login",
                  "_blank",
                  "width=800,height=600,scrollbars=yes,resizable=yes"
                );
              }}
            >
              Se connecter
            </button>

            <button
              type="button"
              className="w-full bg-white border border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)] py-3 px-4 rounded-md font-medium hover:bg-[hsl(25,100%,53%)] hover:text-white transition-colors"
              onClick={() => {
                // Sauvegarder les données du formulaire
                const formData = {
                  requester: watchedValues.requester,
                  recipient: watchedValues.recipient,
                  timeslot: watchedValues.timeslot,
                  selectedService: watchedValues.selectedService,
                  consultationMode: watchedValues.consultationMode,
                  hasConsultedBefore: watchedValues.hasConsultedBefore,
                  country: watchedValues.country,
                  address1: watchedValues.address1,
                  address2: watchedValues.address2,
                  postalCode: watchedValues.postalCode,
                  city: watchedValues.city,
                  isBillingDefault: watchedValues.isBillingDefault,
                };
                localStorage.setItem("bookingData", JSON.stringify(formData));
                // Ouvrir l'inscription dans une nouvelle page
                window.open(
                  "/register-popup",
                  "_blank",
                  "width=800,height=600,scrollbars=yes,resizable=yes"
                );
              }}
            >
              Créer un compte
            </button>
          </div>
        </div>
      );
    }

    // Utilisateur connecté - afficher la modal de paiement
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Paiement sécurisé
          </h3>
          <p className="text-gray-600">
            Finalisez votre réservation en saisissant vos informations de
            paiement
          </p>
        </div>

        {/* <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <User className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">
                Connecté en tant que {user?.name || user?.email}
              </p>
              <p className="text-xs text-green-700">
                Vos informations sont sécurisées
              </p>
            </div>
          </div>
        </div> */}

        {/* Formulaire de paiement */}
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Paiement sécurisé
            </h4>

            {(() => {
              let basePrice = 0;
              if (watchedValues.consultationMode === "video") {
                const consultationService = provider["services"]?.find(
                  (service: any) => service.name === "Consultation"
                );
                basePrice =
                  consultationService?.price || provider["price"] || 0;
              } else {
                basePrice =
                  watchedValues.selectedService?.price ||
                  provider["price"] ||
                  0;
              }
              const totalPrice = calculatePriceWithCommission(basePrice);
              const amountInCents = Math.round(totalPrice * 100);
              return (
                <StripeCheckout
                  amountInMinorUnit={amountInCents}
                  currency="eur"
                  customerEmail={watchedValues?.requester?.email}
                  metadata={{
                    providerId: String(provider._id || ""),
                    consultationMode: String(
                      watchedValues.consultationMode || ""
                    ),
                  }}
                  onSuccess={async (paymentId: string) => {
                    setPaymentStatus("success");
                    await onSubmit({
                      ...watchedValues,
                      paymentId,
                    } as any);
                    onClose();
                  }}
                  onError={(msg: string) => {
                    setPaymentStatus("error");
                    setPaymentError(msg);
                  }}
                />
              );
            })()}
          </div>

          {/* Résumé de la commande */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Résumé de votre commande
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium">
                  {(() => {
                    // Pour les consultations vidéo, forcer le service à "Consultation"
                    if (watchedValues.consultationMode === "video") {
                      return "Consultation";
                    }
                    return (
                      watchedValues.selectedService?.name || "Consultation"
                    );
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prestataire:</span>
                <span className="font-medium">{provider.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {watchedValues.timeslot
                    ? (() => {
                        // Extraire la partie start de la valeur "start|end"
                        const startTime = watchedValues.timeslot.split("|")[0];
                        if (!startTime) return "Date invalide";
                        return new Date(startTime).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        });
                      })()
                    : "Non sélectionné"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prix de base:</span>
                <span className="font-medium">
                  {(() => {
                    // Pour les consultations vidéo, utiliser le prix du service "Consultation"
                    if (watchedValues.consultationMode === "video") {
                      // Chercher le service "Consultation" dans les services du provider
                      const consultationService = provider["services"]?.find(
                        (service: any) => service.name === "Consultation"
                      );
                      return (
                        consultationService?.price || provider["price"] || 0
                      );
                    }
                    // Pour les autres cas, utiliser le service sélectionné ou le prix du provider
                    return (
                      watchedValues.selectedService?.price ||
                      provider["price"] ||
                      0
                    );
                  })()}
                  €
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-[hsl(25,100%,53%)]">
                  {(() => {
                    // Calculer le prix de base selon le mode de consultation
                    let basePrice = 0;
                    if (watchedValues.consultationMode === "video") {
                      // Pour les consultations vidéo, utiliser le prix du service "Consultation"
                      const consultationService = provider["services"]?.find(
                        (service: any) => service.name === "Consultation"
                      );
                      basePrice =
                        consultationService?.price || provider["price"] || 0;
                    } else {
                      // Pour les autres cas, utiliser le service sélectionné ou le prix du provider
                      basePrice =
                        watchedValues.selectedService?.price ||
                        provider["price"] ||
                        0;
                    }
                    return calculatePriceWithCommission(basePrice);
                  })()}
                  €
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                (incl. commission DiaspoMoney 20%)
              </div>
            </div>
          </div>

          {/* Statut de paiement */}
          {paymentStatus !== "idle" && (
            <div
              className={`rounded-lg p-4 ${
                paymentStatus === "success"
                  ? "bg-green-50 border border-green-200"
                  : paymentStatus === "error"
                  ? "bg-red-50 border border-red-200"
                  : "bg-blue-50 border border-blue-200"
              }`}
            >
              <div className="flex items-center">
                {paymentStatus === "success" && (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                )}
                {paymentStatus === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                {paymentStatus === "validating" && (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                )}
                {paymentStatus === "processing" && (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                )}

                <div>
                  {paymentStatus === "validating" && (
                    <p className="text-sm font-medium text-blue-900">
                      Validation de votre carte en cours...
                    </p>
                  )}
                  {paymentStatus === "processing" && (
                    <p className="text-sm font-medium text-blue-900">
                      Traitement du paiement en cours...
                    </p>
                  )}
                  {paymentStatus === "success" && (
                    <p className="text-sm font-medium text-green-900">
                      Paiement validé avec succès !
                    </p>
                  )}
                  {paymentStatus === "error" && (
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Erreur lors du paiement
                      </p>
                      {paymentError && (
                        <p className="text-xs text-red-700 mt-1">
                          {paymentError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sécurité */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center">
              <Lock className="w-4 h-4 text-blue-600 mr-2" />
              <p className="text-xs text-blue-800">
                <strong>Sécurisé par Stripe</strong> - Vos informations de
                paiement sont chiffrées et ne sont jamais stockées sur nos
                serveurs.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5(); // Adresse de facturation
      case 6:
        return renderStep4ImportantInfo(); // Consignes importantes
      case 7:
        return renderStep6(); // Paiement
      default:
        return null;
    }
  };

  const renderNavigationButtons = () => {
    const isIndividual =
      provider["roles"]?.includes("{PROVIDER:INDIVIDUAL}") ||
      provider.role === "{PROVIDER:INDIVIDUAL}";
    const firstConsultationAllowed =
      provider.acceptsFirstConsultation !== false;
    const isFirstConsultation = watchedValues.hasConsultedBefore === false;

    const shouldHideFooter =
      currentStep === 1 &&
      isIndividual &&
      isFirstConsultation &&
      !firstConsultationAllowed;

    if (shouldHideFooter) return null;

    return (
      <div className="flex justify-between pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={
            currentStep === 1
              ? () => {
                  resetFormState();
                  onClose();
                }
              : prevStep
          }
          disabled={isSubmitting}
        >
          {currentStep === 1 ? "Annuler" : "Précédent"}
        </Button>

        {currentStep < totalSteps ? (
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              // Si la vidéo n'est pas autorisée et qu'aucun mode n'est sélectionné, rediriger vers /services
              if (
                provider.acceptsVideoConsultation === false &&
                !watchedValues.consultationMode
              ) {
                window.location.href = "/services";
                return;
              }
              nextStep();
            }}
            disabled={!canProceedToNext() || isSubmitting}
            data-testid="next-button"
          >
            {provider.acceptsVideoConsultation === false &&
            !watchedValues.consultationMode
              ? "Voir d'autres prestataires"
              : "Suivant"}
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            disabled={
              !canProceedToNext() ||
              isSubmitting ||
              paymentStatus === "validating" ||
              paymentStatus === "processing"
            }
            isLoading={
              isSubmitting ||
              paymentStatus === "validating" ||
              paymentStatus === "processing"
            }
          >
            {currentStep === 7
              ? paymentStatus === "validating"
                ? "Validation en cours..."
                : paymentStatus === "processing"
                ? "Traitement du paiement..."
                : paymentStatus === "success"
                ? "Paiement validé !"
                : "Payer et confirmer"
              : "Confirmer le rendez-vous"}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-6 w-[90vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] xl:w-[50vw] mx-4 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Prise de rendez-vous
        </h2>
        <button
          title="Fermer"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
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

      {renderStepIndicator()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 w-full">
          <Form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="w-full">{renderCurrentStep()}</div>
            {renderNavigationButtons()}
          </Form>
        </div>
        <aside className="lg:col-span-1">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Prestataire
            </h4>
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">{provider.name}</p>
              <p className="text-gray-600 mb-3">{provider.specialty}</p>
            </div>
          </div>

          {/* Résumé RDV */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white mt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Votre rendez-vous en détail
            </h4>
            <div className="text-sm text-gray-700 space-y-1">
              {String(watchedValues.consultationMode) === "cabinet" ? (
                <p>• Au cabinet</p>
              ) : (
                <p>• Conultation vidéo</p>
              )}
              {watchedValues.selectedService?.name && (
                <p>• {watchedValues.selectedService.name}</p>
              )}
              {watchedValues.timeslot &&
                (() => {
                  const [startIso, endIso] = String(
                    watchedValues.timeslot
                  ).split("|");
                  const formatTime = (iso?: string) =>
                    iso
                      ? new Date(iso).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      : "";
                  const formatDate = (iso?: string) =>
                    iso
                      ? new Date(iso).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "";
                  return (
                    <p>
                      • {formatDate(startIso)}
                      {" de "}
                      {formatTime(startIso)} – {formatTime(endIso)}
                    </p>
                  );
                })()}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
