/**
 * Point d'entrée principal pour le système d'événements
 */

// EventBus
export { EventBus, eventBus, type EventCallback, type EventUnsubscribe } from './EventBus';

// Types d'événements
export {
  AuthEvents, BookingEvents,
  NotificationEvents, PaymentEvents, ServiceEvents,
  SystemEvents, TransactionEvents, UserEvents, type BookingCreatedEvent, type ErrorOccurredEvent, type NotificationSentEvent, type PaymentSucceededEvent, type UserLoggedInEvent
} from './EventTypes';

// Helpers
export {
  authEvents, bookingEvents, createEventHelpers, notificationEvents, paymentEvents, systemEvents
} from './EventHelpers';

