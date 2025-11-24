import type { BookingResponse } from "@/lib/mappers/booking.mapper";

/**
 * Get booking status color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get booking status display text
 */
export function getStatusDisplay(status: string): string {
  switch (status) {
    case "confirmed":
      return "Confirmé";
    case "pending":
      return "En attente";
    case "cancelled":
      return "Annulé";
    case "completed":
      return "Terminé";
    default:
      return status;
  }
}

/**
 * Get payment status color
 */
export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "refunded":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get payment status display text
 */
export function getPaymentStatusDisplay(status: string): string {
  switch (status) {
    case "paid":
      return "Payé";
    case "pending":
      return "En attente";
    case "failed":
      return "Échoué";
    case "refunded":
      return "Remboursé";
    default:
      return status;
  }
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
 */
export function formatBookingAmount(booking: BookingResponse): string {
  const amount = (booking.metadata?.['totalAmount'] as number) || (booking.metadata?.['amount'] as number) || 0;
  return `${amount} €`;
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
