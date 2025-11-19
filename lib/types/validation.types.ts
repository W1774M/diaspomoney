/**
 * Types pour la validation
 * Définit les types pour la validation avec Zod et autres validateurs
 */

/**
 * Résultat de validation
 */
export interface ValidationResult<T = any> {
  /**
   * Succès de la validation
   */
  success: boolean;

  /**
   * Données validées (si succès)
   */
  data?: T;

  /**
   * Erreurs de validation (si échec)
   */
  errors?: ValidationError[];

  /**
   * Erreurs formatées (si échec)
   */
  formattedErrors?: Record<string, string[]>;
}

/**
 * Erreur de validation
 */
export interface ValidationError {
  /**
   * Chemin du champ en erreur
   */
  path: (string | number)[];

  /**
   * Message d'erreur
   */
  message: string;

  /**
   * Code d'erreur
   */
  code?: string;

  /**
   * Valeur qui a causé l'erreur
   */
  received?: unknown;

  /**
   * Valeur attendue
   */
  expected?: unknown;
}

/**
 * Options de validation
 */
export interface ValidationOptions {
  /**
   * Arrêter à la première erreur
   */
  abortEarly?: boolean;

  /**
   * Inclure les valeurs reçues dans les erreurs
   */
  includeReceived?: boolean;

  /**
   * Inclure les valeurs attendues dans les erreurs
   */
  includeExpected?: boolean;

  /**
   * Messages d'erreur personnalisés
   */
  customMessages?: Record<string, string>;

  /**
   * Locale pour les messages
   */
  locale?: string;

  /**
   * Valider strictement (pas de coercion)
   */
  strict?: boolean;
}

/**
 * Fonction de validation
 */
export type ValidatorFunction<T = any> = (
  value: unknown,
  options?: ValidationOptions,
) => ValidationResult<T>;

/**
 * Règle de validation
 */
export interface ValidationRule {
  /**
   * Nom du champ
   */
  field: string;

  /**
   * Type de validation
   */
  type: 'required' | 'type' | 'format' | 'length' | 'range' | 'pattern' | 'custom';

  /**
   * Paramètres de validation
   */
  params?: Record<string, any>;

  /**
   * Message d'erreur personnalisé
   */
  message?: string;

  /**
   * Validateur personnalisé
   */
  validator?: (value: any) => boolean | string;
}

/**
 * Schéma de validation
 */
export interface ValidationSchema {
  /**
   * Règles de validation par champ
   */
  rules: Record<string, ValidationRule[]>;

  /**
   * Valider les champs inconnus
   */
  allowUnknown?: boolean;

  /**
   * Supprimer les champs inconnus
   */
  stripUnknown?: boolean;
}

/**
 * Résultat de validation de formulaire
 */
export interface FormValidationResult<T = Record<string, any>> {
  /**
   * Succès de la validation
   */
  success: boolean;

  /**
   * Données validées
   */
  data?: T;

  /**
   * Erreurs par champ
   */
  fieldErrors?: Record<string, string[]>;

  /**
   * Erreurs globales
   */
  globalErrors?: string[];
}

/**
 * Validateur de champ
 */
export interface FieldValidator {
  /**
   * Nom du champ
   */
  field: string;

  /**
   * Fonction de validation
   */
  validate: (value: any, context?: any) => boolean | string;

  /**
   * Message d'erreur
   */
  message?: string;
}

/**
 * Validateur personnalisé
 */
export interface CustomValidator<T = any> {
  /**
   * Nom du validateur
   */
  name: string;

  /**
   * Fonction de validation
   */
  validate: (value: T, context?: any) => boolean | string;

  /**
   * Message d'erreur par défaut
   */
  defaultMessage?: string;
}

/**
 * Options pour la validation asynchrone
 */
export interface AsyncValidationOptions extends ValidationOptions {
  /**
   * Timeout (ms)
   */
  timeout?: number;

  /**
   * Valider en parallèle
   */
  parallel?: boolean;
}

/**
 * Résultat de validation asynchrone
 */
export interface AsyncValidationResult<T = any> extends ValidationResult<T> {
  /**
   * Temps d'exécution (ms)
   */
  executionTime?: number;
}

/**
 * Type helper pour extraire le type validé d'un schéma Zod
 */
export type ValidatedType<T> = T extends { _output: infer O } ? O : never;

/**
 * Type helper pour extraire le type d'entrée d'un schéma Zod
 */
export type InputType<T> = T extends { _input: infer I } ? I : never;

