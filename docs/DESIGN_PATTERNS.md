# Design Patterns dans DiaspoMoney

Ce document décrit les design patterns utilisés et recommandés pour le projet DiaspoMoney.

## 📋 Table des matières

1. [Patterns Actuellement Utilisés](#patterns-actuellement-utilisés)
2. [Patterns Recommandés](#patterns-recommandés)
3. [Exemples d'Implémentation](#exemples-dimplémentation)
4. [Bonnes Pratiques](#bonnes-pratiques)

---

## 🎯 Patterns Actuellement Utilisés

### 1. **Redux-like Pattern (avec Zustand)**

**Localisation**: `store/`, `store/simple-store.ts`

**Description**: Pattern de gestion d'état global inspiré de Redux, implémenté avec Zustand.

**Caractéristiques**:
- **Actions**: Objets typés avec `type` et `payload`
- **Reducers**: Fonctions pures qui transforment l'état
- **Dispatch**: Fonction centrale pour déclencher les actions
- **Slices**: Division de l'état en domaines (auth, notifications, theme, etc.)

**Exemple**:
```typescript
// Action
export const authActions = {
  loginStart: () => ({ type: AUTH_ACTIONS.LOGIN_START }),
  loginSuccess: (user: any) => ({ 
    type: AUTH_ACTIONS.LOGIN_SUCCESS, 
    payload: user 
  }),
};

// Usage
dispatch(authActions.loginStart());
```

**Avantages**:
- ✅ État prévisible et traçable
- ✅ Séparation claire des responsabilités
- ✅ Facilite le debugging
- ✅ Testabilité élevée

---

### 2. **Service Layer Pattern**

**Localisation**: `services/` (user, payment, transaction, etc.)

**Description**: Couche d'abstraction entre les composants UI et la logique métier/données.

**Caractéristiques**:
- Services encapsulent la logique métier
- Séparation entre présentation et logique
- Réutilisabilité accrue
- Facilite les tests unitaires

**Exemple**:
```typescript
// services/user/user.service.ts
export class UserService {
  async getUserById(id: string): Promise<User> {
    // Logique métier
  }
  
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    // Validation, transformation, persistance
  }
}
```

**Avantages**:
- ✅ Réutilisabilité
- ✅ Testabilité
- ✅ Maintenabilité
- ✅ Séparation des responsabilités

---

### 3. **Custom Hooks Pattern**

**Localisation**: `hooks/` (auth, api, forms, etc.)

**Description**: Encapsulation de la logique réutilisable dans des hooks React personnalisés.

**Caractéristiques**:
- Logique métier réutilisable
- Gestion d'état locale
- Effets de bord encapsulés
- Interface simple pour les composants

**Exemple**:
```typescript
// hooks/auth/useLogin.ts
export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { addError } = useNotificationManager();
  
  const login = async (data: LoginData) => {
    // Logique de connexion
  };
  
  return { login, isLoading };
};
```

**Avantages**:
- ✅ Réutilisabilité
- ✅ Séparation logique/UI
- ✅ Testabilité
- ✅ Composition facile

---

### 4. **Repository Pattern** ✅ **FORMALISÉ**

**Localisation**: `repositories/` (interfaces, implementations, container)

**Description**: Abstraction formelle de l'accès aux données avec interfaces explicites.

**Caractéristiques**:
- ✅ Interfaces explicites pour chaque entité (`IUserRepository`, `ITransactionRepository`, etc.)
- ✅ Implémentations MongoDB séparées (`MongoUserRepository`, etc.)
- ✅ Container de dépendances pour l'injection
- ✅ Support de la pagination intégré
- ✅ Méthodes spécifiques par entité

**Structure**:
```
repositories/
├── interfaces/          # Interfaces des repositories
│   ├── IRepository.ts           # Interface de base CRUD
│   ├── IUserRepository.ts        # Interface utilisateur
│   ├── ITransactionRepository.ts # Interface transaction
│   ├── IBookingRepository.ts     # Interface réservation
│   └── IInvoiceRepository.ts     # Interface facture
├── implementations/     # Implémentations MongoDB
│   └── MongoUserRepository.ts    # Implémentation utilisateur
└── container/          # Container de dépendances
    └── RepositoryContainer.ts    # DI Container
```

**Exemple**:
```typescript
// Utilisation du repository
import { getUserRepository } from '@/repositories';

const userRepository = getUserRepository();

// Opérations CRUD standard
const user = await userRepository.findById(userId);
const users = await userRepository.findAll({ status: 'ACTIVE' });
const newUser = await userRepository.create(userData);
await userRepository.update(userId, updateData);
await userRepository.delete(userId);

// Méthodes spécifiques
const user = await userRepository.findByEmail(email);
const users = await userRepository.findByRole('PROVIDER');
await userRepository.verifyEmail(userId);

// Pagination
const result = await userRepository.findWithPagination(
  { status: 'ACTIVE' },
  { page: 1, limit: 20 }
);
```

**Avantages**:
- ✅ Testabilité (mocks faciles)
- ✅ Flexibilité (changement de BDD)
- ✅ Séparation claire des responsabilités
- ✅ Code réutilisable et maintenable

---

### 5. **Middleware Pattern**

**Localisation**: `middleware.ts`, `lib/auth/middleware.ts`

**Description**: Intercepteurs pour les requêtes HTTP et l'authentification.

**Caractéristiques**:
- Traitement avant/après les requêtes
- Authentification centralisée
- Validation des routes protégées

**Exemple**:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Vérification HTTPS
  // Vérification de session
  // Redirection si nécessaire
}
```

**Avantages**:
- ✅ Sécurité centralisée
- ✅ Logging centralisé
- ✅ Réduction de la duplication

---

### 6. **Factory Pattern** (Implicite)

**Localisation**: `components/`, `hooks/`

**Description**: Création d'objets/composants via des fonctions factory.

**Exemple**:
```typescript
// Action creators sont des factories
export const authActions = {
  loginStart: () => ({ type: AUTH_ACTIONS.LOGIN_START }),
};
```


### 7. **Strategy Pattern** ✅ **IMPLÉMENTÉ**

**Status**: ✅ **Implémenté pour les paiements** - Voir `strategies/payment/`

**Localisation**: `strategies/payment/` (interfaces, implementations, factory)

**Description**: Pattern pour gérer différents providers de paiement (Stripe, PayPal, etc.) de manière interchangeable.

**Structure**:
```
strategies/payment/
├── interfaces/
│   └── IPaymentStrategy.ts          # Interface principale
├── implementations/
│   ├── StripePaymentStrategy.ts     # Implémentation Stripe
│   └── PayPalPaymentStrategy.ts     # Implémentation PayPal
├── PaymentStrategyFactory.ts        # Factory pour créer les stratégies
└── index.ts                         # Exports
```

**Exemple**:
```typescript
// Utilisation directe
import { PaymentStrategyFactory } from '@/strategies/payment';

const stripeStrategy = PaymentStrategyFactory.getStrategy('STRIPE');
const result = await stripeStrategy.processPayment({
  amount: 100,
  currency: 'EUR',
  customerId: 'cus_123',
  paymentMethodId: 'pm_123',
});

// Utilisation via PaymentService (sélection automatique)
import { paymentService } from '@/services/payment/payment.service.strategy';

const paymentIntent = await paymentService.createPaymentIntent(
  100,
  'EUR',
  'cus_123'
  // Le service sélectionne automatiquement la meilleure stratégie
);

// Forcer un provider spécifique
const paymentIntent = await paymentService.createPaymentIntent(
  100,
  'EUR',
  'cus_123',
  {},
  'PAYPAL' // Forcer PayPal
);
```

**Avantages**:
- ✅ Flexibilité : Ajouter de nouveaux providers facilement
- ✅ Testabilité : Mocks faciles pour les tests
- ✅ Séparation des responsabilités : Chaque provider isolé
- ✅ Sélection automatique : Choix du meilleur provider selon devise/pays

**Documentation complète**: Voir `strategies/payment/README.md`

**Cas d'usage**:
- ✅ Méthodes de paiement multiples (Stripe, PayPal)
- 🔄 Algorithmes de validation différents (à implémenter)
- 🔄 Stratégies de cache (à implémenter)
- 🔄 Stratégies de notification (à implémenter)

---

### 8. **Observer Pattern** ✅ **IMPLÉMENTÉ**

**Status**: ✅ **Implémenté avec EventBus** - Voir `lib/events/`

**Localisation**: `lib/events/` (EventBus, EventTypes, EventHelpers)

**Description**: Système d'événements pour découpler les composants via un bus d'événements global.

**Structure**:
```
lib/events/
├── EventBus.ts           # Implémentation principale
├── EventTypes.ts         # Types d'événements et interfaces
├── EventHelpers.ts       # Helpers typés pour faciliter l'utilisation
└── index.ts              # Exports
```

**Exemple**:
```typescript
// Utilisation de base
import { eventBus } from '@/lib/events';

const unsubscribe = eventBus.on('user:logged-in', (user) => {
  console.log('User logged in:', user);
});

await eventBus.emit('user:logged-in', {
  userId: '123',
  email: 'user@example.com',
  timestamp: new Date(),
});

// Utilisation avec helpers typés
import { authEvents, paymentEvents } from '@/lib/events';

// Écouter un événement d'authentification
authEvents.onUserLoggedIn((data) => {
  console.log('User logged in:', data.userId);
});

// Émettre un événement de paiement
await paymentEvents.emitPaymentSucceeded({
  transactionId: 'tx_123',
  amount: 100,
  currency: 'EUR',
  userId: 'user_123',
  provider: 'STRIPE',
  timestamp: new Date(),
});
```

**Fonctionnalités**:
- ✅ Support asynchrone (listeners peuvent retourner des Promises)
- ✅ Priorité des listeners (ordre d'exécution contrôlable)
- ✅ Listeners "once" (automatiquement supprimés après le premier appel)
- ✅ Type-safety complet avec TypeScript
- ✅ Helpers typés pour chaque catégorie d'événements
- ✅ Gestion d'erreurs (les erreurs dans un listener n'arrêtent pas les autres)

**Avantages**:
- ✅ Découplage : Communication sans dépendances directes
- ✅ Flexibilité : Ajouter/supprimer des listeners facilement
- ✅ Scalabilité : Gère de nombreux événements et listeners
- ✅ Type-safety : Types TypeScript pour tous les événements

**Documentation complète**: Voir `lib/events/README.md`

**Cas d'usage**:
- ✅ Notifications en temps réel
- ✅ Synchronisation entre composants
- ✅ Logging d'événements
- ✅ Analytics


### 9. **Builder Pattern** ✅ **IMPLÉMENTÉ**

**Status**: ✅ **Implémenté pour les requêtes MongoDB** - Voir `builders/`

**Localisation**: `builders/` (QueryBuilder, builders spécialisés)

**Description**: Pattern pour construire des requêtes MongoDB de manière fluide et lisible.

**Structure**:
```
builders/
├── QueryBuilder.ts              # Builder de base générique
├── UserQueryBuilder.ts          # Builder spécialisé utilisateurs
├── TransactionQueryBuilder.ts   # Builder spécialisé transactions
├── BookingQueryBuilder.ts       # Builder spécialisé réservations
├── InvoiceQueryBuilder.ts       # Builder spécialisé factures
└── index.ts                     # Exports
```

**Exemple**:
```typescript
// Builder de base
import { QueryBuilder } from '@/builders';

const query = new QueryBuilder()
  .where('status', 'ACTIVE')
  .whereGreaterThan('rating', 4.0)
  .whereIn('country', ['France', 'Senegal'])
  .orderBy('rating', 'desc')
  .limit(10)
  .build();

// Builder spécialisé
import { UserQueryBuilder } from '@/builders';

const query = new UserQueryBuilder()
  .byRole('PROVIDER')
  .active()
  .emailVerified()
  .byCountry('France')
  .orderByRating('desc')
  .page(1, 20)
  .build();

// Utilisation avec repository
const result = await userRepository.findUsersWithFilters(
  query.filters,
  query.pagination
);


## 🚀 Patterns Recommandés


```

**Fonctionnalités**:
- ✅ Builder de base avec opérateurs MongoDB complets
- ✅ Builders spécialisés par entité (User, Transaction, Booking, Invoice)
- ✅ Méthodes expressives et typées
- ✅ Support de la pagination intégré
- ✅ Support des opérateurs avancés ($or, $and, $in, $gt, etc.)

**Avantages**:
- ✅ Code expressif et lisible
- ✅ Type-safety complet
- ✅ Réutilisabilité élevée
- ✅ Flexibilité pour requêtes complexes

**Documentation complète**: Voir `builders/README.md`

**Cas d'usage**:
- ✅ Construction de requêtes complexes MongoDB
- 🔄 Configuration d'objets (à implémenter)
- 🔄 Construction de formulaires dynamiques (à implémenter)

---


pattern non implementés

### 10. **Adapter Pattern**

**Objectif**: Adapter des interfaces incompatibles.

**Implémentation**:
```typescript
// adapters/payment-adapter.ts
export interface PaymentProvider {
  charge(amount: number): Promise<ChargeResult>;
}

// Adapter pour Stripe
export class StripeAdapter implements PaymentProvider {
  constructor(private stripe: Stripe) {}
  
  async charge(amount: number): Promise<ChargeResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: 'eur',
    });
    
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      // Transformation des données
    };
  }
}

