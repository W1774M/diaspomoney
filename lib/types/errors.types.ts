/**
 * Types d'erreurs centralisés
 * Définit les types pour la gestion d'erreurs dans l'application
 */

import type { ErrorCode } from '@/lib/constants';
import type { HttpStatusCode } from './constants.types';

/**
 * Erreur API standardisée
 */
export interface ApiError {
  /**
   * Code d'erreur
   */
  code: ErrorCode | string;

  /**
   * Message d'erreur
   */
  message: string;

  /**
   * Détails supplémentaires
   */
  details?: Record<string, any>;

  /**
   * Code de statut HTTP
   */
  statusCode?: HttpStatusCode;

  /**
   * Timestamp de l'erreur
   */
  timestamp?: Date;

  /**
   * Chemin de la requête qui a causé l'erreur
   */
  path?: string;

  /**
   * ID de la requête (pour le tracking)
   */
  requestId?: string;

  /**
   * Stack trace (en développement)
   */
  stack?: string;
}

/**
 * Erreur de validation
 */
export interface ValidationError extends ApiError {
  /**
   * Code d'erreur spécifique
   */
  code: 'VALIDATION_ERROR';

  /**
   * Erreurs de validation par champ
   */
  fields: Record<string, string[]>;
}

/**
 * Erreur d'authentification
 */
export interface AuthenticationError extends ApiError {
  /**
   * Code d'erreur spécifique
   */
  code: 'AUTHENTICATION_ERROR' | 'INVALID_CREDENTIALS';

  /**
   * Raison de l'échec
   */
  reason?: string;
}

/**
 * Erreur d'autorisation
 */
export interface AuthorizationError extends ApiError {
  /**
   * Code d'erreur spécifique
   */
  code: 'AUTHORIZATION_ERROR' | 'FORBIDDEN';

  /**
   * Ressource demandée
   */
  resource?: string;

  /**
   * Action demandée
   */
  action?: string;
}

/**
 * Erreur de ressource non trouvée
 */
export interface NotFoundError extends ApiError {
  /**
   * Code d'erreur spécifique
   */
  code: 'NOT_FOUND' | 'USER_NOT_FOUND' | 'RESOURCE_NOT_FOUND';

  /**
   * Type de ressource
   */
  resourceType?: string;

  /**
   * ID de la ressource
   */
  resourceId?: string;
}

/**
 * Erreur de conflit
 */
export interface ConflictError extends ApiError {
  /**
   * Code d'erreur spécifique
   */
  code: 'CONFLICT' | 'USER_ALREADY_EXISTS' | 'RESOURCE_ALREADY_EXISTS';

  /**
   * Type de conflit
   */
  conflictType?: string;

  /**
   * Ressource en conflit
   */
  conflictingResource?: string;
}

/**
 * Erreur de transaction
 */
export interface TransactionError extends ApiError {
  /**
   * Code d'erreur spécifique
   */
  code: 'TRANSACTION_FAILED' | 'INSUFFICIENT_FUNDS' | 'PAYMENT_FAILED';

  /**
   * ID de la transaction
   */
  transactionId?: string;

  /**
   * Montant de la transaction
   */
  amount?: number;

  /**
   * Devise
   */
  currency?: string;
}

/**
 * Erreur de service indisponible
 */
export interface ServiceUnavailableError extends ApiError {
  /**
   * Code d'erreur spécifique
   */
  code: 'SERVICE_UNAVAILABLE' | 'DATABASE_ERROR' | 'CONNECTION_ERROR';

  /**
   * Service affecté
   */
  service?: string;

  /**
   * Raison de l'indisponibilité
   */
  reason?: string;

  /**
   * Temps de retry suggéré (ms)
   */
  retryAfter?: number;
}

/**
 * Erreur de limite de taux
 */
export interface RateLimitError extends ApiError {
  /**
   * Code d'erreur spécifique
   */
  code: 'RATE_LIMIT_EXCEEDED';

  /**
   * Limite de requêtes
   */
  limit?: number;

  /**
   * Fenêtre de temps (ms)
   */
  windowMs?: number;

  /**
   * Temps avant de pouvoir refaire une requête (ms)
   */
  retryAfter?: number;
}

/**
 * Erreur inconnue
 */
export interface UnknownError extends ApiError {
  /**
   * Code d'erreur spécifique
   */
  code: 'UNKNOWN_ERROR';

  /**
   * Erreur originale
   */
  originalError?: Error;
}

/**
 * Union de tous les types d'erreurs
 */
export type AppError =
  | ValidationError
  | AuthenticationError
  | AuthorizationError
  | NotFoundError
  | ConflictError
  | TransactionError
  | ServiceUnavailableError
  | RateLimitError
  | UnknownError
  | ApiError;

/**
 * Options pour créer une erreur
 */
export interface CreateErrorOptions {
  /**
   * Code d'erreur
   */
  code: ErrorCode | string;

  /**
   * Message d'erreur
   */
  message: string;

  /**
   * Détails supplémentaires
   */
  details?: Record<string, any>;

  /**
   * Code de statut HTTP
   */
  statusCode?: HttpStatusCode;

  /**
   * Chemin de la requête
   */
  path?: string;

  /**
   * ID de la requête
   */
  requestId?: string;

  /**
   * Erreur originale
   */
  originalError?: Error;
}

/**
 * Résultat d'une opération qui peut échouer
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Type helper pour extraire le type d'erreur d'un Result
 */
export type ResultError<T> = T extends Result<any, infer E> ? E : never;

/**
 * Type helper pour extraire le type de données d'un Result
 */
export type ResultData<T> = T extends Result<infer D, any> ? D : never;

