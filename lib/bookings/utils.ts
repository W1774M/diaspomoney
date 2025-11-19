import type { Booking } from "@/lib/types";

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
export function formatBookingDate(booking: Booking): string {
  return new Date(booking.date).toLocaleDateString("fr-FR");
}

/**
 * Format booking time (extracted from date or other field)
 */
export function formatBookingTime(booking: Booking): string {
  // Since the existing type doesn't have a time field, we'll extract it from the date or use a default
  const date = new Date(booking.date);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format booking amount
 */
export function formatBookingAmount(booking: Booking): string {
  return `${booking.totalAmount} €`;
}

/**
 * Get provider full name
 */
export function getProviderName(booking: Booking): string {
  return `${booking.provider.firstName} ${booking.provider.lastName}`;
}

/**
 * Get requester full name
 */
export function getRequesterName(booking: Booking): string {
  return `${booking.requester.firstName} ${booking.requester.lastName}`;
}

/**
 * Get provider specialties
 */
export function getProviderSpecialties(booking: Booking): string {
  return booking.provider.specialties.join(", ");
}

/**
 * Check if booking is upcoming
 */
export function isUpcoming(booking: Booking): boolean {
  const bookingDate = new Date(booking.date);
  const now = new Date();
  return bookingDate > now && booking.status === "confirmed";
}

/**
 * Check if booking is past
 */
export function isPast(booking: Booking): boolean {
  const bookingDate = new Date(booking.date);
  const now = new Date();
  return bookingDate < now;
}

/**
 * Check if booking is today
 */
export function isToday(booking: Booking): boolean {
  const bookingDate = new Date(booking.date);
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
export function getUrgencyLevel(booking: Booking): "low" | "medium" | "high" {
  const bookingDate = new Date(booking.date);
  const now = new Date();
  const diffHours = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) return "high";
  if (diffHours < 72) return "medium";
  return "low";
}
