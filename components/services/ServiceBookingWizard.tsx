"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { Check, ArrowRight, ArrowLeft, CreditCard, User, Phone, Mail, MapPin, Heart, GraduationCap, Home, Clock, ShoppingCart } from "lucide-react";
import { StripeCheckout } from "@/components/payments/StripeCheckout";
import { ServiceBookingSidebar } from "./ServiceBookingSidebar";
import { useNotificationManager } from "@/components/ui/Notification";
import { childLogger } from "@/lib/logger";
import type {
  ServiceType,
  ServiceBookingState,
  ServiceBookingWizardProps,
  ServiceBookingRequestData,
  ServiceBookingApiResponse,
  ValidationError,
} from "@/lib/types/service-booking.types";
import type { ServiceOption } from "@/lib/types/service-options.types";
import { SPECIALITY_TYPES, CURRENCIES } from "@/lib/constants";

// Créer un logger avec contexte pour ce composant
const logger = childLogger({ component: 'ServiceBookingWizard' });

// ServiceBookingWizardProps est maintenant importé depuis lib/types/service-booking.types

// Services disponibles par type
// Utilise les constantes centralisées SPECIALITY_TYPES
const AVAILABLE_SERVICES: Record<string, ServiceOption[]> = {
  [SPECIALITY_TYPES.HEALTH]: [
    {
      id: "consultation-general",
      category: SPECIALITY_TYPES.HEALTH,
      label: "Consultation générale",
      description: "Consultation avec un médecin généraliste",
      price: 30,
      optional: false,
    },
    {
      id: "consultation-specialist",
      category: SPECIALITY_TYPES.HEALTH,
      label: "Consultation spécialisée",
      description: "Consultation avec un médecin spécialiste",
      price: 50,
      optional: false,
    },
    {
      id: "teleconsultation",
      category: SPECIALITY_TYPES.HEALTH,
      label: "Téléconsultation",
      description: "Consultation médicale à distance",
      price: 25,
      optional: false,
    },
  ],
  [SPECIALITY_TYPES.EDUCATION]: [
    {
      id: "devis-education",
      category: SPECIALITY_TYPES.EDUCATION,
      label: "Devis éducation",
      description: "Devis pour les études supérieures et universitaires",
      price: 20,
      optional: false,
    },
    {
      id: "school-fees",
      category: SPECIALITY_TYPES.EDUCATION,
      label: "Frais de scolarité",
      description: "Paiement des frais de scolarité",
      price: 0, // À définir selon l'établissement
      optional: false,
    },
    {
      id: "supplies",
      category: SPECIALITY_TYPES.EDUCATION,
      label: "Fournitures scolaires",
      description: "Devis pour les fournitures scolaires",
      price: 20,
      optional: false,
    },
    {
      id: "school-transportation",
      category: SPECIALITY_TYPES.EDUCATION,
      label: "Transport scolaire",
      description: "Paiement des frais de transport scolaire",
      price: 100,
      optional: false,
    },
  ],
  [SPECIALITY_TYPES.BTP]: [
    {
      id: "housing-search",
      category: SPECIALITY_TYPES.BTP,
      label: "Recherche de logement",
      description: "Accompagnement dans la recherche de logement",
      price: 100,
      optional: false,
    },
    {
      id: "property-visit",
      category: SPECIALITY_TYPES.BTP,
      label: "Visite de propriété",
      description: "Organisation de visite avec un professionnel",
      price: 50,
      optional: true,
    },
    {
      id: "construction-quote",
      category: SPECIALITY_TYPES.BTP,
      label: "Devis construction",
      description: "Devis pour travaux de construction",
      price: 150,
      optional: false,
    },
    {
      id: "renovation-quote",
      category: SPECIALITY_TYPES.BTP,
      label: "Devis rénovation",
      description: "Devis pour travaux de rénovation",
      price: 100,
      optional: false,
    },
  ],
};

// Options supplémentaires disponibles
const ADDITIONAL_OPTIONS: ServiceOption[] = [
  {
    id: "urgent",
    category: "priority",
    label: "Traitement urgent",
    description: "Traitement prioritaire sous 24h",
    price: 20,
    optional: true,
  },
  {
    id: "insurance",
    category: "insurance",
    label: "Assurance incluse",
    description: "Assurance couvrant le service",
    price: 15,
    optional: true,
  },
  {
    id: "follow-up",
    category: "support",
    label: "Suivi personnalisé",
    description: "Suivi dédié par un Country Sales Manager",
    price: 30,
    optional: true,
  },
];

// Clé pour le localStorage
const STORAGE_KEY = 'serviceBookingData';

