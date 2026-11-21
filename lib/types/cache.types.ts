/**
 * Types pour le cache
 * Définit les types pour la gestion du cache (Redis, mémoire, etc.)
 */

/**
 * Clé de cache
 */
export type CacheKey = string;

/**
 * Valeur de cache
 */
export type CacheValue = string | number | boolean | object | null;

/**
 * Options de cache
 */
export interface CacheOptions {
  /**
   * Durée de vie en secondes
   */
  ttl?: number;

  /**
   * Namespace pour la clé
   */
  namespace?: string;

  /**
   * Compresser les valeurs
   */
  compress?: boolean;

  /**
   * Serializer personnalisé
   */
  serializer?: (value: CacheValue) => string;

  /**
   * Deserializer personnalisé
   */
  deserializer?: (value: string) => CacheValue;
}

/**
 * Interface pour un cache
 */
export interface ICache {
  /**
   * Obtenir une valeur
   */
  get<T = CacheValue>(key: CacheKey): Promise<T | null>;

  /**
   * Définir une valeur
   */
  set(key: CacheKey, value: CacheValue, options?: CacheOptions): Promise<void>;

  /**
   * Supprimer une valeur
   */
  del(key: CacheKey): Promise<void>;

  /**
   * Supprimer plusieurs valeurs
   */
  delMany(keys: CacheKey[]): Promise<void>;

  /**
   * Vérifier si une clé existe
   */
  exists(key: CacheKey): Promise<boolean>;

  /**
   * Obtenir plusieurs valeurs
   */
  getMany<T = CacheValue>(keys: CacheKey[]): Promise<Map<CacheKey, T | null>>;

  /**
   * Définir plusieurs valeurs
   */
  setMany(entries: Map<CacheKey, CacheValue>, options?: CacheOptions): Promise<void>;

  /**
   * Incrémenter une valeur numérique
   */
  increment(key: CacheKey, by?: number): Promise<number>;

  /**
   * Décrémenter une valeur numérique
   */
  decrement(key: CacheKey, by?: number): Promise<number>;

  /**
   * Obtenir le TTL restant
   */
  ttl(key: CacheKey): Promise<number>;

  /**
   * Définir le TTL
   */
  expire(key: CacheKey, ttl: number): Promise<void>;

  /**
   * Supprimer toutes les clés correspondant à un pattern
   */
  clear(pattern?: string): Promise<void>;

  /**
   * Obtenir toutes les clés correspondant à un pattern
   */
  keys(pattern?: string): Promise<CacheKey[]>;

  /**
   * Vérifier la connexion
   */
  ping(): Promise<boolean>;
}

/**
 * Configuration d'un cache
 */
export interface CacheConfig {
  /**
   * Type de cache
   */
  type: 'redis' | 'memory' | 'hybrid';

  /**
   * URL de connexion (pour Redis)
   */
  url?: string;

  /**
   * Options de connexion
   */
  connectionOptions?: Record<string, any>;

  /**
   * TTL par défaut (secondes)
   */
  defaultTtl?: number;

  /**
   * Namespace par défaut
   */
  defaultNamespace?: string;

  /**
   * Activer la compression
   */
  enableCompression?: boolean;

  /**
   * Taille maximale du cache mémoire (en nombre d'éléments)
   */
  maxSize?: number;

  /**
   * Stratégie d'éviction (LRU, LFU, FIFO)
   */
  evictionStrategy?: 'lru' | 'lfu' | 'fifo';
}

/**
 * Statistiques de cache
 */
export interface CacheStats {
  /**
   * Nombre de hits
   */
  hits: number;

  /**
   * Nombre de misses
   */
  misses: number;

  /**
   * Taux de hit (0-1)
   */
  hitRate: number;

  /**
   * Nombre de clés
   */
  keys: number;

  /**
   * Taille du cache (bytes)
   */
  size: number;

  /**
   * Nombre d'évictions
   */
  evictions: number;
}

/**
 * Entrée de cache
 */
export interface CacheEntry<T = CacheValue> {
  /**
   * Clé
   */
  key: CacheKey;

  /**
   * Valeur
   */
  value: T;

  /**
   * Date d'expiration
   */
  expiresAt?: Date;

  /**
   * Date de création
   */
  createdAt: Date;

  /**
   * Date de dernière mise à jour
   */
  updatedAt: Date;

  /**
   * Nombre d'accès
   */
  accessCount: number;
}

/**
 * Options pour les opérations de cache en lot
 */
export interface CacheBatchOptions extends CacheOptions {
  /**
   * Taille du lot
   */
  batchSize?: number;

  /**
   * Délai entre les lots (ms)
   */
  batchDelay?: number;
}

/**
 * Résultat d'une opération de cache
 */
export interface CacheResult<T = CacheValue> {
  /**
   * Succès de l'opération
   */
  success: boolean;

  /**
   * Valeur (si succès)
   */
  value?: T;

  /**
   * Erreur (si échec)
   */
  error?: Error;

  /**
   * Temps d'exécution (ms)
   */
  executionTime?: number;
}

/**
 * Pattern de clé de cache
 */
export type CacheKeyPattern = string;

/**
 * Builder de clé de cache
 */
export class CacheKeyBuilder {
  private parts: string[] = [];

  /**
   * Ajouter une partie à la clé
   */
  add(part: string): this {
    this.parts.push(part);
    return this;
  }

  /**
   * Construire la clé finale
   */
  build(separator: string = ':'): CacheKey {
    return this.parts.join(separator);
  }

  /**
   * Réinitialiser le builder
   */
  reset(): this {
    this.parts = [];
    return this;
  }
}