// Adapter pour PayPal
export class PayPalAdapter implements PaymentProvider {
  constructor(private paypal: PayPal) {}
  
  async charge(amount: number): Promise<ChargeResult> {
    // Adaptation de l'API PayPal
  }
}
```

**Cas d'usage**:
- Intégration de services externes
- Migration entre APIs
- Normalisation de données

---

### 6. **Decorator Pattern**

**Objectif**: Ajouter des fonctionnalités dynamiquement.

**Implémentation**:
```typescript
// decorators/cache.decorator.ts
export function Cacheable(ttl: number = 300) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = new Map();
    
    descriptor.value = async function (...args: any[]) {
      const key = `${propertyKey}_${JSON.stringify(args)}`;
      const cached = cache.get(key);
      
      if (cached && Date.now() - cached.timestamp < ttl * 1000) {
        return cached.data;
      }
      
      const result = await originalMethod.apply(this, args);
      cache.set(key, { data: result, timestamp: Date.now() });
      return result;
    };
    
    return descriptor;
  };
}

// Usage
class UserService {
  @Cacheable(600) // Cache 10 minutes
  async getUserById(id: string) {
    // Logique
  }
}
```

**Cas d'usage**:
- Caching
- Logging
- Validation
- Retry logic

---

### 7. **Facade Pattern**

**Objectif**: Interface simplifiée pour un sous-système complexe.

**Implémentation**:
```typescript
// facades/payment.facade.ts
export class PaymentFacade {
  constructor(
    private paymentService: PaymentService,
    private transactionService: TransactionService,
    private notificationService: NotificationService
  ) {}
  
