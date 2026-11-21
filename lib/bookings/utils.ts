import type { BookingResponse } from "@/lib/mappers/booking.mapper";
import { BOOKING_STATUSES, TRANSACTION_STATUSES } from "@/lib/constants";

/**
 * Get booking status color
 */
export function getStatusColor(status: string): string {
  const normalizedStatus = status?.toUpperCase();
  switch (normalizedStatus) {
    case BOOKING_STATUSES.CONFIRMED:
      return "bg-green-100 text-green-800";
    case BOOKING_STATUSES.PENDING:
      return "bg-yellow-100 text-yellow-800";
    case BOOKING_STATUSES.CANCELLED:
      return "bg-red-100 text-red-800";
    case BOOKING_STATUSES.FINISHED:
      return "bg-blue-100 text-blue-800";
    case BOOKING_STATUSES.DRAFT:
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get booking status display text in French
 * Uses BOOKING_STATUSES constants for consistency
 */
export function getStatusDisplay(status: string): string {
  const normalizedStatus = status?.toUpperCase();
  const labels: Record<string, string> = {
    [BOOKING_STATUSES.DRAFT]: 'Brouillon',
    [BOOKING_STATUSES.PENDING]: 'En attente',
    [BOOKING_STATUSES.CONFIRMED]: 'Confirmé',
    [BOOKING_STATUSES.FINISHED]: 'Terminé',
    [BOOKING_STATUSES.CANCELLED]: 'Annulé',
  };
  return labels[normalizedStatus] || status;
}

/**
 * Get payment status color
 * Uses TRANSACTION_STATUSES constants for consistency
 * Gère aussi les valeurs stockées en minuscules (pending, confirmed, etc.)
 */
export function getPaymentStatusColor(status: string): string {
  if (!status) return "bg-gray-100 text-gray-800";
  
  const normalizedStatus = status?.toUpperCase();
  
  // Vérifier d'abord les constantes TRANSACTION_STATUSES
  switch (normalizedStatus) {
    case TRANSACTION_STATUSES.COMPLETED:
      return "bg-green-100 text-green-800";
    case TRANSACTION_STATUSES.PENDING:
      return "bg-yellow-100 text-yellow-800";
    case TRANSACTION_STATUSES.PROCESSING:
      return "bg-blue-100 text-blue-800";
    case TRANSACTION_STATUSES.FAILED:
      return "bg-red-100 text-red-800";
    case TRANSACTION_STATUSES.REFUNDED:
      return "bg-purple-100 text-purple-800";
    case TRANSACTION_STATUSES.CANCELLED:
      return "bg-gray-100 text-gray-800";
  }
  
  // Vérifier les valeurs stockées en minuscules
  const lowerStatus = status.toLowerCase();
  switch (lowerStatus) {
    case 'confirmed': // 'confirmed' correspond à COMPLETED
      return "bg-green-100 text-green-800";
    case 'pending':
      return "bg-yellow-100 text-yellow-800";
    case 'processing':
      return "bg-blue-100 text-blue-800";
    case 'failed':
      return "bg-red-100 text-red-800";
    case 'refunded':
      return "bg-purple-100 text-purple-800";
    case 'cancelled':
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get payment status display text
 * Uses TRANSACTION_STATUSES constants for consistency
 * Gère aussi les valeurs stockées en minuscules (pending, confirmed, etc.)
 */
export function getPaymentStatusDisplay(status: string): string {
  if (!status) return 'Inconnu';
  
  const normalizedStatus = status?.toUpperCase();
  
  // Mapping des constantes TRANSACTION_STATUSES (majuscules)
  const labels: Record<string, string> = {
    [TRANSACTION_STATUSES.PENDING]: 'En attente',
    [TRANSACTION_STATUSES.PROCESSING]: 'En traitement',
    [TRANSACTION_STATUSES.COMPLETED]: 'Complété',
    [TRANSACTION_STATUSES.FAILED]: 'Échoué',
    [TRANSACTION_STATUSES.CANCELLED]: 'Annulé',
    [TRANSACTION_STATUSES.REFUNDED]: 'Remboursé',
  };
  
  // Si c'est une constante, retourner le label
  if (labels[normalizedStatus]) {
    return labels[normalizedStatus];
  }
  
  // Mapping des valeurs stockées en minuscules
  const storedValueLabels: Record<string, string> = {
    'pending': 'En attente',
    'processing': 'En traitement',
    'confirmed': 'Complété', // 'confirmed' correspond à COMPLETED
    'failed': 'Échoué',
    'cancelled': 'Annulé',
    'refunded': 'Remboursé',
  };
  
  const lowerStatus = status.toLowerCase();
  return storedValueLabels[lowerStatus] || status;
}

/**
 * Format booking date
 */
export function formatBookingDate(booking: BookingResponse): string {
  const date = booking.appointmentDate ? new Date(booking.appointmentDate) : new Date(booking.createdAt);
  return date.toLocaleDateString("fr-FR");
}

/**
 * Format booking time (extracted from date or other field)
 */
export function formatBookingTime(booking: BookingResponse): string {
  const date = booking.appointmentDate ? new Date(booking.appointmentDate) : new Date(booking.createdAt);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format booking amount
 * Calcule le montant à partir de basePrice + optionsPrice - discountAmount si totalAmount n'existe pas
 */
export function formatBookingAmount(booking: BookingResponse): string {
  let amount = 0;
  
  // Essayer d'abord totalAmount
  if (booking.metadata?.['totalAmount']) {
    amount =
      typeof booking.metadata['totalAmount'] === 'number'
        ? booking.metadata['totalAmount']
        : typeof booking.metadata['totalAmount'] === 'string'
          ? parseFloat(booking.metadata['totalAmount'].replace(/[^\d.,]/g, '').replace(',', '.'))
          : 0;
  } else if (booking.metadata?.['amount']) {
    amount =
      typeof booking.metadata['amount'] === 'number'
        ? booking.metadata['amount']
        : typeof booking.metadata['amount'] === 'string'
          ? parseFloat(booking.metadata['amount'].replace(/[^\d.,]/g, '').replace(',', '.'))
          : 0;
  } else {
    // Calculer à partir de basePrice + optionsPrice - discountAmount
    const basePrice =
      typeof booking.metadata?.['basePrice'] === 'number'
        ? booking.metadata['basePrice']
        : typeof booking.metadata?.['basePrice'] === 'string'
          ? parseFloat(booking.metadata['basePrice'].replace(/[^\d.,]/g, '').replace(',', '.'))
          : typeof booking.metadata?.['servicePrice'] === 'number'
            ? booking.metadata['servicePrice']
            : typeof booking.metadata?.['servicePrice'] === 'string'
              ? parseFloat(booking.metadata['servicePrice'].replace(/[^\d.,]/g, '').replace(',', '.'))
              : 0;

    const optionsPrice = (() => {
      if (booking.metadata?.['additionalOptions']) {
        try {
          const options =
            typeof booking.metadata['additionalOptions'] === 'string'
              ? JSON.parse(booking.metadata['additionalOptions'])
              : booking.metadata['additionalOptions'];
          if (Array.isArray(options)) {
            return options.reduce((sum: number, opt: any) => {
              const optPrice = typeof opt.price === 'number' ? opt.price : parseFloat(opt.price) || 0;
              return sum + optPrice;
            }, 0);
          }
        } catch {
          // Ignorer les erreurs de parsing
        }
      }
      return typeof booking.metadata?.['optionsPrice'] === 'number'
        ? booking.metadata['optionsPrice']
        : typeof booking.metadata?.['optionsPrice'] === 'string'
          ? parseFloat(booking.metadata['optionsPrice'].replace(/[^\d.,]/g, '').replace(',', '.'))
          : 0;
    })();

    const discountAmount =
      typeof booking.metadata?.['discountAmount'] === 'number'
        ? booking.metadata['discountAmount']
        : typeof booking.metadata?.['discountAmount'] === 'string'
          ? parseFloat(booking.metadata['discountAmount'].replace(/[^\d.,]/g, '').replace(',', '.'))
          : 0;

    amount = basePrice + optionsPrice - discountAmount;
  }

  return `${amount.toFixed(2)} €`;
}

/**
 * Get provider full name
 */
export function getProviderName(booking: BookingResponse): string {
  // Provider info is not directly available in BookingResponse, use serviceId as fallback
  return booking.providerId || 'N/A';
}

/**
 * Get requester full name
 */
export function getRequesterName(booking: BookingResponse): string {
  const requesterInfo = booking.metadata?.['requesterInfo'];
  if (requesterInfo && typeof requesterInfo === 'object' && 'firstName' in requesterInfo && 'lastName' in requesterInfo) {
    return `${requesterInfo.firstName} ${requesterInfo.lastName}`;
  }
  return booking.requesterId || 'N/A';
}

/**
 * Get provider specialties
 */
export function getProviderSpecialties(booking: BookingResponse): string {
  // Specialties are not directly available in BookingResponse
  return booking.serviceType || 'N/A';
}

/**
 * Check if booking is upcoming
 */
export function isUpcoming(booking: BookingResponse): boolean {
  const bookingDate = booking.appointmentDate ? new Date(booking.appointmentDate) : new Date(booking.createdAt);
  const now = new Date();
  return bookingDate > now && booking.status === "CONFIRMED";
}

/**
 * Check if booking is past
 */
export function isPast(booking: BookingResponse): boolean {
  const bookingDate = booking.appointmentDate ? new Date(booking.appointmentDate) : new Date(booking.createdAt);
  const now = new Date();
  return bookingDate < now;
}

/**
 * Check if booking is today
 */
export function isToday(booking: BookingResponse): boolean {
  const bookingDate = booking.appointmentDate ? new Date(booking.appointmentDate) : new Date(booking.createdAt);
  const today = new Date();
  return (
    bookingDate.getDate() === today.getDate() &&
    bookingDate.getMonth() === today.getMonth() &&
    bookingDate.getFullYear() === today.getFullYear()
  );
}

/**
 * Get booking urgency level
 */
export function getUrgencyLevel(booking: BookingResponse): "low" | "medium" | "high" {
  const bookingDate = booking.appointmentDate ? new Date(booking.appointmentDate) : new Date(booking.createdAt);
  const now = new Date();
  const diffHours = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) return "high";
  if (diffHours < 72) return "medium";
  return "low";
}
