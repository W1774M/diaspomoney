"use client";
import { ModalPaymentProps, PaymentData } from "@/lib/definitions";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ModalPaymentPropsExtended extends ModalPaymentProps {
  paymentData: PaymentData;
  setPaymentData: (
    paymentData: PaymentData | ((prev: PaymentData) => PaymentData)
  ) => void;
}

export const ModalPayment = ({
  appointment,
  paymentData,
  setPaymentData,
  setModalOpen,
  setSteps,
}: ModalPaymentPropsExtended) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Fonctions de validation optimisées avec useCallback
  const validateCardNumber = useCallback((cardNumber: string) => {
    const cleaned = cardNumber.replace(/\D/g, "");
    if (cleaned.length < 13 || cleaned.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }, []);

  const formatCardNumber = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  }, []);

  const validateExpiryDate = useCallback((expiryDate: string) => {
    const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!regex.test(expiryDate)) return false;

    const [, month, year] = expiryDate.match(regex) || [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const expYear = parseInt(year);
    const expMonth = parseInt(month);

    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;

    return true;
  }, []);

  const formatExpiryDate = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  }, []);

  const validateCVV = useCallback((cvv: string) => {
    const cleaned = cvv.replace(/\D/g, "");
    return cleaned.length >= 3 && cleaned.length <= 4;
  }, []);

  const validateCardholderName = useCallback((name: string) => {
    return name.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name);
  }, []);

  // Validation des champs avec useMemo pour éviter les recalculs
  const fieldValidations = useMemo(
    () => ({
      cardNumber: paymentData.cardNumber
        ? validateCardNumber(paymentData.cardNumber)
        : null,
      expiryDate: paymentData.expiryDate
        ? validateExpiryDate(paymentData.expiryDate)
        : null,
      cvv: paymentData.cvv ? validateCVV(paymentData.cvv) : null,
      cardholderName: paymentData.cardholderName
        ? validateCardholderName(paymentData.cardholderName)
        : null,
    }),
    [
      paymentData,
      validateCardNumber,
      validateExpiryDate,
      validateCVV,
      validateCardholderName,
    ]
  );

  // Formatage de la date optimisé
  const formattedDate = useMemo(() => {
    if (!appointment.timeslot) return "";
    return new Date(appointment.timeslot).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [appointment.timeslot]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Gestionnaires optimisés avec useCallback
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => setModalOpen?.(false), 300);
  }, [setModalOpen]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      let processedValue = value;

      switch (name) {
        case "cardNumber":
          processedValue = formatCardNumber(value);
          break;
        case "expiryDate":
          processedValue = formatExpiryDate(value);
          break;
        case "cvv":
          processedValue = value.replace(/\D/g, "");
          break;
        case "cardholderName":
          processedValue = value.toUpperCase();
          break;
      }

      setPaymentData((prev: PaymentData) => ({
        ...prev,
        [name]: processedValue,
      }));
    },
    [formatCardNumber, formatExpiryDate, setPaymentData]
  );

  const handleSubmit = useCallback(() => {
    const isCardNumberValid = validateCardNumber(paymentData.cardNumber);
    const isExpiryDateValid = validateExpiryDate(paymentData.expiryDate);
    const isCVVValid = validateCVV(paymentData.cvv);
    const isCardholderNameValid = validateCardholderName(
      paymentData.cardholderName
    );

    if (!isCardNumberValid) {
      alert("Veuillez saisir un numéro de carte valide");
      return;
    }

    if (!isExpiryDateValid) {
      alert("Veuillez saisir une date d&apos;expiration valide (format MM/AA)");
      return;
    }

    if (!isCVVValid) {
      alert("Veuillez saisir un code CVV valide (3 ou 4 chiffres)");
      return;
    }

    if (!isCardholderNameValid) {
      alert("Veuillez saisir le nom du titulaire de la carte");
      return;
    }

    console.log("Paiement effectué", { appointment, paymentData });
    setIsClosing(true);
    setTimeout(() => setSteps?.(2), 300);
  }, [
    appointment,
    paymentData,
    validateCardNumber,
    validateExpiryDate,
    validateCVV,
    validateCardholderName,
    setSteps,
  ]);

  const handleBack = useCallback(() => {
    setIsClosing(true);
    console.log(setSteps);
    setTimeout(() => {
      if (setSteps) setSteps(0); // Retour à l'étape 0 (étape précédente)
    }, 300);
  }, [setSteps]);

  // Fonction pour obtenir la classe CSS d'un champ
  const getFieldClassName = useCallback(
    (fieldName: keyof PaymentData) => {
      const validation = fieldValidations[fieldName];
      if (validation === null) return "border-gray-300";
      return validation
        ? "border-green-300 focus:ring-green-400 focus:border-green-400"
        : "border-red-300 focus:ring-red-400 focus:border-red-400";
    },
    [fieldValidations]
  );

  // Fonction pour afficher l'icône de validation
  const getValidationIcon = useCallback(
    (fieldName: keyof PaymentData) => {
      const validation = fieldValidations[fieldName];
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
        className={`bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out ${
          isVisible && !isClosing
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-4 opacity-0 scale-95"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Paiement sécurisé
          </h2>
          <button
            className="text-gray-400 hover:text-gray-700 cursor-pointer text-2xl font-bold focus:outline-none transition-colors duration-200"
            onClick={handleClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Résumé de la commande */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">
              Résumé de votre commande
            </h3>
            <div className="space-y-1 text-sm text-blue-700">
              <div className="flex justify-between">
                <span>Service :</span>
                <span>{appointment.selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Prestataire :</span>
                <span>{appointment.provider.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Créneau :</span>
                <span>{formattedDate}</span>
              </div>
              <div className="border-t border-blue-200 pt-1 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total :</span>
                  <span>{appointment.selectedService?.price} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire de paiement */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Informations de paiement
            </h3>

            {/* Numéro de carte */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Numéro de carte
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-2.5 py-2 pr-10 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 hover:border-blue-300 ${getFieldClassName(
                    "cardNumber"
                  )}`}
                  placeholder="1234 5678 9012 3456"
                  pattern="[0-9\s]{13,19}"
                  maxLength={19}
                  required
                />
                <div className="absolute right-3 top-2.5 text-gray-400">💳</div>
                {paymentData.cardNumber && (
                  <div className="absolute right-10 top-2.5">
                    {getValidationIcon("cardNumber")}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Format: 1234 5678 9012 3456 (13-19 chiffres)
              </p>
            </div>

            {/* Date d'expiration et CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Date d&apos;expiration
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="expiryDate"
                    value={paymentData.expiryDate}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-2.5 py-2 pr-8 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 hover:border-blue-300 ${getFieldClassName(
                      "expiryDate"
                    )}`}
                    placeholder="MM/AA"
                    pattern="(0[1-9]|1[0-2])\/([0-9]{2})"
                    maxLength={5}
                    required
                  />
                  {paymentData.expiryDate && (
                    <div className="absolute right-3 top-2.5">
                      {getValidationIcon("expiryDate")}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Format: MM/AA (ex: 12/25)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  CVV
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="cvv"
                    value={paymentData.cvv}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-2.5 py-2 pr-8 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 hover:border-blue-300 ${getFieldClassName(
                      "cvv"
                    )}`}
                    placeholder="123"
                    pattern="[0-9]{3,4}"
                    maxLength={4}
                    required
                  />
                  {paymentData.cvv && (
                    <div className="absolute right-3 top-2.5">
                      {getValidationIcon("cvv")}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  3 ou 4 chiffres au dos de la carte
                </p>
              </div>
            </div>

            {/* Nom du titulaire */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Nom du titulaire
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="cardholderName"
                  value={paymentData.cardholderName}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-2.5 py-2 pr-8 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 hover:border-blue-300 ${getFieldClassName(
                    "cardholderName"
                  )}`}
                  placeholder="NOM PRENOM"
                  pattern="[a-zA-ZÀ-ÿ\s'-]{2,}"
                  minLength={2}
                  required
                />
                {paymentData.cardholderName && (
                  <div className="absolute right-3 top-2.5">
                    {getValidationIcon("cardholderName")}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Nom complet comme indiqué sur la carte
              </p>
            </div>

            {/* Sécurité */}
            <div className="bg-green-50 p-2.5 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Paiement sécurisé par cryptage SSL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            onClick={handleBack}
          >
            Retour
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            onClick={handleSubmit}
          >
            Continuer vers la prévisualisation
          </button>
        </div>
      </div>
    </div>
  );
};
