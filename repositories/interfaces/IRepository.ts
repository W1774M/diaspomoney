/**
 * Interface de base pour tous les repositories
 * Définit les opérations CRUD standard
 */

export interface IRepository<T, TId = string> {
  /**
   * Trouver une entité par son ID
   */
  findById(id: TId): Promise<T | null>;

  /**
   * Trouver toutes les entités avec filtres optionnels
   */
  findAll(filters?: Record<string, any>): Promise<T[]>;

  /**
   * Trouver une entité avec filtres
   */
  findOne(filters: Record<string, any>): Promise<T | null>;

  /**
   * Créer une nouvelle entité
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * Mettre à jour une entité existante
   */
  update(id: TId, data: Partial<T>): Promise<T | null>;

  /**
   * Supprimer une entité
   */
  delete(id: TId): Promise<boolean>;

  /**
   * Compter les entités avec filtres optionnels
   */
  count(filters?: Record<string, any>): Promise<number>;

  /**
   * Vérifier si une entité existe
   */
  exists(id: TId): Promise<boolean>;
}

/**
 * Interface pour les repositories avec pagination
 */
export interface IPaginatedRepository<T, TId = string>
  extends IRepository<T, TId> {
  /**
   * Trouver des entités avec pagination
   */
  findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<T>>;
}

/**
 * Options de pagination
 * Utilisé pour contrôler la pagination des résultats de requêtes
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  sort?: Record<string, 1 | -1>;
}

/**
 * Résultat paginé
 * Contient les données paginées ainsi que les métadonnées de pagination
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
