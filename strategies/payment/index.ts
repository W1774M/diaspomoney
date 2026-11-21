/**
 * Point d'entrée principal pour les stratégies de paiement
 */

// Interfaces
export * from './interfaces/IPaymentStrategy';

// Implémentations
export { StripePaymentStrategy } from './implementations/StripePaymentStrategy';
export { PayPalPaymentStrategy } from './implementations/PayPalPaymentStrategy';

// Factory
export { PaymentStrategyFactory, type PaymentProvider } from './PaymentStrategyFactory';

