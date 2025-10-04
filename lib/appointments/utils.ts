import { Appointment } from "@/types/appointments";

/**
 * Get appointment status color
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
 * Get appointment status display text
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
 * Format appointment date
 */
export function formatAppointmentDate(appointment: Appointment): string {
  return new Date(appointment.date).toLocaleDateString("fr-FR");
}

/**
 * Format appointment time (extracted from date or other field)
 */
export function formatAppointmentTime(appointment: Appointment): string {
  // Since the existing type doesn't have a time field, we'll extract it from the date or use a default
  const date = new Date(appointment.date);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format appointment amount
 */
export function formatAppointmentAmount(appointment: Appointment): string {
  return `${appointment.totalAmount} €`;
}

/**
 * Get provider full name
 */
export function getProviderName(appointment: Appointment): string {
  return `${appointment.provider.firstName} ${appointment.provider.lastName}`;
}

/**
 * Get requester full name
 */
export function getRequesterName(appointment: Appointment): string {
  return `${appointment.requester.firstName} ${appointment.requester.lastName}`;
}

/**
 * Get provider specialties
 */
export function getProviderSpecialties(appointment: Appointment): string {
  return appointment.provider.specialties.join(", ");
}

/**
 * Check if appointment is upcoming
 */
export function isUpcoming(appointment: Appointment): boolean {
  const appointmentDate = new Date(appointment.date);
  const now = new Date();
  return appointmentDate > now && appointment.status === "confirmed";
}

/**
 * Check if appointment is past
 */
export function isPast(appointment: Appointment): boolean {
  const appointmentDate = new Date(appointment.date);
  const now = new Date();
  return appointmentDate < now;
}

/**
 * Check if appointment is today
 */
export function isToday(appointment: Appointment): boolean {
  const appointmentDate = new Date(appointment.date);
  const today = new Date();
  return (
    appointmentDate.getDate() === today.getDate() &&
    appointmentDate.getMonth() === today.getMonth() &&
    appointmentDate.getFullYear() === today.getFullYear()
  );
}

/**
 * Get appointment urgency level
 */
export function getUrgencyLevel(
  appointment: Appointment
): "low" | "medium" | "high" {
  const appointmentDate = new Date(appointment.date);
  const now = new Date();
  const diffHours =
    (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) return "high";
  if (diffHours < 72) return "medium";
  return "low";
}
