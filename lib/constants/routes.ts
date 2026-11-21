/**
 * Constantes pour les routes de l'application
 */

/**
 * Routes principales de l'application
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  APPOINTMENTS: '/dashboard/appointments',
  TRANSACTIONS: '/dashboard/transactions',
  PAYMENTS: '/dashboard/payments',
  BENEFICIARIES: '/dashboard/beneficiaries',
  COMPLAINTS: '/dashboard/complaints',
  NOTIFICATIONS: '/dashboard/notifications',
} as const;

/**
 * Codes de statut HTTP pour les redirections
 */
export const HTTP_REDIRECT = {
  PERMANENT: 301,
  FOUND: 302,
  SEE_OTHER: 303,
  TEMPORARY: 307,
  PERMANENT_REDIRECT: 308,
} as const;

/**
 * Alias pour la redirection temporaire (307)
 * Utilisé pour les redirections qui doivent préserver la méthode HTTP
 */
export const HTTP_REDIRECT_TEMPORARY = HTTP_REDIRECT.TEMPORARY;

