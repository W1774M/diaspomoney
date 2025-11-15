/**
 * Factory pour créer les stratégies de paiement
 * Implémente le Factory Pattern pour créer les bonnes stratégies
 */

import { IPaymentStrategy } from './interfaces/IPaymentStrategy';
import { StripePaymentStrategy } from './implementations/StripePaymentStrategy';
import { PayPalPaymentStrategy } from './implementations/PayPalPaymentStrategy';

export type PaymentProvider = 'STRIPE' | 'PAYPAL';

/**
 * Factory pour créer les stratégies de paiement
 */
export class PaymentStrategyFactory {
  private static strategies: Map<PaymentProvider, IPaymentStrategy> = new Map();

  /**
   * Obtenir une stratégie de paiement
   */
  static getStrategy(provider: PaymentProvider): IPaymentStrategy {
    // Utiliser le cache si disponible
    if (this.strategies.has(provider)) {
      return this.strategies.get(provider)!;
    }

    // Créer la stratégie appropriée
    let strategy: IPaymentStrategy;

    switch (provider) {
      case 'STRIPE':
        strategy = new StripePaymentStrategy();
        break;
      case 'PAYPAL':
        strategy = new PayPalPaymentStrategy();
        break;
      default:
        throw new Error(`Payment provider ${provider} is not supported`);
    }

    // Mettre en cache
    this.strategies.set(provider, strategy);

    return strategy;
  }

  /**
   * Obtenir toutes les stratégies disponibles
   */
  static getAllStrategies(): IPaymentStrategy[] {
    const providers: PaymentProvider[] = ['STRIPE', 'PAYPAL'];
    return providers.map(provider => this.getStrategy(provider));
  }

  /**
   * Obtenir la meilleure stratégie pour un paiement donné
   */
  static getBestStrategy(
    currency: string,
    country?: string
  ): IPaymentStrategy | null {
    const strategies = this.getAllStrategies();

    // Filtrer les stratégies qui peuvent traiter ce paiement
    const availableStrategies = strategies.filter(strategy => {
      const canProcessCurrency = strategy.supportedCurrencies.includes(
        currency.toUpperCase()
      );
      const canProcessCountry = !country || strategy.supportedCountries.includes(country);
      return canProcessCurrency && canProcessCountry;
    });

    if (availableStrategies.length === 0) {
      return null;
    }

    // Préférer Stripe par défaut (peut être amélioré avec une logique de préférence)
    return availableStrategies.find(s => s.name === 'STRIPE') || availableStrategies[0] || null;
  }

  /**
   * Réinitialiser le cache (utile pour les tests)
   */
  static reset(): void {
    this.strategies.clear();
  }
}

