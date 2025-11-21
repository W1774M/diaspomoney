import { ROLES, USER_STATUSES } from "@/lib/constants";
import { UserRole, UserStatus } from "@/lib/types";

/**
 * Get role color classes
 */
export function getRoleColor(role: UserRole): string {
  switch (role) {
    case ROLES.ADMIN:
      return "bg-red-100 text-red-800";
    case ROLES.PROVIDER:
      return "bg-blue-100 text-blue-800";
    case ROLES.CUSTOMER:
      return "bg-green-100 text-green-800";
    case ROLES.CSM:
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
    case USER_STATUSES.ACTIVE:
      return "bg-green-100 text-green-800";
    case USER_STATUSES.INACTIVE:
      return "bg-gray-100 text-gray-800";
    case USER_STATUSES.PENDING:
      return "bg-yellow-100 text-yellow-800";
    case USER_STATUSES.SUSPENDED:
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
    case ROLES.ADMIN:
      return "Administrateur";
    case ROLES.PROVIDER:
      return "Prestataire";
    case ROLES.CUSTOMER:
      return "Client";
    case ROLES.CSM:
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
    case USER_STATUSES.ACTIVE:
      return "Actif";
    case USER_STATUSES.INACTIVE:
      return "Inactif";
    case USER_STATUSES.PENDING:
      return "En attente";
    case USER_STATUSES.SUSPENDED:
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
  return name && name.length > 0 ? name.charAt(0).toUpperCase() : "U";
}