// Fonction pour charger les données depuis localStorage
const loadFromStorage = (initialServiceType: ServiceType | null): ServiceBookingState | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Vérifier que le type de service correspond
      if (parsed.serviceType === initialServiceType || !initialServiceType) {
        return parsed;
      }
    }
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la lecture du cache');
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
};

// Fonction pour sauvegarder dans localStorage
const saveToStorage = (state: ServiceBookingState) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la sauvegarde du cache');
  }
};

// Fonction pour nettoyer le localStorage
const clearStorage = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};

export function ServiceBookingWizard({
  initialServiceType,
  onComplete,
  onCancel,
}: ServiceBookingWizardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const notificationManager = useNotificationManager();
  
  // État initial : charger depuis localStorage ou créer un nouvel état
  const initialState = (): ServiceBookingState => {
    const saved = loadFromStorage(initialServiceType ?? null);
    if (saved) {
      return {
        ...saved,
        serviceType: initialServiceType ?? saved.serviceType,
        currentStep: saved.currentStep || 1,
      };
    }
    return {
      currentStep: 1,
      serviceType: initialServiceType ?? null,
      clientInfo: {},
      beneficiaryInfo: {},
      selectedService: null,
      additionalOptions: [],
      paymentIntentId: null,
      paymentConfirmed: false,
      availability: {
        selectedDate: null,
        selectedTime: null,
      },
      totalAmount: 0,
    };
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<ServiceBookingState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [confirmedReservationNumber, setConfirmedReservationNumber] = useState<string | null>(null);

  // Restaurer l'étape depuis le cache
  // Nettoyer le cache si le paiement est déjà confirmé (pour éviter les doublons)
  useEffect(() => {
    const saved = loadFromStorage(initialServiceType ?? null);
    if (saved) {
      // Si le paiement est confirmé, nettoyer le cache pour éviter les réservations en double
      if (saved.paymentConfirmed && saved.paymentIntentId) {
        clearStorage();
        // Réinitialiser l'état
        setState({
          currentStep: 1,
          serviceType: initialServiceType || null,
          clientInfo: {},
          beneficiaryInfo: {},
          selectedService: null,
          additionalOptions: [],
          paymentIntentId: null,
          paymentConfirmed: false,
          availability: {
            selectedDate: null,
            selectedTime: null,
          },
          totalAmount: 0,
        });
        setCurrentStep(1);
      } else if (saved.currentStep) {
        setCurrentStep(saved.currentStep);
      }
    }
  }, [initialServiceType]);

  // Pré-remplir les informations client si connecté (seulement si pas déjà dans le cache)
  useEffect(() => {
    if (isAuthenticated && user) {
      const saved = loadFromStorage(initialServiceType ?? null);
      // Ne pré-remplir que si les données ne sont pas déjà dans le cache
      if (!saved || !saved.clientInfo?.email) {
        const nameParts = user.name?.split(" ") || [];
        setState((prev) => ({
          ...prev,
          clientInfo: {
            firstName: nameParts[0] || prev.clientInfo?.firstName || "",
            lastName: nameParts.slice(1).join(" ") || prev.clientInfo?.lastName || "",
            phone: user.phone || prev.clientInfo?.phone || "",
            email: user.email || prev.clientInfo?.email || "",
          },
        }));
      }
    }
  }, [isAuthenticated, user, initialServiceType]);

  // Sauvegarder dans localStorage à chaque modification du state
  // Utiliser un debounce pour éviter trop d'écritures
  // Ne pas sauvegarder si on est à l'étape 4 (confirmation) pour éviter de sauvegarder l'état réinitialisé
  useEffect(() => {
    // Ne pas sauvegarder si on est à l'étape de confirmation (étape 4)
    // car le cache a déjà été nettoyé après la soumission réussie
    if (currentStep === 4) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      saveToStorage({
        ...state,
        currentStep, // Inclure l'étape actuelle dans la sauvegarde
      });
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [state, currentStep]);

  // Calculer le montant total
  useEffect(() => {
    const basePrice = state.selectedService?.price || 0;
    const optionsPrice = state.additionalOptions.reduce(
      (sum, opt) => sum + opt.price,
      0,
    );
    setState((prev) => ({
      ...prev,
      totalAmount: basePrice + optionsPrice,
    }));
  }, [state.selectedService, state.additionalOptions]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: { // Informations client, bénéficiaire et disponibilités (uniquement pour HEALTH)
        const baseValidation = (
          !!state.clientInfo.firstName &&
          !!state.clientInfo.lastName &&
          !!state.clientInfo.phone &&
          !!state.clientInfo.email &&
          !!state.beneficiaryInfo.firstName &&
          !!state.beneficiaryInfo.lastName &&
          !!state.beneficiaryInfo.phone
        );
        // Les disponibilités ne sont requises que pour le type HEALTH
        if (state.serviceType === SPECIALITY_TYPES.HEALTH) {
          return baseValidation && !!state.availability.selectedDate && !!state.availability.selectedTime;
        }
        return baseValidation;
      }
      case 2: // Sélection du service et options
        return state.selectedService !== null; // Le service est requis, les options sont optionnelles
      case 3: // Paiement
        return state.paymentConfirmed && state.paymentIntentId !== null;
      case 4: // Confirmation
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      setState((prev) => ({ ...prev, currentStep: currentStep + 1 }));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setState((prev) => ({ ...prev, currentStep: currentStep - 1 }));
  };


  const handleServiceSelect = (service: ServiceOption) => {
    setState((prev) => ({
      ...prev,
      selectedService: {
        serviceId: service.id,
        category: service.category,
        label: service.label,
        description: service.description,
        price: service.price,
        options: [],
      },
    }));
  };

  const handleToggleOption = (option: ServiceOption) => {
    setState((prev) => {
      const exists = prev.additionalOptions.some((opt) => opt.id === option.id);
      if (exists) {
        return {
          ...prev,
          additionalOptions: prev.additionalOptions.filter(
            (opt) => opt.id !== option.id,
          ),
        };
      } else {
        return {
          ...prev,
          additionalOptions: [...prev.additionalOptions, option],
        };
      }
    });
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    // Le paiement a été confirmé avec succès dans StripeCheckout
    // On met à jour l'état pour indiquer que le paiement est confirmé
    setState((prev) => ({ 
      ...prev, 
      paymentIntentId,
      paymentConfirmed: true, 
    }));
    // Ne pas passer automatiquement à l'étape suivante
    // L'utilisateur doit cliquer sur "Suivant" après avoir vu la confirmation
  };

  const handleFinalSubmit = async () => {
    // Empêcher les doubles soumissions
    if (isSubmitting) {
      return;
    }

    // Validation côté client avant l'envoi
    if (!state.serviceType) {
      alert("Veuillez sélectionner un type de service");
      return;
    }
    
    if (!state.clientInfo.firstName || !state.clientInfo.lastName || !state.clientInfo.phone || !state.clientInfo.email) {
      alert("Veuillez remplir toutes les informations client (prénom, nom, téléphone, email)");
      return;
    }
    
    if (!state.beneficiaryInfo.firstName || !state.beneficiaryInfo.lastName || !state.beneficiaryInfo.phone) {
      alert("Veuillez remplir toutes les informations bénéficiaire (prénom, nom, téléphone)");
      return;
    }
    
    if (!state.selectedService) {
      alert("Veuillez sélectionner un service");
      return;
    }
    
    if (!state.paymentIntentId) {
      alert("Le paiement n'a pas été validé. Veuillez compléter le paiement avant de confirmer.");
      return;
    }
    
    // Les disponibilités ne sont requises que pour le type HEALTH
    if (state.serviceType === SPECIALITY_TYPES.HEALTH) {
      if (!state.availability.selectedDate || !state.availability.selectedTime) {
        alert("Veuillez sélectionner une date et une heure de disponibilité");
        return;
      }
    }

    setIsSubmitting(true);
    
    // Préparer les données avec tous les champs requis (déclaré avant le try pour être accessible dans le catch)
    let requestData: ServiceBookingRequestData;
    
    try {
      // Construire les données de requête avec validation
      const baseRequestData = {
        serviceType: state.serviceType!,
        clientInfo: {
          firstName: state.clientInfo.firstName!,
          lastName: state.clientInfo.lastName!,
          phone: state.clientInfo.phone!,
          email: state.clientInfo.email!,
        },
        beneficiaryInfo: {
          firstName: state.beneficiaryInfo.firstName!,
          lastName: state.beneficiaryInfo.lastName!,
          phone: state.beneficiaryInfo.phone!,
          ...(state.beneficiaryInfo.email && { email: state.beneficiaryInfo.email }),
          ...(state.beneficiaryInfo.location && { location: state.beneficiaryInfo.location }),
        },
        selectedService: {
          serviceId: state.selectedService!.serviceId,
          category: state.selectedService!.category,
          label: state.selectedService!.label,
          description: state.selectedService!.description,
          price: state.selectedService!.price,
          options: state.selectedService!.options || [],
        },
        additionalOptions: state.additionalOptions,
        paymentIntentId: state.paymentIntentId!,
      };

      // Ajouter les disponibilités uniquement pour HEALTH
      if (state.serviceType === SPECIALITY_TYPES.HEALTH) {
        requestData = {
          ...baseRequestData,
          appointmentDate: state.availability.selectedDate!,
          appointmentTime: state.availability.selectedTime!,
        } as ServiceBookingRequestData;
      } else {
        requestData = baseRequestData as ServiceBookingRequestData;
      }

      logger.info({ serviceType: state.serviceType, bookingData: requestData }, 'Envoi des données de réservation');

      const response = await fetch("/api/services/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      // Lire la réponse même en cas d'erreur pour obtenir le message détaillé
      const data = await response.json() as ServiceBookingApiResponse;

      if (!response.ok) {
        // Afficher le message d'erreur détaillé de l'API
        let errorMessage: string = typeof data.error === 'string' 
          ? data.error 
          : data.message || `Erreur HTTP: ${response.status}`;
        
        // Si c'est une erreur de validation, afficher les détails
        if (data.errors && Array.isArray(data.errors)) {
          const validationErrors = data.errors.map((err: string | ValidationError) => {
            if (typeof err === 'string') return err;
            return err.path ? `${err.path.join('.')}: ${err.message}` : err.message;
          }).join('\n');
          errorMessage = `Erreurs de validation:\n${validationErrors}`;
        } else if (data.error && typeof data.error === 'object' && !('path' in data.error)) {
          // Si l'erreur est un objet avec des détails (mais pas une ValidationError)
          errorMessage = JSON.stringify(data.error, null, 2);
        }
        
        logger.error(
          {
            status: response.status,
            statusText: response.statusText,
            error: data.error,
            serviceType: state.serviceType,
            errorMessage,
          },
          'Erreur lors de la création de la réservation'
        );
        
        notificationManager.addError(`Erreur lors de l'enregistrement: ${errorMessage}`);
        setIsSubmitting(false);
        return;
      }

      if (data.success) {
        // Extraire l'ID de la réservation depuis différentes structures de réponse possibles
        const bookingId = data.bookingId || 
                         data.booking?.id || 
                         data.booking?._id ||
                         (typeof data.bookingId === 'string' ? data.bookingId : null);
        
        // Extraire le numéro de réservation si disponible
        const reservationNumber = data.reservationNumber ||
                                 data.booking?.reservationNumber || 
                                 null;
        
        if (!bookingId) {
          logger.warn({ responseData: data }, 'Booking created but no bookingId in response');
        }
        
        // 1. Nettoyer le cache IMMÉDIATEMENT après une soumission réussie
        // Cela empêche le useEffect de sauvegarder l'état réinitialisé
        clearStorage();
        
        // 2. Stocker les informations de confirmation pour l'affichage
        if (bookingId) {
          setConfirmedBookingId(bookingId);
          if (reservationNumber) {
            setConfirmedReservationNumber(reservationNumber);
          }
          
          logger.info({
            bookingId,
            reservationNumber,
            serviceType: state.serviceType,
            totalAmount: state.totalAmount,
          }, 'Réservation créée avec succès');
          
          notificationManager.addSuccess(
            `Réservation confirmée ! Numéro: ${reservationNumber || bookingId}`,
          );
          
          onComplete?.(bookingId);
        }
        
        // 3. Passer à l'étape de confirmation (étape 4)
        // Les données restent dans l'état pour l'affichage de confirmation
        setCurrentStep(4);
        setIsSubmitting(false);
        
        // Note: L'état n'est pas réinitialisé immédiatement pour permettre l'affichage
        // des informations de confirmation. Il sera réinitialisé quand l'utilisateur
        // quittera la page ou cliquera sur "Voir mes réservations"
      } else {
        const errorMessage = data.error || "Une erreur est survenue lors de l'enregistrement de la réservation";
        alert(errorMessage);
        setIsSubmitting(false);
      }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        logger.error({
          error: errorMessage,
          serviceType: state.serviceType,
          stack: errorStack,
        }, 'Erreur lors de la soumission de la réservation');
        
        notificationManager.addError(
          `Une erreur est survenue lors de la soumission: ${errorMessage}. Veuillez réessayer.`,
        );
        setIsSubmitting(false);
      }
  };

  // Configuration du type de service pour l'affichage
  const getServiceTypeConfig = () => {
    if (!state.serviceType) return null;
    
    switch (state.serviceType) {
      case SPECIALITY_TYPES.HEALTH:
        return {
          label: 'Santé',
          icon: <Heart className="w-5 h-5" />,
          color: 'bg-red-100 text-red-800 border-red-200',
        };
      case SPECIALITY_TYPES.EDUCATION:
        return {
          label: 'Éducation',
          icon: <GraduationCap className="w-5 h-5" />,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case SPECIALITY_TYPES.BTP:
        return {
          label: 'Immobilier',
          icon: <Home className="w-5 h-5" />,
          color: 'bg-green-100 text-green-800 border-green-200',
        };
      default:
        return null;
    }
  };

  const serviceTypeConfig = getServiceTypeConfig();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section avec rappel du type de service */}
      {serviceTypeConfig && (
        <div className={`bg-gradient-to-r ${
          state.serviceType === SPECIALITY_TYPES.HEALTH 
            ? 'from-red-50 to-red-100' 
            : state.serviceType === SPECIALITY_TYPES.EDUCATION
            ? 'from-blue-50 to-blue-100'
            : 'from-green-50 to-green-100'
        } border-b border-gray-200`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  state.serviceType === SPECIALITY_TYPES.HEALTH 
                    ? 'bg-red-100' 
                    : state.serviceType === SPECIALITY_TYPES.EDUCATION
                    ? 'bg-blue-100'
                    : 'bg-green-100'
                }`}>
                  {serviceTypeConfig.icon}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Réservation - Service {serviceTypeConfig.label}
                  </h1>
                  <p className="text-gray-600">
                    {state.serviceType === SPECIALITY_TYPES.HEALTH && 
                      "Accès à un réseau de professionnels de santé certifiés pour vous et vos proches"}
                    {state.serviceType === SPECIALITY_TYPES.EDUCATION && 
                      "Paiement direct et sécurisé des frais d'éducation pour vos proches"}
                    {state.serviceType === SPECIALITY_TYPES.BTP && 
                      "Accompagnement dans la recherche, la location et la construction de biens immobiliers"}
                  </p>
                </div>
              </div>
              <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border ${serviceTypeConfig.color} bg-white`}>
                {serviceTypeConfig.icon}
                <span className="font-semibold">{serviceTypeConfig.label}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Formulaire */}
          <div className="lg:col-span-2">
            {/* Step Content */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              {/* Message informatif sur la sauvegarde automatique */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Vos données sont sauvegardées automatiquement. Vous pouvez quitter et revenir plus tard sans perdre vos informations.</span>
              </div>

              {/* Step 1: Client and Beneficiary Info */}
              {currentStep === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Informations</h2>
            <div className="space-y-6">
              {/* Client Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Vos informations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="client-firstname" className="block text-sm font-medium mb-1">
                      Prénom *
                    </label>
                    <input
                      id="client-firstname"
                      type="text"
                      value={state.clientInfo.firstName || ""}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          clientInfo: {
                            ...prev.clientInfo,
                            firstName: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                      aria-label="Prénom du client"
                    />
                  </div>
                  <div>
                    <label htmlFor="client-lastname" className="block text-sm font-medium mb-1">
                      Nom *
                    </label>
                    <input
                      id="client-lastname"
                      type="text"
                      value={state.clientInfo.lastName || ""}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          clientInfo: {
                            ...prev.clientInfo,
                            lastName: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                      aria-label="Nom du client"
                    />
                  </div>
                  <div>
                    <label htmlFor="client-phone" className="text-sm font-medium mb-1 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Téléphone *
                    </label>
                    <input
                      id="client-phone"
                      type="tel"
                      value={state.clientInfo.phone || ""}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          clientInfo: {
                            ...prev.clientInfo,
                            phone: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                      aria-label="Téléphone du client"
                    />
                  </div>
                  <div>
                    <label htmlFor="client-email" className="text-sm font-medium mb-1 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email *
                    </label>
                    <input
                      id="client-email"
                      type="email"
                      value={state.clientInfo.email || ""}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          clientInfo: {
                            ...prev.clientInfo,
                            email: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                      aria-label="Email du client"
                    />
                  </div>
                </div>
              </div>

              {/* Beneficiary Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations du bénéficiaire
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="beneficiary-firstname" className="block text-sm font-medium mb-1">
                      Prénom *
                    </label>
                    <input
                      id="beneficiary-firstname"
                      type="text"
                      value={state.beneficiaryInfo.firstName || ""}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          beneficiaryInfo: {
                            ...prev.beneficiaryInfo,
                            firstName: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                      aria-label="Prénom du bénéficiaire"
                    />
                  </div>
                  <div>
                    <label htmlFor="beneficiary-lastname" className="block text-sm font-medium mb-1">
                      Nom *
                    </label>
                    <input
                      id="beneficiary-lastname"
                      type="text"
                      value={state.beneficiaryInfo.lastName || ""}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          beneficiaryInfo: {
                            ...prev.beneficiaryInfo,
                            lastName: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                      aria-label="Nom du bénéficiaire"
                    />
                  </div>
                  <div>
                    <label htmlFor="beneficiary-phone" className="block text-sm font-medium mb-1">
                      Téléphone *
                    </label>
                    <input
                      id="beneficiary-phone"
                      type="tel"
                      value={state.beneficiaryInfo.phone || ""}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          beneficiaryInfo: {
                            ...prev.beneficiaryInfo,
                            phone: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                      aria-label="Téléphone du bénéficiaire"
                    />
                  </div>
                  <div>
                    <label htmlFor="beneficiary-email" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      id="beneficiary-email"
                      type="email"
                      value={state.beneficiaryInfo.email || ""}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          beneficiaryInfo: {
                            ...prev.beneficiaryInfo,
                            email: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      aria-label="Email du bénéficiaire"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="beneficiary-location" className="text-sm font-medium mb-1 block">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Localisation
                      </span>
                    </label>
                    <input
                      id="beneficiary-location"
                      type="text"
                      placeholder="Adresse, ville, pays"
                      value={
                        state.beneficiaryInfo.location?.address ||
                        state.beneficiaryInfo.location?.city ||
                        ""
                      }
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          beneficiaryInfo: {
                            ...prev.beneficiaryInfo,
                            location: {
                              address: e.target.value,
                              city: "",
                              country: "",
                            },
                          },
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      aria-label="Localisation du bénéficiaire"
                    />
                  </div>
                </div>
              </div>

              {/* Disponibilités - Uniquement pour le type HEALTH */}
              {state.serviceType === SPECIALITY_TYPES.HEALTH && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Disponibilités du bénéficiaire
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Choisissez la date et l&apos;heure de disponibilité de votre bénéficiaire
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="availability-date" className="block text-sm font-medium mb-2">
                        Date * 
                      </label>
                      <input
                        id="availability-date"
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={state.availability.selectedDate || ""}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            availability: {
                              ...prev.availability,
                              selectedDate: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                        aria-label="Date de disponibilité"
                      />
                    </div>
                    <div>
                      <label htmlFor="availability-time" className="block text-sm font-medium mb-2">
                        Heure *
                      </label>
                      <input
                        id="availability-time"
                        type="time"
                        value={state.availability.selectedTime || ""}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            availability: {
                              ...prev.availability,
                              selectedTime: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                        aria-label="Heure de disponibilité"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 Vous pouvez également utiliser un outil externe comme Calendly pour la sélection des disponibilités
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

              {/* Step 2: Service Selection et Options */}
              {currentStep === 2 && state.serviceType && (
                <div className="space-y-8">
                  {/* Sélection du service */}
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      Sélectionnez le service
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Choisissez le service qui correspond à vos besoins
                    </p>
                    {state.serviceType && AVAILABLE_SERVICES[state.serviceType] && (AVAILABLE_SERVICES[state.serviceType]?.length ?? 0) > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(AVAILABLE_SERVICES[state.serviceType] || []).map((service) => (
                          <button
                            key={service.id}
                            onClick={() => handleServiceSelect(service)}
                            className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                              state.selectedService?.serviceId === service.id
                                ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,95%)] shadow-md"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                            type="button"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-semibold text-lg mb-1">{service.label}</h3>
                              {state.selectedService?.serviceId === service.id && (
                                <Check className="w-6 h-6 text-[hsl(25,100%,53%)] flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                              {service.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-xl font-bold text-[hsl(25,100%,53%)]">
                                {service.price === 0
                                  ? "Sur devis"
                                  : `${service.price}€`}
                              </p>
                              {service.optional && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  Optionnel
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-gray-500 mb-2">Aucun service disponible pour ce type</p>
                        <p className="text-sm text-gray-400">Veuillez contacter le support</p>
                      </div>
                    )}
                  </div>

                  {/* Options supplémentaires */}
                  {state.selectedService && (
                    <div className="border-t pt-8">
                      <h2 className="text-2xl font-bold mb-2">
                        Options supplémentaires
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Personnalisez votre service avec des options additionnelles (optionnel)
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ADDITIONAL_OPTIONS.map((option) => {
                          const isSelected = state.additionalOptions.some(
                            (opt) => opt.id === option.id,
                          );
                          return (
                            <button
                              key={option.id}
                              onClick={() => handleToggleOption(option)}
                              className={`p-5 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                                isSelected
                                  ? "border-[hsl(25,100%,53%)] bg-[hsl(25,100%,95%)] shadow-md"
                                  : "border-gray-200 hover:border-gray-300 bg-white"
                              }`}
                              type="button"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold mb-1">{option.label}</h3>
                                {isSelected && (
                                  <Check className="w-5 h-5 text-[hsl(25,100%,53%)] flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                {option.description}
                              </p>
                              <p className="text-lg font-bold text-[hsl(25,100%,53%)]">
                                +{option.price}€
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Récapitulatif du total */}
                  {state.selectedService && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-[hsl(25,100%,95%)] to-[hsl(25,100%,98%)] rounded-xl border-2 border-[hsl(25,100%,53%)]">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-gray-600 text-sm block mb-1">Montant total</span>
                          <span className="font-semibold text-lg text-gray-900">
                            {state.selectedService.label}
                            {state.additionalOptions.length > 0 && ` + ${state.additionalOptions.length} option${state.additionalOptions.length > 1 ? 's' : ''}`}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-bold text-[hsl(25,100%,53%)]">
                            {state.totalAmount}€
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-gray-900">Paiement sécurisé</h2>
              <p className="text-gray-600">
                Complétez votre réservation en effectuant le paiement de manière sécurisée
              </p>
            </div>

            {/* Récapitulatif de la commande */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Récapitulatif de la commande</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{state.selectedService?.label}</p>
                    <p className="text-sm text-gray-500">{state.selectedService?.description}</p>
                  </div>
                  <span className="font-semibold text-gray-900 ml-4">
                    {state.selectedService?.price || 0}€
                  </span>
                </div>
                
                {state.additionalOptions.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Options supplémentaires:</p>
                    <ul className="space-y-2">
                      {state.additionalOptions.map((opt) => (
                        <li key={opt.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{opt.label}</span>
                          <span className="font-medium text-gray-900">+{opt.price}€</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="pt-4 border-t-2 border-gray-300 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total à payer</span>
                  <span className="text-3xl font-bold text-[hsl(23,100%,53%)]">
                    {state.totalAmount.toFixed(2)}€
                  </span>
                </div>
              </div>
            </div>

            {/* Formulaire de paiement Stripe */}
            {state.totalAmount > 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                {state.paymentConfirmed ? (
                  // Message de confirmation après paiement réussi
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-900 mb-2">
                      Paiement confirmé avec succès !
                    </h3>
                    <p className="text-sm text-green-700 mb-4">
                      Votre paiement de {state.totalAmount.toFixed(2)}€ a été traité avec succès.
                    </p>
                    <p className="text-xs text-green-600">
                      Vous pouvez maintenant passer à l'étape suivante en cliquant sur "Suivant".
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-[hsl(23,100%,53%)]" />
                          Informations de paiement
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          <span>Paiement sécurisé</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-6">
                        Vos informations de paiement sont cryptées et sécurisées par Stripe. 
                        Nous ne stockons jamais vos données bancaires.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800">
                          <strong>Note :</strong> Si vous avez une carte enregistrée, vous pouvez la sélectionner ou en ajouter une nouvelle. 
                          Le formulaire Stripe vous permet de choisir parmi vos moyens de paiement enregistrés.
                        </p>
                      </div>
                    </div>

                    <StripeCheckout
                      amountInMinorUnit={Math.round(state.totalAmount * 100)}
                      currency={CURRENCIES.EUR.code}
                      customerEmail={state.clientInfo.email || ""}
                      metadata={{
                        serviceType: state.serviceType || "",
                        serviceId: state.selectedService?.serviceId || "",
                        serviceLabel: state.selectedService?.label || "",
                      }}
                      onSuccess={handlePaymentSuccess}
                      onError={(error: string) => {
                        alert(`Erreur de paiement: ${error}`);
                      }}
                    />
                  </>
                )}

                {/* Badges de sécurité */}
                <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>SSL sécurisé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>Stripe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>3D Secure</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Montant invalide
                </p>
                <p className="text-gray-500">
                  Le montant doit être supérieur à 0€ pour procéder au paiement.
                </p>
              </div>
            )}
          </div>
        )}

              {/* Step 4: Confirmation avec récapitulatif complet */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* En-tête de confirmation */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                      Réservation confirmée !
                    </h2>
                    <p className="text-gray-600">
                      Votre réservation a été enregistrée avec succès
                    </p>
                  </div>

                  {/* Numéro de réservation */}
                  {(confirmedReservationNumber || confirmedBookingId) && (
                    <div className="bg-gradient-to-r from-[hsl(25,100%,53%)] to-[hsl(41,86%,46%)] text-white rounded-xl p-6 text-center">
                      <p className="text-sm font-medium mb-2">Numéro de réservation</p>
                      <p className="text-2xl font-bold">
                        {confirmedReservationNumber || confirmedBookingId}
                      </p>
                    </div>
                  )}

                  {/* Récapitulatif de la commande */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-[hsl(23,100%,53%)]" />
                      Récapitulatif de la commande
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Service sélectionné */}
                      {state.selectedService && (
                        <div className="border-b pb-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {state.selectedService.label}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {state.selectedService.description}
                              </p>
                            </div>
                            <p className="text-lg font-semibold text-gray-900 ml-4">
                              {state.selectedService.price}€
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Options supplémentaires */}
                      {state.additionalOptions.length > 0 && (
                        <div className="border-b pb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Options supplémentaires:
                          </p>
                          <div className="space-y-2">
                            {state.additionalOptions.map((option) => (
                              <div key={option.id} className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">{option.label}</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  +{option.price}€
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Total */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <span className="text-lg font-semibold text-gray-900">Total à payer</span>
                        <span className="text-2xl font-bold text-[hsl(25,100%,53%)]">
                          {state.totalAmount.toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informations du bénéficiaire */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-[hsl(23,100%,53%)]" />
                      Informations du bénéficiaire
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Nom complet</p>
                        <p className="font-medium text-gray-900">
                          {state.beneficiaryInfo.firstName} {state.beneficiaryInfo.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="font-medium text-gray-900">
                          {state.beneficiaryInfo.phone}
                        </p>
                      </div>
                      {state.beneficiaryInfo.email && (
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">
                            {state.beneficiaryInfo.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations de rendez-vous */}
                  {(state.availability.selectedDate || state.availability.selectedTime) && (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[hsl(23,100%,53%)]" />
                        Rendez-vous
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {state.availability.selectedDate && (
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium text-gray-900">
                              {new Date(state.availability.selectedDate).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        )}
                        {state.availability.selectedTime && (
                          <div>
                            <p className="text-sm text-gray-500">Heure</p>
                            <p className="font-medium text-gray-900">
                              {state.availability.selectedTime}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message de confirmation email */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-blue-900 mb-1">
                          Email de confirmation envoyé
                        </p>
                        <p className="text-sm text-blue-700">
                          Un récapitulatif détaillé de votre réservation a été envoyé à{" "}
                          <strong>{state.clientInfo.email}</strong>
                        </p>
                        {state.beneficiaryInfo.email && state.beneficiaryInfo.email !== state.clientInfo.email && (
                          <p className="text-sm text-blue-700 mt-1">
                            Une notification a également été envoyée à{" "}
                            <strong>{state.beneficiaryInfo.email}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Message de suivi */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <p className="text-sm text-gray-700 text-center">
                      <strong>Prochaines étapes :</strong> Notre équipe va traiter votre réservation
                      et vous recontactera dans les 24-72 heures ouvrables pour finaliser les détails
                      de votre rendez-vous.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {confirmedBookingId && (
                      <button
                        onClick={() => {
                          router.push(`/dashboard/bookings/${confirmedBookingId}`);
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)] rounded-lg font-semibold hover:bg-[hsl(25,100%,53%)] hover:text-white transition"
                        type="button"
                      >
                        Voir les détails
                      </button>
                    )}
                    <button
                      onClick={() => {
                        // Réinitialiser l'état avant de rediriger
                        setState({
                          currentStep: 1,
                          serviceType: null,
                          clientInfo: {},
                          beneficiaryInfo: {},
                          selectedService: null,
                          additionalOptions: [],
                          paymentIntentId: null,
                          paymentConfirmed: false,
                          availability: {
                            selectedDate: null,
                            selectedTime: null,
                          },
                          totalAmount: 0,
                        });
                        setConfirmedBookingId(null);
                        setConfirmedReservationNumber(null);
                        // Rediriger vers le dashboard
                        router.push("/dashboard/bookings");
                      }}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-[hsl(25,100%,53%)] text-white rounded-lg font-semibold hover:bg-[hsl(25,100%,48%)] transition"
                      type="button"
                    >
                      Voir mes réservations
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              {currentStep < 4 && (
                <div className="flex justify-between mt-6">
                  <button
                    onClick={currentStep > 1 ? handleBack : onCancel}
                    className="flex items-center gap-2 px-6 py-3 border rounded-lg hover:bg-gray-50 transition"
                    type="button"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    {currentStep > 1 ? "Précédent" : "Annuler"}
                  </button>
                  {currentStep === 3 ? (
                    <button
                      onClick={handleFinalSubmit}
                      disabled={!validateStep(3) || isSubmitting}
                      className="flex items-center gap-2 px-6 py-3 bg-[hsl(25,100%,53%)] text-white rounded-lg font-semibold hover:bg-[hsl(25,100%,48%)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Enregistrement en cours...</span>
                        </>
                      ) : (
                        <>
                          Confirmer la réservation
                          <Check className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={!validateStep(currentStep)}
                      className="flex items-center gap-2 px-6 py-3 bg-[hsl(25,100%,53%)] text-white rounded-lg font-semibold hover:bg-[hsl(25,100%,48%)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                    >
                      Suivant
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Colonne droite - Sidebar fixe */}
          {state.serviceType && (
            <div className="lg:col-span-1">
              <ServiceBookingSidebar
                serviceType={state.serviceType}
                currentStep={currentStep}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