  async processPayment(data: PaymentData): Promise<PaymentResult> {
    // Orchestration complexe
    const payment = await this.paymentService.process(data);
    const transaction = await this.transactionService.create({
      paymentId: payment.id,
      amount: data.amount,
    });
    await this.notificationService.sendPaymentConfirmation(transaction);
    
    return {
      payment,
      transaction,
    };
  }
}
```

**Avantages**:
- ✅ Interface simple
- ✅ Masque la complexité
- ✅ Facilite les tests

---

### 8. **Command Pattern**

**Objectif**: Encapsuler les requêtes comme objets.

**Implémentation**:
```typescript
// commands/payment.commands.ts
export interface Command {
  execute(): Promise<any>;
  undo?(): Promise<any>;
}

export class CreatePaymentCommand implements Command {
  constructor(
    private paymentService: PaymentService,
    private data: PaymentData
  ) {}
  
  async execute(): Promise<PaymentResult> {
    return this.paymentService.create(this.data);
  }
  
  async undo(): Promise<void> {
    // Logique d'annulation
  }
}

// Command handler
export class CommandHandler {
  private history: Command[] = [];
  
  async execute(command: Command) {
    const result = await command.execute();
    this.history.push(command);
    return result;
  }
  
  async undo() {
    const command = this.history.pop();
    if (command?.undo) {
      await command.undo();
    }
  }
}
```

**Cas d'usage**:
- Historique d'actions
- Undo/Redo
- Transactions
- Queue de commandes

---

### 9. **Dependency Injection (DI)**

**Objectif**: Inversion de contrôle pour les dépendances.

**Implémentation**:
```typescript
// containers/service-container.ts
export class ServiceContainer {
  private services = new Map();
  
