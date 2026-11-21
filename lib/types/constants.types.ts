/**
 * Types dérivés des constantes
 * Types TypeScript dérivés des constantes définies dans lib/constants
 */

import type {
  LogLevel,
  ErrorCode,
  Timezone,
  CurrencyCode,
  LanguageCode,
  Role,
  UserStatus,
  BookingStatus,
  TransactionStatus,
  PaymentMethod,
  NotificationType,
  MessageType,
  SpecialityType,
  EducationLevel,
  BTPCategory,
  HealthSpecialty,
} from '@/lib/constants';

/**
 * Réexport des types de constantes
 */
export type {
  LogLevel,
  ErrorCode,
  Timezone,
  CurrencyCode,
  LanguageCode,
  Role,
  UserStatus,
  BookingStatus,
  TransactionStatus,
  PaymentMethod,
  NotificationType,
  MessageType,
  SpecialityType,
  EducationLevel,
  BTPCategory,
  HealthSpecialty,
};

/**
 * Type pour les valeurs de constantes
 */
export type ConstantValue<T> = T[keyof T];

/**
 * Type pour les clés de constantes
 */
export type ConstantKey<T> = keyof T;

/**
 * Type pour les environnements
 */
export type Environment = 'development' | 'recette' | 'production';

/**
 * Type pour les statuts de workflow
 */
export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Type pour les déclencheurs de workflow
 */
export type WorkflowTrigger = 'manual' | 'scheduled' | 'event' | 'webhook';

/**
 * Type pour les priorités de notification
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Type pour les canaux de notification
 */
export type NotificationChannel = 'slack' | 'email' | 'webhook';

/**
 * Type pour les formats d'export
 */
export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json';

/**
 * Type pour les types de service
 */
export type ServiceType = 'HEALTH' | 'BTP' | 'EDUCATION' | 'LEGAL' | 'FINANCE' | 'TECHNOLOGY';

/**
 * Type pour les types de réclamation
 */
export type ComplaintType = string; // À définir selon les constantes réelles

/**
 * Type pour les priorités de réclamation
 */
export type ComplaintPriority = string; // À définir selon les constantes réelles

/**
 * Type pour les statuts de facture
 */
export type InvoiceStatus = string; // À définir selon les constantes réelles

/**
 * Type pour les statuts de réclamation
 */
export type ComplaintStatus = string; // À définir selon les constantes réelles

/**
 * Type pour les collections de base de données
 */
export type DatabaseCollection =
  | 'users'
  | 'transactions'
  | 'payments'
  | 'appointments'
  | 'notifications'
  | 'audit_logs';

/**
 * Type pour les index de base de données
 */
export type DatabaseIndex =
  | 'email_1'
  | 'roles_1'
  | 'userId_1'
  | 'status_1'
  | 'providerId_1';

/**
 * Type pour les templates d'email
 */
export type EmailTemplate =
  | 'welcome'
  | 'password_reset'
  | 'payment_confirmation'
  | 'appointment_notification'
  | 'custom';

/**
 * Type pour les niveaux de log
 */
export type LogLevelType = 'error' | 'warn' | 'info' | 'debug';

/**
 * Type pour les codes de statut HTTP
 */
export type HttpStatusCode =
  | 200
  | 201
  | 202
  | 204
  | 301
  | 302
  | 304
  | 400
  | 401
  | 403
  | 404
  | 405
  | 409
  | 422
  | 429
  | 500
  | 502
  | 503
  | 504;

/**
 * Type pour les formats de date
 */
export type DateFormat =
  | 'YYYY-MM-DDTHH:mm:ss.SSSZ'
  | 'YYYY-MM-DD'
  | 'HH:mm:ss'
  | 'YYYY-MM-DD HH:mm:ss'
  | 'DD/MM/YYYY'
  | 'DD/MM/YYYY HH:mm'
  | 'YYYY-MM-DDTHH:mm:ssZ';

/**
 * Type pour les types de fichiers autorisés
 */
export type AllowedFileType = 'image/jpeg' | 'image/png' | 'image/gif' | 'application/pdf';

/**
 * Type pour les règles de validation
 */
export interface ValidationRuleType {
  /**
   * Longueur minimale
   */
  MIN_LENGTH?: number;

  /**
   * Longueur maximale
   */
  MAX_LENGTH?: number;

  /**
   * Valeur minimale
   */
  MIN?: number;

  /**
   * Valeur maximale
   */
  MAX?: number;

  /**
   * Expression régulière
   */
  REGEX?: RegExp;

  /**
   * Exigences spéciales
   */
  REQUIRE_UPPERCASE?: boolean;
  REQUIRE_LOWERCASE?: boolean;
  REQUIRE_NUMBER?: boolean;
  REQUIRE_SPECIAL_CHAR?: boolean;
  DECIMAL_PLACES?: number;
}

/**
 * Type pour les endpoints API
 */
export interface ApiEndpoint {
  /**
   * Endpoint de base
   */
  BASE: string;

  /**
   * Endpoints spécifiques
   */
  [key: string]: string | ((...args: any[]) => string);
}

/**
 * Type pour la configuration des constantes
 */
export interface ConstantsConfig {
  /**
   * Environnement actuel
   */
  environment: Environment;

  /**
   * Locale par défaut
   */
  defaultLocale: LanguageCode;

  /**
   * Devise par défaut
   */
  defaultCurrency: CurrencyCode;

  /**
   * Fuseau horaire par défaut
   */
  defaultTimezone: Timezone;
}

