"use client";
import { AppointmentData, Provider, Service } from "@/lib/definitions";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

interface ModalSelectServiceProps {
  setModalOpen: (open: boolean) => void;
  appointment: AppointmentData;
  setAppointment: (appointment: AppointmentData) => void;
  setSteps: (step: number) => void;
  provider: Provider;
}

export const ModalSelectService = ({
  setModalOpen,
  appointment,
  setAppointment,
  setSteps,
  provider,
}: ModalSelectServiceProps) => {
  // Debug: afficher les données du demandeur
  console.log("Modal - Données du demandeur:", appointment.requester);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "timeslot" | "service" | "details"
  >("timeslot");

  // Fonctions de validation optimisées avec useCallback
  const validatePhoneNumber = useCallback((phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return (
      (cleaned.startsWith("0") && cleaned.length === 10) ||
      (cleaned.startsWith("33") && cleaned.length === 11) ||
      (cleaned.startsWith("+33") && cleaned.length === 12)
    );
  }, []);

  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }, []);

  const validateName = useCallback((name: string) => {
    return name.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name);
  }, []);

  // Fonction de formatage de téléphone optimisée
  const formatPhoneNumber = useCallback((phoneValue: string) => {
    const cleaned = phoneValue.replace(/\D/g, "");

    if (cleaned.startsWith("0") && cleaned.length === 10) {
      return cleaned.replace(
        /(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/,
        "$1 $2 $3 $4 $5"
      );
    } else if (cleaned.startsWith("33") && cleaned.length === 11) {
      return (
        "+" +
        cleaned.replace(/(\d{2})(\d{1})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")
      );
    } else if (cleaned.startsWith("+33") && cleaned.length === 12) {
      return cleaned.replace(
        /(\+\d{2})(\d{1})(\d{2})(\d{2})(\d{2})/,
        "$1 $2 $3 $4 $5"
      );
    }

    return cleaned;
  }, []);

  // Validation des champs avec useMemo pour éviter les recalculs
  const fieldValidations = useMemo(
    () => ({
      requester: {
        lastName: appointment.requester.lastName
          ? validateName(appointment.requester.lastName)
          : null,
        firstName: appointment.requester.firstName
          ? validateName(appointment.requester.firstName)
          : null,
        phone: appointment.requester.phone
          ? validatePhoneNumber(appointment.requester.phone)
          : null,
        email: appointment.requester.email
          ? validateEmail(appointment.requester.email)
          : null,
      },
      recipient: {
        lastName: appointment.recipient.lastName
          ? validateName(appointment.recipient.lastName)
          : null,
        firstName: appointment.recipient.firstName
          ? validateName(appointment.recipient.firstName)
          : null,
        phone: appointment.recipient.phone
          ? validatePhoneNumber(appointment.recipient.phone)
          : null,
      },
    }),
    [
      appointment.requester,
      appointment.recipient,
      validateName,
      validatePhoneNumber,
      validateEmail,
    ]
  );

  // Vérification si le formulaire est valide
  const isFormValid = useMemo(() => {
    return (
      fieldValidations.requester.lastName &&
      fieldValidations.requester.firstName &&
      fieldValidations.requester.phone &&
      fieldValidations.requester.email &&
      fieldValidations.recipient.lastName &&
      fieldValidations.recipient.firstName &&
      fieldValidations.recipient.phone &&
      appointment.selectedService
    );
  }, [fieldValidations, appointment.selectedService]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Gestionnaires optimisés avec useCallback
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => setModalOpen(false), 300);
  }, [setModalOpen]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const { name, value } = e.target;

      if (name.startsWith("requester.")) {
        const field = name.split(".")[1];
        const processedValue =
          field === "phone" ? formatPhoneNumber(value) : value;

        setAppointment({
          ...appointment,
          requester: {
            ...appointment.requester,
            [field]: processedValue,
          },
        });
      } else if (name.startsWith("recipient.")) {
        const field = name.split(".")[1];
        const processedValue =
          field === "phone" ? formatPhoneNumber(value) : value;

        setAppointment({
          ...appointment,
          recipient: {
            ...appointment.recipient,
            [field]: processedValue,
          },
        });
      }
    },
    [appointment, setAppointment, formatPhoneNumber]
  );

  // Gestionnaire pour la sélection d'un créneau
  const handleTimeslotSelect = useCallback(
    (timeslot: string) => {
      setAppointment({ ...appointment, timeslot });
      setCurrentStep("service");
    },
    [appointment, setAppointment]
  );

  // Gestionnaire pour la sélection d'un service
  const handleServiceSelect = useCallback(
    (service: Service) => {
      setAppointment({ ...appointment, selectedService: service });
      setCurrentStep("details");
    },
    [appointment, setAppointment]
  );

  // Gestionnaire pour retourner à l'étape précédente
  const handleBack = useCallback(() => {
    if (currentStep === "service") {
      setCurrentStep("timeslot");
    } else if (currentStep === "details") {
      setCurrentStep("service");
    }
  }, [currentStep]);

  const handleSubmit = useCallback(() => {
    if (!isFormValid) {
      alert("Veuillez remplir tous les champs obligatoires correctement");
      return;
    }

    console.log("Réservation soumise", appointment);
    setIsClosing(true);
    setTimeout(() => {
      setSteps(1);
    }, 300);
  }, [isFormValid, appointment, setSteps]);

  // Fonction pour obtenir la classe CSS d'un champ
  const getFieldClassName = useCallback(
    (person: "requester" | "recipient", field: string) => {
      const validation =
        fieldValidations[person][
          field as keyof (typeof fieldValidations)[typeof person]
        ];
      if (validation === null) return "border-gray-300";
      return validation
        ? "border-green-300 focus:ring-green-400 focus:border-green-400"
        : "border-red-300 focus:ring-red-400 focus:border-red-400";
    },
    [fieldValidations]
  );

  // Fonction pour afficher l'icône de validation
  const getValidationIcon = useCallback(
    (person: "requester" | "recipient", field: string) => {
      const validation =
        fieldValidations[person][
          field as keyof (typeof fieldValidations)[typeof person]
        ];
      if (validation === null) return null;
      return validation ? (
        <span className="text-green-500 text-lg">✓</span>
      ) : (
        <span className="text-red-500 text-lg">✗</span>
      );
    },
    [fieldValidations]
  );

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 pt-16 transition-all duration-300 ease-in-out ${
        isVisible && !isClosing
          ? "bg-black/50 backdrop-blur-sm"
          : "bg-black/0 backdrop-blur-none"
      }`}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out ${
          isVisible && !isClosing
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-4 opacity-0 scale-95"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            {currentStep === "timeslot" && "Choisir un créneau"}
            {currentStep === "service" && "Choisir un service"}
            {currentStep === "details" && "Détails de la réservation"}
          </h2>
          <button
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none transition-colors duration-200 cursor-pointer"
            onClick={handleClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Étape 1: Sélection du créneau */}
          {currentStep === "timeslot" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Créneaux disponibles
              </h3>
              <div className="space-y-3">
                {provider.availabilities &&
                provider.availabilities.length > 0 ? (
                  provider.availabilities.map((time: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleTimeslotSelect(time)}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          {new Date(time).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun créneau disponible</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Étape 2: Sélection du service */}
          {currentStep === "service" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Services disponibles
              </h3>
              <div className="space-y-3">
                {appointment.provider.services.map(
                  (service: Service, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleServiceSelect(service)}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-700">
                            {service.name}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            Service disponible
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-blue-600">
                            {service.price} €
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Étape 3: Détails de la réservation */}
          {currentStep === "details" && (
            <>
              {/* Résumé de la sélection */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-3">
                  Résumé de votre sélection
                </h3>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex justify-between">
                    <span>Créneau :</span>
                    <span>
                      {new Date(appointment.timeslot).toLocaleDateString(
                        "fr-FR",
                        {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service :</span>
                    <span>{appointment.selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prix :</span>
                    <span className="font-bold">
                      {appointment.selectedService?.price} €
                    </span>
                  </div>
                </div>
              </div>

              {/* Informations du demandeur */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Informations du demandeur
                  </h3>
                  {(appointment.requester.firstName ||
                    appointment.requester.lastName ||
                    appointment.requester.email) && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                      Pré-rempli depuis votre compte
                    </span>
                  )}
                </div>

                {(appointment.requester.firstName ||
                  appointment.requester.lastName ||
                  appointment.requester.email) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">💡</span> Vos informations
                      de profil ont été automatiquement remplies. Vous pouvez
                      les modifier si nécessaire.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Nom *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="requester.lastName"
                        value={appointment.requester.lastName}
                        onChange={handleChange}
                        className={`w-full border rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 ${getFieldClassName(
                          "requester",
                          "lastName"
                        )}`}
                        placeholder="Dupont"
                        pattern="[a-zA-ZÀ-ÿ\s'-]{2,}"
                        minLength={2}
                        required
                      />
                      {appointment.requester.lastName && (
                        <div className="absolute right-3 top-2.5">
                          {getValidationIcon("requester", "lastName")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Prénom *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="requester.firstName"
                        value={appointment.requester.firstName}
                        onChange={handleChange}
                        className={`w-full border rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 ${getFieldClassName(
                          "requester",
                          "firstName"
                        )}`}
                        placeholder="Jean"
                        pattern="[a-zA-ZÀ-ÿ\s'-]{2,}"
                        minLength={2}
                        required
                      />
                      {appointment.requester.firstName && (
                        <div className="absolute right-3 top-2.5">
                          {getValidationIcon("requester", "firstName")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Téléphone *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="requester.phone"
                        value={appointment.requester.phone}
                        onChange={handleChange}
                        className={`w-full border rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 ${getFieldClassName(
                          "requester",
                          "phone"
                        )}`}
                        placeholder="01 23 45 67 89"
                        pattern="[0-9\s\+\-\(\)]{10,}"
                        required
                      />
                      {appointment.requester.phone && (
                        <div className="absolute right-3 top-2.5">
                          {getValidationIcon("requester", "phone")}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Format français : 01 23 45 67 89 ou +33 1 23 45 67 89
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Email *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="requester.email"
                        value={appointment.requester.email}
                        onChange={handleChange}
                        className={`w-full border rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 ${getFieldClassName(
                          "requester",
                          "email"
                        )}`}
                        placeholder="jean.dupont@email.com"
                        pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                        required
                      />
                      {appointment.requester.email && (
                        <div className="absolute right-3 top-2.5">
                          {getValidationIcon("requester", "email")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations du bénéficiaire */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Informations du bénéficiaire
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Nom *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="recipient.lastName"
                        value={appointment.recipient.lastName}
                        onChange={handleChange}
                        className={`w-full border rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 ${getFieldClassName(
                          "recipient",
                          "lastName"
                        )}`}
                        placeholder="Martin"
                        pattern="[a-zA-ZÀ-ÿ\s'-]{2,}"
                        minLength={2}
                        required
                      />
                      {appointment.recipient.lastName && (
                        <div className="absolute right-3 top-2.5">
                          {getValidationIcon("recipient", "lastName")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Prénom *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="recipient.firstName"
                        value={appointment.recipient.firstName}
                        onChange={handleChange}
                        className={`w-full border rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 ${getFieldClassName(
                          "recipient",
                          "firstName"
                        )}`}
                        placeholder="Marie"
                        pattern="[a-zA-ZÀ-ÿ\s'-]{2,}"
                        minLength={2}
                        required
                      />
                      {appointment.recipient.firstName && (
                        <div className="absolute right-3 top-2.5">
                          {getValidationIcon("recipient", "firstName")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Téléphone *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="recipient.phone"
                        value={appointment.recipient.phone}
                        onChange={handleChange}
                        className={`w-full border rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 ${getFieldClassName(
                          "recipient",
                          "phone"
                        )}`}
                        placeholder="01 23 45 67 89"
                        pattern="[0-9\s\+\-\(\)]{10,}"
                        required
                      />
                      {appointment.recipient.phone && (
                        <div className="absolute right-3 top-2.5">
                          {getValidationIcon("recipient", "phone")}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Format français : 01 23 45 67 89 ou +33 1 23 45 67 89
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Résumé */}
          {appointment.selectedService && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">
                Résumé de votre sélection
              </h4>
              <div className="space-y-1 text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>Service :</span>
                  <span>{appointment.selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prestataire :</span>
                  <span>{appointment.provider.name}</span>
                </div>
                <div className="border-t border-blue-200 pt-1 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total :</span>
                    <span>{appointment.selectedService.price} €</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            onClick={currentStep === "timeslot" ? handleClose : handleBack}
          >
            {currentStep === "timeslot" ? "Annuler" : "Retour"}
          </button>
          {currentStep === "details" && (
            <button
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
              onClick={handleSubmit}
              disabled={!isFormValid}
            >
              Continuer vers le paiement
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
