/**
 * Types HTTP pour les requêtes et réponses
 */

/**
 * Méthodes HTTP supportées
 */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS';

/**
 * Codes de statut HTTP pour les redirections
 */
export type HttpRedirectStatus = 301 | 302 | 303 | 307 | 308;

