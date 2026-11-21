/**
 * Interface de base pour tous les repositories
 * Définit les opérations CRUD standard
 */

import type {
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DeleteOptions,
  FindResult,
  CreateResult,
  UpdateResult,
  DeleteResult,
  CountOptions,
  AggregateOptions,
  AggregateResult,
  PaginationOptions,
  PaginatedFindResult,
} from '@/lib/types';
import type { BaseEntity } from '@/lib/types';

/**
 * Interface de base pour tous les repositories
 * Compatible avec IGenericRepository mais avec des signatures simplifiées
 */
export interface IRepository<T extends BaseEntity, TId = string> {
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

  /**
   * Trouver plusieurs documents (optionnel, requis par IGenericRepository)
   */
  findMany?(options?: FindOptions): Promise<FindResult<T>>;

  /**
   * Créer plusieurs documents (optionnel, requis par IGenericRepository)
   */
  createMany?(data: Partial<T>[], options?: CreateOptions): Promise<CreateResult<T>[]>;

  /**
   * Mettre à jour plusieurs documents (optionnel, requis par IGenericRepository)
   */
  updateMany?(
    filters: Record<string, any>,
    data: Partial<T>,
    options?: UpdateOptions,
  ): Promise<UpdateResult<T>>;

  /**
   * Supprimer plusieurs documents (optionnel, requis par IGenericRepository)
   */
  deleteMany?(filters: Record<string, any>, options?: DeleteOptions): Promise<DeleteResult>;

  /**
   * Agrégation (optionnel, requis par IGenericRepository)
   */
  aggregate?<TResult = any>(options: AggregateOptions): Promise<AggregateResult<TResult>>;
}

/**
 * Interface pour les repositories avec pagination
 */
export interface IPaginatedRepository<T extends BaseEntity, TId = string>
  extends IRepository<T, TId> {
  /**
   * Trouver des entités avec pagination
   */
  findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<T>>;
}

// Réexporter les types depuis lib/types pour compatibilité
export type {
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DeleteOptions,
  FindResult,
  CreateResult,
  UpdateResult,
  DeleteResult,
  CountOptions,
  PaginationOptions,
  PaginatedFindResult as PaginatedResult,
};
