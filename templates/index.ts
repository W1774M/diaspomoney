/**
 * Templates Index
 * 
 * Export centralisé de tous les templates et processeurs de paiement
 */

export {
  PaymentProcessor, type PaymentData, type PaymentResult
} from './payment-processor.template';

export { PaymentProcessorFactory, type PaymentProvider } from './payment-processor-factory';
export { PayPalPaymentProcessor } from './paypal-payment-processor';
export { StripePaymentProcessor } from './stripe-payment-processor';

