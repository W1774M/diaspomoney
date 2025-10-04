import { useEffect, useState } from "react";

export interface BookingFormData {
  requester: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  recipient: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  timeslot: string;
  selectedService: {
    name: string;
    id: number;
    price: number;
  } | null;
  consultationMode?: string;
  hasConsultedBefore?: boolean;
  country: string;
  address1: string;
  address2?: string;
  postalCode: string;
  city: string;
  isBillingDefault?: boolean;
}

/**
 * Hook pour gérer la restauration des données du formulaire de réservation
 */
export function useBookingFormRestore() {
  const [savedData, setSavedData] = useState<BookingFormData | null>(null);
  const [hasRestoredData, setHasRestoredData] = useState(false);

  useEffect(() => {
    const savedFormData = localStorage.getItem("bookingFormData");
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setSavedData(parsedData);
        setHasRestoredData(true);
      } catch (error) {
        console.error(
          "Erreur lors de la lecture des données sauvegardées:",
          error
        );
        localStorage.removeItem("bookingFormData");
      }
    }
  }, []);

  const clearSavedData = () => {
    localStorage.removeItem("bookingFormData");
    setSavedData(null);
    setHasRestoredData(false);
  };

  const getPreFilledData = () => {
    if (!savedData) return {};

    return {
      firstName: savedData.requester?.firstName || "",
      lastName: savedData.requester?.lastName || "",
      email: savedData.requester?.email || "",
      phone: savedData.requester?.phone || "",
    };
  };

  const redirectToBooking = () => {
    if (savedData) {
      // Rediriger vers la page de réservation avec les données
      const bookingUrl = `/services/${savedData.selectedService?.id || "1"}`;
      window.location.href = bookingUrl;
    }
  };

  return {
    savedData,
    hasRestoredData,
    clearSavedData,
    getPreFilledData,
    redirectToBooking,
  };
}
