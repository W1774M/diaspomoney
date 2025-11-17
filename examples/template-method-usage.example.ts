/**
 * Exemple d'utilisation du Template Method Pattern pour les paiements
 * 
 * Ce fichier montre comment utiliser les PaymentProcessor dans votre codebase
 */

import { logger } from '@/lib/logger';
import { PaymentData, PaymentProcessorFactory, PaymentResult } from '@/templates';

/**
 * Exemple 1: Utilisation basique avec un provider spécifique
 */
export async function exampleBasicUsage() {
  // Créer un processeur Stripe
  const stripeProcessor = PaymentProcessorFactory.createProcessor('STRIPE');

  // Préparer les données de paiement
  const paymentData: PaymentData = {
    amount: 100.0,
    currency: 'EUR',
    customerId: 'cus_123456',
    paymentMethodId: 'pm_123456',
    metadata: {
      orderId: 'order_123',
      description: 'Service de santé',
    },
  };

  // Traiter le paiement (le template method s'occupe de tout)
  const result: PaymentResult = await stripeProcessor.process(paymentData);

  if (result.success) {
    logger.info({
      transactionId: result.transactionId,
      paymentIntentId: result.paymentIntentId,
    }, 'Payment processed successfully');
  } else {
    logger.error({ error: result.error }, 'Payment failed');
  }
}

/**
 * Exemple 2: Utilisation avec sélection automatique du meilleur provider
 */
export async function exampleAutoSelectProvider() {
  // Obtenir le meilleur processeur selon la devise
  const processor = PaymentProcessorFactory.getBestProcessor('EUR', 'FR');

  const paymentData: PaymentData = {
    amount: 50.0,
    currency: 'EUR',
    customerId: 'cus_789012',
    paymentMethodId: 'pm_789012',
  };

  const result = await processor.process(paymentData);
  return result;
}

/**
 * Exemple 3: Utilisation dans une classe de service
 */
export class PaymentServiceExample {
  private processor = PaymentProcessorFactory.getBestProcessor('EUR');

  async processUserPayment(
    userId: string,
    amount: number,
    currency: string,
    paymentMethodId: string,
  ): Promise<PaymentResult> {
    const paymentData: PaymentData = {
      amount,
      currency,
      customerId: userId,
      paymentMethodId,
      metadata: {
        userId,
        timestamp: new Date().toISOString(),
      },
    };

    // Le template method gère toute la logique :
    // - Validation
    // - Création du paiement
    // - Confirmation
    // - Métriques
    // - Notifications
    return await this.processor.process(paymentData);
  }

  /**
   * Changer de provider dynamiquement
   */
  switchProvider(provider: 'STRIPE' | 'PAYPAL') {
    this.processor = PaymentProcessorFactory.createProcessor(provider);
    logger.info({ provider }, 'Payment processor switched');
  }
}

/**
 * Exemple 4: Gestion des paiements nécessitant une action (3D Secure, etc.)
 */
export async function exampleWithActionRequired() {
  const processor = PaymentProcessorFactory.createProcessor('STRIPE');

  const paymentData: PaymentData = {
    amount: 200.0,
    currency: 'EUR',
    customerId: 'cus_345678',
    paymentMethodId: 'pm_345678',
  };

  const result = await processor.process(paymentData);

  if (result.requiresAction && result.nextAction) {
    // Rediriger l'utilisateur vers l'URL d'authentification
    logger.info({
      actionType: result.nextAction.type,
      url: result.nextAction.url,
    }, 'Payment requires additional action (e.g., 3D Secure)');

    // Dans une vraie application, vous redirigeriez l'utilisateur ici
    // return redirect(result.nextAction.url);
  }

  return result;
}

/**
 * Exemple 5: Obtenir les informations de tous les providers disponibles
 */
export function exampleGetProviderInfo() {
  const processors = PaymentProcessorFactory.getAvailableProcessors();

  const providersInfo = processors.map(processor => processor.getProviderInfo());

  logger.info({ providers: providersInfo }, 'Available payment providers');

  return providersInfo;
}

