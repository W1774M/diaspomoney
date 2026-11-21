/**
 * Types pour les builders
 * Définit les types pour les query builders et filter builders
 */

/**
 * Direction de tri
 */
export type SortDirection = 1 | -1 | 'asc' | 'desc';

/**
 * Opérateurs MongoDB supportés
 */
export type MongoOperator =
  | '$eq'
  | '$ne'
  | '$gt'
  | '$gte'
  | '$lt'
  | '$lte'
  | '$in'
  | '$nin'
  | '$exists'
  | '$regex'
  | '$or'
  | '$and'
  | '$nor'
  | '$not'
  | '$all'
  | '$elemMatch'
  | '$size'
  | '$type';

/**
 * Options de requête MongoDB
 */
export interface QueryOptions {
  /**
   * Filtres MongoDB
   */
  filters: Record<string, any>;

  /**
   * Tri
   */
  sort: Record<string, 1 | -1>;

  /**
   * Pagination
   */
  pagination: {
    limit?: number;
    offset?: number;
    page?: number;
  };

  /**
   * Projection (champs à inclure/exclure)
   */
  projection?: Record<string, 0 | 1>;

  /**
   * Options supplémentaires
   */
  options?: {
    /**
     * Collation pour le tri
     */
    collation?: {
      locale: string;
      strength?: number;
    };

    /**
     * Hint pour l'index à utiliser
     */
    hint?: string | Record<string, 1 | -1>;

    /**
     * Limite de temps d'exécution
     */
    maxTimeMS?: number;
  };
}

/**
 * Interface de base pour un QueryBuilder
 */
export interface IQueryBuilder {
  /**
   * Construire la requête finale
   */
  build(): QueryOptions;

  /**
   * Réinitialiser le builder
   */
  reset(): this;
}

/**
 * Options de pagination
 */
export interface PaginationOptions {
  /**
   * Nombre d'éléments par page
   */
  limit: number;

  /**
   * Numéro de page (1-based)
   */
  page: number;

  /**
   * Offset (alternative à page)
   */
  offset?: number;

  /**
   * Nombre total d'éléments
   */
  total?: number;

  /**
   * Tri (optionnel)
   */
  sort?: Record<string, 1 | -1>;
}

/**
 * Résultat de pagination
 */
export interface PaginationResult {
  /**
   * Page actuelle
   */
  page: number;

  /**
   * Nombre d'éléments par page
   */
  limit: number;

  /**
   * Nombre total d'éléments
   */
  total: number;

  /**
   * Nombre total de pages
   */
  pages: number;

  /**
   * Offset actuel
   */
  offset: number;

  /**
   * Y a-t-il une page suivante ?
   */
  hasNext: boolean;

  /**
   * Y a-t-il une page précédente ?
   */
  hasPrev: boolean;
}

/**
 * Options de tri
 */
export interface SortOptions {
  /**
   * Champ à trier
   */
  field: string;

  /**
   * Direction du tri
   */
  direction: SortDirection;
}

/**
 * Options de tri multiples
 */
export type MultiSortOptions = SortOptions[];

/**
 * Filtre de plage (range)
 */
export interface RangeFilter {
  /**
   * Valeur minimale
   */
  min?: number | Date;

  /**
   * Valeur maximale
   */
  max?: number | Date;

  /**
   * Inclure la valeur minimale
   */
  includeMin?: boolean;

  /**
   * Inclure la valeur maximale
   */
  includeMax?: boolean;
}

/**
 * Filtre de recherche textuelle
 */
export interface TextSearchFilter {
  /**
   * Terme de recherche
   */
  term: string;

  /**
   * Champs dans lesquels chercher
   */
  fields?: string[];

  /**
   * Recherche insensible à la casse
   */
  caseSensitive?: boolean;

  /**
   * Recherche exacte
   */
  exact?: boolean;
}

/**
 * Filtre de date
 */
export interface DateFilter {
  /**
   * Date de début
   */
  from?: Date | string;

  /**
   * Date de fin
   */
  to?: Date | string;

  /**
   * Inclure la date de début
   */
  includeFrom?: boolean;

  /**
   * Inclure la date de fin
   */
  includeTo?: boolean;
}

/**
 * Configuration d'un builder
 */
export interface BuilderConfig {
  /**
   * Nom du builder
   */
  name: string;

  /**
   * Limite par défaut
   */
  defaultLimit?: number;

  /**
   * Limite maximale
   */
  maxLimit?: number;

  /**
   * Tri par défaut
   */
  defaultSort?: SortOptions;

  /**
   * Valider les filtres
   */
  validateFilters?: boolean;
}

/**
 * Erreur de builder
 */
export interface BuilderError {
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
   * Valeur invalide
   */
  value?: unknown;
}

/**
 * Type helper pour extraire le type de filtre d'un builder
 */
export type BuilderFilter<T> = T extends IQueryBuilder ? QueryOptions['filters'] : never;

