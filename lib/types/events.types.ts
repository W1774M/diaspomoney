/**
 * Types d'événements
 * Définit les types pour le système d'événements (EventBus)
 */

/**
 * Type d'événement
 */
export type EventType = string;

/**
 * Payload d'un événement
 */
export interface EventPayload {
  /**
   * Type d'événement
   */
  type: EventType;

  /**
   * Données de l'événement
   */
  data: Record<string, any>;

  /**
   * Métadonnées
   */
  metadata?: {
    /**
     * ID de l'événement
     */
    eventId?: string;

    /**
     * Timestamp de l'événement
     */
    timestamp?: Date;

    /**
     * ID de l'utilisateur qui a déclenché l'événement
     */
    userId?: string;

    /**
     * ID de la requête
     */
    requestId?: string;

    /**
     * Source de l'événement
     */
    source?: string;

    /**
     * Version de l'événement
     */
    version?: string;
  };
}

/**
 * Handler d'événement
 */
export type EventHandler<T = EventPayload> = (payload: T) => void | Promise<void>;

/**
 * Options pour s'abonner à un événement
 */
export interface SubscribeOptions {
  /**
   * Une seule fois (se désabonner après la première exécution)
   */
  once?: boolean;

  /**
   * Priorité du handler (plus élevé = exécuté en premier)
   */
  priority?: number;

  /**
   * Filtrer les événements
   */
  filter?: (payload: EventPayload) => boolean;
}

/**
 * Abonnement à un événement
 */
export interface EventSubscription {
  /**
   * ID de l'abonnement
   */
  id: string;

  /**
   * Type d'événement
   */
  eventType: EventType;

  /**
   * Handler
   */
  handler: EventHandler;

  /**
   * Options
   */
  options?: SubscribeOptions;

  /**
   * Se désabonner
   */
  unsubscribe: () => void;
}

/**
 * Interface pour un EventBus
 */
export interface IEventBus {
  /**
   * Publier un événement
   */
  publish<T = EventPayload>(eventType: EventType, payload: T): void | Promise<void>;

  /**
   * S'abonner à un événement
   */
  subscribe<T = EventPayload>(
    eventType: EventType,
    handler: EventHandler<T>,
    options?: SubscribeOptions,
  ): EventSubscription;

  /**
   * Se désabonner d'un événement
   */
  unsubscribe(subscription: EventSubscription): void;

  /**
   * Se désabonner de tous les événements d'un type
   */
  unsubscribeAll(eventType: EventType): void;

  /**
   * Vérifier si un type d'événement a des abonnés
   */
  hasSubscribers(eventType: EventType): boolean;

  /**
   * Obtenir le nombre d'abonnés pour un type d'événement
   */
  getSubscriberCount(eventType: EventType): number;
}

/**
 * Configuration d'un EventBus
 */
export interface EventBusConfig {
  /**
   * Gérer les erreurs dans les handlers
   */
  handleErrors?: boolean;

  /**
   * Logger les événements
   */
  logEvents?: boolean;

  /**
   * Timeout pour les handlers asynchrones (ms)
   */
  handlerTimeout?: number;

  /**
   * Nombre maximum de handlers par événement
   */
  maxHandlersPerEvent?: number;
}

/**
 * Événements système prédéfinis
 */
export enum SystemEventType {
  /**
   * Application démarrée
   */
  APP_STARTED = 'app.started',

  /**
   * Application arrêtée
   */
  APP_STOPPED = 'app.stopped',

  /**
   * Utilisateur créé
   */
  USER_CREATED = 'user.created',

  /**
   * Utilisateur mis à jour
   */
  USER_UPDATED = 'user.updated',

  /**
   * Utilisateur supprimé
   */
  USER_DELETED = 'user.deleted',

  /**
   * Transaction créée
   */
  TRANSACTION_CREATED = 'transaction.created',

  /**
   * Transaction complétée
   */
  TRANSACTION_COMPLETED = 'transaction.completed',

  /**
   * Transaction échouée
   */
  TRANSACTION_FAILED = 'transaction.failed',

  /**
   * Paiement créé
   */
  PAYMENT_CREATED = 'payment.created',

  /**
   * Paiement complété
   */
  PAYMENT_COMPLETED = 'payment.completed',

  /**
   * Paiement échoué
   */
  PAYMENT_FAILED = 'payment.failed',

  /**
   * Réservation créée
   */
  BOOKING_CREATED = 'booking.created',

  /**
   * Réservation confirmée
   */
  BOOKING_CONFIRMED = 'booking.confirmed',

  /**
   * Réservation annulée
   */
  BOOKING_CANCELLED = 'booking.cancelled',

  /**
   * Notification envoyée
   */
  NOTIFICATION_SENT = 'notification.sent',

  /**
   * Erreur système
   */
  SYSTEM_ERROR = 'system.error',
}

/**
 * Payload pour l'événement USER_CREATED
 */
export interface UserCreatedPayload extends EventPayload {
  type: SystemEventType.USER_CREATED;
  data: {
    userId: string;
    email: string;
    name: string;
  };
}

/**
 * Payload pour l'événement TRANSACTION_CREATED
 */
export interface TransactionCreatedPayload extends EventPayload {
  type: SystemEventType.TRANSACTION_CREATED;
  data: {
    transactionId: string;
    userId: string;
    amount: number;
    currency: string;
  };
}

/**
 * Payload pour l'événement PAYMENT_COMPLETED
 */
export interface PaymentCompletedPayload extends EventPayload {
  type: SystemEventType.PAYMENT_COMPLETED;
  data: {
    paymentId: string;
    transactionId: string;
    amount: number;
    currency: string;
  };
}

/**
 * Union de tous les payloads d'événements système
 */
export type SystemEventPayload =
  | UserCreatedPayload
  | TransactionCreatedPayload
  | PaymentCompletedPayload
  | EventPayload;

