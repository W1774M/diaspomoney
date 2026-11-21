/**
 * Types génériques pour les repositories
 * Définit les types génériques pour les repositories (complément aux interfaces)
 */

import type { BaseEntity } from './index';

/**
 * Options de recherche
 */
export interface FindOptions {
  /**
   * Filtres
   */
  filters?: Record<string, any>;

  /**
   * Tri
   */
  sort?: Record<string, 1 | -1>;

  /**
   * Pagination
   */
  pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
  };

  /**
   * Projection
   */
  projection?: Record<string, 0 | 1>;

  /**
   * Options supplémentaires
   */
  options?: Record<string, any>;
}

/**
 * Options de création
 */
export interface CreateOptions {
  /**
   * Valider avant création
   */
  validate?: boolean;

  /**
   * Retourner le document créé
   */
  returnDocument?: boolean;

  /**
   * Options supplémentaires
   */
  options?: Record<string, any>;
}

/**
 * Options de mise à jour
 */
export interface UpdateOptions {
  /**
   * Valider avant mise à jour
   */
  validate?: boolean;

  /**
   * Retourner le document mis à jour
   */
  returnDocument?: boolean;

  /**
   * Créer si n'existe pas (upsert)
   */
  upsert?: boolean;

  /**
   * Options supplémentaires
   */
  options?: Record<string, any>;
}

/**
 * Options de suppression
 */
export interface DeleteOptions {
  /**
   * Supprimer définitivement (pas de soft delete)
   */
  hardDelete?: boolean;

  /**
   * Retourner le document supprimé
   */
  returnDocument?: boolean;

  /**
   * Options supplémentaires
   */
  options?: Record<string, any>;
}

/**
 * Résultat de recherche
 */
export interface FindResult<T extends BaseEntity> {
  /**
   * Documents trouvés
   */
  data: T[];

  /**
   * Nombre total de documents
   */
  total: number;

  /**
   * Pagination
   */
  pagination?: {
    page: number;
    limit: number;
    pages: number;
    offset: number;
  };
}

/**
 * Résultat de création
 */
export interface CreateResult<T extends BaseEntity> {
  /**
   * Document créé
   */
  data: T;

  /**
   * ID du document créé
   */
  id: string;

  /**
   * Succès de l'opération
   */
  success: boolean;
}

/**
 * Résultat de mise à jour
 */
export interface UpdateResult<T extends BaseEntity> {
  /**
   * Document mis à jour
   */
  data?: T;

  /**
   * Nombre de documents modifiés
   */
  modifiedCount: number;

  /**
   * Succès de l'opération
   */
  success: boolean;

  /**
   * Document créé (si upsert)
   */
  upserted?: T;
}

/**
 * Résultat de suppression
 */
export interface DeleteResult {
  /**
   * Nombre de documents supprimés
   */
  deletedCount: number;

  /**
   * Succès de l'opération
   */
  success: boolean;

  /**
   * Document supprimé (si returnDocument)
   */
  deletedDocument?: any;
}

/**
 * Options de comptage
 */
export interface CountOptions {
  /**
   * Filtres
   */
  filters?: Record<string, any>;

  /**
   * Options supplémentaires
   */
  options?: Record<string, any>;
}

/**
 * Options d'agrégation
 */
export interface AggregateOptions {
  /**
   * Pipeline d'agrégation
   */
  pipeline: any[];

  /**
   * Options supplémentaires
   */
  options?: Record<string, any>;
}

/**
 * Résultat d'agrégation
 */
export interface AggregateResult<T = any> {
  /**
   * Résultats de l'agrégation
   */
  data: T[];

  /**
   * Métadonnées
   */
  metadata?: {
    /**
     * Temps d'exécution (ms)
     */
    executionTime?: number;

    /**
     * Nombre de documents traités
     */
    documentsProcessed?: number;
  };
}

/**
 * Options de transaction
 */
export interface TransactionOptions {
  /**
   * Timeout (ms)
   */
  timeout?: number;

  /**
   * Niveau d'isolation
   */
  isolationLevel?: 'read-uncommitted' | 'read-committed' | 'repeatable-read' | 'serializable';

  /**
   * Rollback automatique en cas d'erreur
   */
  autoRollback?: boolean;
}

/**
 * Callback de transaction
 */
export type TransactionCallback<T = any> = () => Promise<T>;

/**
 * Interface générique pour un repository
 */
export interface IGenericRepository<T extends BaseEntity> {
  /**
   * Trouver un document par ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Trouver un document par critères
   */
  findOne(filters: Record<string, any>): Promise<T | null>;

  /**
   * Trouver plusieurs documents
   */
  findMany(options?: FindOptions): Promise<FindResult<T>>;

  /**
   * Trouver tous les documents
   */
  findAll(filters?: Record<string, any>): Promise<T[]>;

  /**
   * Créer un document
   */
  create(data: Partial<T>, options?: CreateOptions): Promise<CreateResult<T>>;

  /**
   * Créer plusieurs documents
   */
  createMany(data: Partial<T>[], options?: CreateOptions): Promise<CreateResult<T>[]>;

  /**
   * Mettre à jour un document
   */
  update(id: string, data: Partial<T>, options?: UpdateOptions): Promise<UpdateResult<T>>;

  /**
   * Mettre à jour plusieurs documents
   */
  updateMany(
    filters: Record<string, any>,
    data: Partial<T>,
    options?: UpdateOptions,
  ): Promise<UpdateResult<T>>;

  /**
   * Supprimer un document
   */
  delete(id: string, options?: DeleteOptions): Promise<DeleteResult>;

  /**
   * Supprimer plusieurs documents
   */
  deleteMany(filters: Record<string, any>, options?: DeleteOptions): Promise<DeleteResult>;

  /**
   * Compter les documents
   */
  count(options?: CountOptions): Promise<number>;

  /**
   * Vérifier l'existence d'un document
   */
  exists(filters: Record<string, any>): Promise<boolean>;

  /**
   * Agrégation
   */
  aggregate<TResult = any>(options: AggregateOptions): Promise<AggregateResult<TResult>>;
}

/**
 * Options de recherche avec pagination
 */
export interface PaginatedFindOptions extends FindOptions {
  /**
   * Pagination obligatoire
   */
  pagination: {
    limit: number;
    page: number;
    offset?: number;
  };
}

/**
 * Résultat de recherche paginé
 */
export interface PaginatedFindResult<T extends BaseEntity> extends FindResult<T> {
  /**
   * Pagination obligatoire
   */
  pagination: {
    page: number;
    limit: number;
    pages: number;
    offset: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

