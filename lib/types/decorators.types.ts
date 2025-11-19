/**
 * Types pour les decorators
 * Définit les types pour les options et métadonnées des decorators
 */

/**
 * Options de base pour tous les decorators
 */
export interface BaseDecoratorOptions {
  /**
   * Activer/désactiver le decorator
   */
  enabled?: boolean;

  /**
   * Logger les actions du decorator
   */
  log?: boolean;
}

/**
 * Options pour le decorator @Log
 */
export interface LogDecoratorOptions extends BaseDecoratorOptions {
  /**
   * Niveau de log
   */
  level?: 'debug' | 'info' | 'warn' | 'error';

  /**
   * Logger les arguments
   */
  logArgs?: boolean;

  /**
   * Logger le résultat
   */
  logResult?: boolean;

  /**
   * Logger le temps d'exécution
   */
  logExecutionTime?: boolean;

  /**
   * Champs à masquer dans les logs
   */
  maskSensitiveFields?: string[];

  /**
   * Envoyer les erreurs à Sentry
   */
  sendToSentry?: boolean;
}

/**
 * Options pour le decorator @Cacheable
 */
export interface CacheableDecoratorOptions extends BaseDecoratorOptions {
  /**
   * Durée de vie du cache en secondes
   */
  ttl?: number;

  /**
   * Préfixe pour la clé de cache
   */
  prefix?: string;

  /**
   * Utiliser le cache mémoire en fallback
   */
  useMemoryFallback?: boolean;

  /**
   * Invalider le cache après certaines opérations
   */
  invalidateOn?: string[];
}

/**
 * Options pour le decorator @InvalidateCache
 */
export interface InvalidateCacheDecoratorOptions extends BaseDecoratorOptions {
  /**
   * Pattern de clés à invalider
   */
  pattern: string;

  /**
   * Invalider aussi le cache mémoire
   */
  invalidateMemory?: boolean;
}

/**
 * Options pour le decorator @Retry
 */
export interface RetryDecoratorOptions extends BaseDecoratorOptions {
  /**
   * Nombre maximum de tentatives
   */
  maxAttempts?: number;

  /**
   * Délai initial entre les tentatives (ms)
   */
  initialDelay?: number;

  /**
   * Délai entre les tentatives (ms) - alias pour initialDelay
   */
  delay?: number;

  /**
   * Type de backoff
   */
  backoff?: 'fixed' | 'linear' | 'exponential';

  /**
   * Multiplicateur pour le délai exponentiel
   */
  backoffMultiplier?: number;

  /**
   * Délai maximum entre les tentatives (ms)
   */
  maxDelay?: number;

  /**
   * Fonction pour déterminer si on doit retry
   */
  shouldRetry?: (error: any) => boolean;

  /**
   * Callback appelé avant chaque retry
   */
  onRetry?: (attempt: number, error: any) => void;

  /**
   * Logger les tentatives
   */
  logRetries?: boolean;

  /**
   * Erreurs qui déclenchent une nouvelle tentative
   */
  retryableErrors?: string[];

  /**
   * Logger les tentatives
   */
  logAttempts?: boolean;
}

/**
 * Options pour le decorator @Validate
 */
export interface ValidateDecoratorOptions extends BaseDecoratorOptions {
  /**
   * Règles de validation
   */
  rules: ValidationRule[];

  /**
   * Lancer une erreur en cas d'échec
   */
  throwOnError?: boolean;

  /**
   * Logger les erreurs de validation
   */
  logErrors?: boolean;
}

/**
 * Règle de validation
 */
export interface ValidationRule {
  /**
   * Index du paramètre à valider (0-based)
   */
  paramIndex: number;

  /**
   * Schéma Zod pour la validation
   */
  schema: any; // z.ZodTypeAny

  /**
   * Nom du paramètre (pour les messages d'erreur)
   */
  paramName?: string;
}

/**
 * Options pour le decorator @RateLimit
 */
export interface RateLimitDecoratorOptions extends BaseDecoratorOptions {
  /**
   * Nombre maximum de requêtes
   */
  maxRequests: number;

  /**
   * Fenêtre de temps en millisecondes
   */
  windowMs: number;

  /**
   * Message d'erreur personnalisé
   */
  errorMessage?: string;

  /**
   * Clé pour identifier le client (par défaut: IP)
   */
  keyGenerator?: (...args: any[]) => string;
}

/**
 * Options pour le decorator @Authorize
 */
export interface AuthorizeDecoratorOptions extends BaseDecoratorOptions {
  /**
   * Rôles autorisés
   */
  roles?: string[];

  /**
   * Permissions requises
   */
  permissions?: string[];

  /**
   * Vérifier la propriété de la ressource
   */
  checkOwnership?: boolean;

  /**
   * Champ contenant l'ID du propriétaire
   */
  ownershipField?: string;
}

/**
 * Options pour le decorator @Audit
 */
export interface AuditDecoratorOptions extends BaseDecoratorOptions {
  /**
   * Type d'événement d'audit
   */
  eventType: string;

  /**
   * Inclure les arguments dans l'audit
   */
  includeArgs?: boolean;

  /**
   * Inclure le résultat dans l'audit
   */
  includeResult?: boolean;

  /**
   * Champs sensibles à exclure
   */
  excludeSensitiveFields?: string[];
}

/**
 * Options pour le decorator @Deprecated
 */
export interface DeprecatedDecoratorOptions extends BaseDecoratorOptions {
  /**
   * Message de dépréciation
   */
  message?: string;

  /**
   * Version de dépréciation
   */
  since?: string;

  /**
   * Alternative recommandée
   */
  alternative?: string;
}

/**
 * Options pour le decorator @Performance
 */
export interface PerformanceDecoratorOptions extends BaseDecoratorOptions {
  /**
   * Seuil d'avertissement en millisecondes
   */
  warningThreshold?: number;

  /**
   * Seuil d'erreur en millisecondes
   */
  errorThreshold?: number;

  /**
   * Logger les métriques
   */
  logMetrics?: boolean;

  /**
   * Envoyer les métriques à un service externe
   */
  sendMetrics?: boolean;
}

/**
 * Options pour le decorator @Transaction
 */
export interface TransactionDecoratorOptions extends BaseDecoratorOptions {
  /**
   * Niveau d'isolation
   */
  isolationLevel?: 'read-uncommitted' | 'read-committed' | 'repeatable-read' | 'serializable';

  /**
   * Timeout en millisecondes
   */
  timeout?: number;

  /**
   * Rollback en cas d'erreur
   */
  rollbackOnError?: boolean;
}

/**
 * Options pour le decorator @CircuitBreaker
 */
export interface CircuitBreakerDecoratorOptions extends BaseDecoratorOptions {
  /**
   * Seuil d'erreur (nombre d'erreurs)
   */
  errorThreshold?: number;

  /**
   * Fenêtre de temps en millisecondes
   */
  windowMs?: number;

  /**
   * Délai avant de réessayer (ms)
   */
  resetTimeout?: number;

  /**
   * Logger les changements d'état
   */
  logStateChanges?: boolean;
}

/**
 * Métadonnées d'un decorator
 */
export interface DecoratorMetadata {
  /**
   * Nom du decorator
   */
  name: string;

  /**
   * Options du decorator
   */
  options: BaseDecoratorOptions;

  /**
   * Date d'application
   */
  appliedAt: Date;

  /**
   * Classe cible
   */
  targetClass?: string;

  /**
   * Méthode cible
   */
  targetMethod?: string;
}

/**
 * Type helper pour extraire les options d'un decorator
 */
export type DecoratorOptions<T> = T extends (options: infer O) => any ? O : never;