  register<T>(key: string, factory: () => T) {
    this.services.set(key, factory);
  }
  
  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`Service ${key} not found`);
    }
    return factory();
  }
}

// Usage
const container = new ServiceContainer();
container.register('userRepository', () => new MongoUserRepository());
container.register('userService', () => 
  new UserService(container.resolve('userRepository'))
);
```

**Avantages**:
- ✅ Découplage
- ✅ Testabilité
- ✅ Flexibilité

---

### 10. **Template Method Pattern**

**Objectif**: Définir le squelette d'un algorithme.

**Implémentation**:
```typescript
// templates/payment-processor.template.ts
export abstract class PaymentProcessor {
  // Template method
  async process(data: PaymentData): Promise<PaymentResult> {
    this.validate(data);
    const payment = await this.createPayment(data);
    await this.sendNotification(payment);
    return payment;
  }
  
  protected abstract createPayment(data: PaymentData): Promise<PaymentResult>;
  
  protected validate(data: PaymentData): void {
    // Validation commune
  }
  
  protected async sendNotification(payment: PaymentResult): Promise<void> {
    // Notification commune
  }
}

// Implémentation
export class StripePaymentProcessor extends PaymentProcessor {
  protected async createPayment(data: PaymentData) {
    // Implémentation spécifique Stripe
  }
}
```

---

## 📝 Exemples d'Implémentation

### Exemple Complet: Service avec Repository et Strategy

```typescript
// 1. Repository Interface
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

