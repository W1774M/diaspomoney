/**
 * Types pour les mappers
 * Définit les types d'entrée/sortie et les transformations pour les mappers
 */

/**
 * Interface de base pour un mapper
 * @template TInput - Type d'entrée (document de base de données)
 * @template TOutput - Type de sortie (réponse API)
 */
export interface IMapper<TInput, TOutput> {
  /**
   * Transforme un document d'entrée en réponse API
   * @param input - Document d'entrée
   * @returns Réponse API formatée
   */
  map(input: TInput): TOutput;

  /**
   * Transforme un tableau de documents
   * @param inputs - Tableau de documents d'entrée
   * @returns Tableau de réponses API
   */
  mapMany(inputs: TInput[]): TOutput[];
}

/**
 * Options de mapping
 */
export interface MappingOptions {
  /**
   * Locale pour la localisation des données
   */
  locale?: string;

  /**
   * Inclure les champs optionnels
   */
  includeOptional?: boolean;

  /**
   * Champs à exclure du mapping
   */
  excludeFields?: string[];

  /**
   * Champs à inclure explicitement
   */
  includeFields?: string[];

  /**
   * Transformer les dates en ISO string
   */
  formatDates?: boolean;

  /**
   * Transformer les montants selon la devise
   */
  formatCurrency?: boolean;
}

/**
 * Résultat d'un mapping
 * @template TOutput - Type de sortie
 */
export interface MappingResult<TOutput> {
  /**
   * Données mappées
   */
  data: TOutput;

  /**
   * Métadonnées du mapping
   */
  metadata?: {
    /**
     * Date du mapping
     */
    mappedAt: Date;

    /**
     * Locale utilisée
     */
    locale?: string;

    /**
     * Version du mapper
     */
    version?: string;
  };
}

/**
 * Erreur de mapping
 */
export interface MappingError {
  /**
   * Code d'erreur
   */
  code: string;

  /**
   * Message d'erreur
   */
  message: string;

  /**
   * Champ en erreur
   */
  field?: string;

  /**
   * Valeur originale qui a causé l'erreur
   */
  originalValue?: unknown;
}

/**
 * Configuration d'un mapper
 */
export interface MapperConfig {
  /**
   * Nom du mapper
   */
  name: string;

  /**
   * Version du mapper
   */
  version: string;

  /**
   * Options par défaut
   */
  defaultOptions?: MappingOptions;

  /**
   * Validation des données d'entrée
   */
  validateInput?: boolean;

  /**
   * Validation des données de sortie
   */
  validateOutput?: boolean;
}

/**
 * Type helper pour extraire le type d'entrée d'un mapper
 */
export type MapperInput<T> = T extends IMapper<infer I, any> ? I : never;

/**
 * Type helper pour extraire le type de sortie d'un mapper
 */
export type MapperOutput<T> = T extends IMapper<any, infer O> ? O : never;

/**
 * Type pour les fonctions de mapping
 */
export type MappingFunction<TInput, TOutput> = (
  input: TInput,
  options?: MappingOptions,
) => TOutput;

/**
 * Type pour les fonctions de mapping de tableau
 */
export type MappingManyFunction<TInput, TOutput> = (
  inputs: TInput[],
  options?: MappingOptions,
) => TOutput[];

