import { UserRole, UserStatus } from "@/lib/types";

/**
 * Get role color classes
 */
export function getRoleColor(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-800";
    case "PROVIDER":
      return "bg-blue-100 text-blue-800";
    case "CUSTOMER":
      return "bg-green-100 text-green-800";
    case "CSM":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get status color classes
 */
export function getStatusColor(status: UserStatus): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "INACTIVE":
      return "bg-gray-100 text-gray-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "SUSPENDED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get role display text
 */
export function getRoleText(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "Administrateur";
    case "PROVIDER":
      return "Prestataire";
    case "CUSTOMER":
      return "Client";
    case "CSM":
      return "CSM";
    default:
      return role;
  }
}

/**
 * Get status display text
 */
export function getStatusText(status: UserStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Actif";
    case "INACTIVE":
      return "Inactif";
    case "PENDING":
      return "En attente";
    case "SUSPENDED":
      return "Suspendu";
    default:
      return status;
  }
}

/**
 * Format user name
 */
export function formatUserName(user: any): string {
  return user.name || user.email || "Utilisateur sans nom";
}

/**
 * Get user initials
 */
export function getUserInitials(user: any): string {
  const name = user.name || user.email || "U";
  return name.charAt(0).toUpperCase();
}
