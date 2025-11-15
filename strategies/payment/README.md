# Strategy Pattern - Paiements

Ce dossier contient l'implémentation du **Strategy Pattern** pour la gestion des paiements dans DiaspoMoney.

## 📋 Structure

```
strategies/payment/
├── interfaces/
│   └── IPaymentStrategy.ts          # Interface principale
├── implementations/
│   ├── StripePaymentStrategy.ts     # Implémentation Stripe
│   └── PayPalPaymentStrategy.ts     # Implémentation PayPal
├── PaymentStrategyFactory.ts        # Factory pour créer les stratégies
├── index.ts                         # Exports principaux
└── README.md                        # Documentation
```

## 🎯 Objectifs

1. **Flexibilité** : Ajouter de nouveaux providers de paiement sans modifier le code existant
2. **Testabilité** : Faciliter les tests avec des mocks
3. **Maintenabilité** : Séparer la logique de chaque provider
4. **Extensibilité** : Facile d'ajouter de nouveaux providers (Mobile Money, etc.)

## 📖 Utilisation

### Exemple de base

```typescript
import { PaymentStrategyFactory, PaymentProvider } from '@/strategies/payment';

// Obtenir une stratégie spécifique
const stripeStrategy = PaymentStrategyFactory.getStrategy('STRIPE');
const paypalStrategy = PaymentStrategyFactory.getStrategy('PAYPAL');

// Traiter un paiement
const result = await stripeStrategy.processPayment({
  amount: 100,
  currency: 'EUR',
  customerId: 'cus_123',
  paymentMethodId: 'pm_123',
});

if (result.success) {
  console.log('Paiement réussi:', result.transactionId);
} else {
  console.error('Erreur:', result.error);
}
```

### Utilisation avec PaymentService

```typescript
import { paymentService } from '@/services/payment/payment.service.strategy';

// Le service sélectionne automatiquement la meilleure stratégie
const paymentIntent = await paymentService.createPaymentIntent(
  100,
  'EUR',
  'cus_123'
);

// Ou spécifier un provider
const paymentIntent = await paymentService.createPaymentIntent(
  100,
  'EUR',
  'cus_123',
  {},
  'PAYPAL' // Forcer l'utilisation de PayPal
);
```

### Sélection automatique de la meilleure stratégie

```typescript
import { PaymentStrategyFactory } from '@/strategies/payment';

// La factory sélectionne automatiquement la meilleure stratégie
// basée sur la devise et le pays
const bestStrategy = PaymentStrategyFactory.getBestStrategy('EUR', 'FR');
// Retourne StripePaymentStrategy car Stripe supporte EUR et FR

const bestStrategy = PaymentStrategyFactory.getBestStrategy('USD', 'US');
// Retourne StripePaymentStrategy ou PayPalPaymentStrategy
```

## 🔧 Ajouter un nouveau provider

### 1. Créer l'implémentation

```typescript
// strategies/payment/implementations/MobileMoneyPaymentStrategy.ts
import { IPaymentStrategy, PaymentData, PaymentResult } from '../interfaces/IPaymentStrategy';

export class MobileMoneyPaymentStrategy implements IPaymentStrategy {
  readonly name = 'MOBILE_MONEY';
  readonly supportedCurrencies = ['XOF', 'XAF'];
  readonly supportedCountries = ['SN', 'CI', 'ML'];

  canProcess(data: PaymentData): boolean {
    return (
      this.supportedCurrencies.includes(data.currency.toUpperCase()) &&
      data.amount > 0
    );
  }

  async processPayment(data: PaymentData): Promise<PaymentResult> {
    // Implémentation spécifique à Mobile Money
    // ...
  }

  // Implémenter les autres méthodes de l'interface
  // ...
}
```

### 2. Ajouter au Factory

```typescript
// strategies/payment/PaymentStrategyFactory.ts
import { MobileMoneyPaymentStrategy } from './implementations/MobileMoneyPaymentStrategy';

export type PaymentProvider = 'STRIPE' | 'PAYPAL' | 'MOBILE_MONEY';

static getStrategy(provider: PaymentProvider): IPaymentStrategy {
  switch (provider) {
    case 'STRIPE':
      return new StripePaymentStrategy();
    case 'PAYPAL':
      return new PayPalPaymentStrategy();
    case 'MOBILE_MONEY':
      return new MobileMoneyPaymentStrategy();
    // ...
  }
}
```

## 🧪 Tests

### Mock d'une stratégie pour les tests

```typescript
// tests/mocks/MockPaymentStrategy.ts
import { IPaymentStrategy, PaymentData, PaymentResult } from '@/strategies/payment';

export class MockPaymentStrategy implements IPaymentStrategy {
  readonly name = 'MOCK';
  readonly supportedCurrencies = ['EUR', 'USD'];
  readonly supportedCountries = ['FR', 'US'];

  canProcess(data: PaymentData): boolean {
    return true;
  }

  async processPayment(data: PaymentData): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: 'mock_transaction_123',
    };
  }

  // Implémenter les autres méthodes...
}
```

### Utilisation dans les tests

```typescript
// tests/services/payment.service.test.ts
import { PaymentStrategyFactory } from '@/strategies/payment';
import { MockPaymentStrategy } from '../mocks/MockPaymentStrategy';

describe('PaymentService', () => {
  beforeEach(() => {
    // Remplacer la stratégie par un mock
    PaymentStrategyFactory.reset();
    // Note: Il faudrait ajouter une méthode register() au Factory
  });

  it('should process payment', async () => {
    const service = new PaymentService();
    const result = await service.processPayment(100, 'EUR', 'cus_123', 'pm_123');
    expect(result.success).toBe(true);
  });
});
```

## 📝 Interface IPaymentStrategy

Toutes les stratégies doivent implémenter :

- `name`: Nom du provider
- `supportedCurrencies`: Devises supportées
- `supportedCountries`: Pays supportés
- `canProcess(data)`: Vérifier si le provider peut traiter le paiement
- `processPayment(data)`: Traiter un paiement
- `createPaymentIntent(data)`: Créer un Payment Intent
- `confirmPaymentIntent(id, methodId?)`: Confirmer un Payment Intent
- `refund(data)`: Rembourser une transaction
- `getTransactionStatus(id)`: Obtenir le statut d'une transaction

## 🚀 Avantages

1. **Séparation des responsabilités** : Chaque provider a sa propre implémentation
2. **Facilité d'ajout** : Ajouter un nouveau provider ne nécessite que d'ajouter une classe
3. **Testabilité** : Facile de mocker les stratégies pour les tests
4. **Flexibilité** : Changer de provider sans modifier le code client
5. **Maintenabilité** : Code organisé et facile à maintenir

## 📚 Références

- [Strategy Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/strategy)
- [Strategy Pattern - Martin Fowler](https://martinfowler.com/eaaCatalog/strategy.html)