// 2. Repository Implementation
export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    // Implémentation MongoDB
  }
}

// 3. Strategy Interface
export interface ValidationStrategy {
  validate(data: any): ValidationResult;
}

// 4. Service avec DI
export class UserService {
  constructor(
    private repository: IUserRepository,
    private validator: ValidationStrategy
  ) {}
  
  async createUser(data: CreateUserData): Promise<User> {
    const validation = this.validator.validate(data);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }
    
    return this.repository.create(data);
  }
}
```

---

## ✅ Bonnes Pratiques

### 1. **Séparation des Responsabilités**
- ✅ Chaque pattern a un rôle clair
- ✅ Pas de mélange de patterns dans une même classe
- ✅ Interfaces bien définies

### 2. **Testabilité**
- ✅ Utiliser des interfaces pour les dépendances
- ✅ Faciliter le mocking
- ✅ Tests unitaires pour chaque pattern

### 3. **Documentation**
- ✅ Documenter les patterns utilisés
- ✅ Exemples d'utilisation
- ✅ Cas d'usage clairs

### 4. **Performance**
- ✅ Éviter les patterns lourds pour des cas simples
- ✅ Utiliser le caching quand approprié
- ✅ Optimiser les requêtes

---

## 🎯 Recommandations par Domaine

### **Authentification**
- ✅ Strategy Pattern pour différents providers (OAuth, Credentials)
- ✅ Observer Pattern pour les événements d'auth
- ✅ Middleware Pattern pour la protection des routes

### **Paiements**
- ✅ Strategy Pattern pour différents providers (Stripe, PayPal)
- ✅ Command Pattern pour les transactions
- ✅ Facade Pattern pour orchestrer les paiements

### **Notifications**
- ✅ Observer Pattern pour les événements
- ✅ Strategy Pattern pour différents canaux (Email, SMS, Push)
- ✅ Factory Pattern pour créer les notifications

### **Gestion des Données**
- ✅ Repository Pattern pour l'accès aux données
- ✅ Builder Pattern pour les requêtes complexes
- ✅ Adapter Pattern pour différentes sources de données

---

## 📚 Ressources

- [Design Patterns: Elements of Reusable Object-Oriented Software](https://en.wikipedia.org/wiki/Design_Patterns)
- [Refactoring Guru - Design Patterns](https://refactoring.guru/design-patterns)
- [TypeScript Design Patterns](https://www.typescriptlang.org/docs/handbook/decorators.html)

---

**Dernière mise à jour**: 2024

