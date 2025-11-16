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
    payload: user,
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

const unsubscribe = eventBus.on('user:logged-in', user => {
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
authEvents.onUserLoggedIn(data => {
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

## 🎯 Patterns Implémentés (Suite)

### 10. **Decorator Pattern** ✅ **IMPLÉMENTÉ**

**Status**: ✅ **Implémenté** - Voir `lib/decorators/`

**Localisation**: `lib/decorators/` (cache, log, retry, validate)

**Description**: Pattern pour ajouter des fonctionnalités dynamiquement aux méthodes via des decorators TypeScript.

**Structure**:

```
lib/decorators/
├── cache.decorator.ts      # @Cacheable - Cache automatique
├── log.decorator.ts        # @Log - Logging automatique
├── retry.decorator.ts      # @Retry - Retry automatique
├── validate.decorator.ts   # @Validate - Validation automatique
└── index.ts               # Exports
```

**Exemple**:

```typescript
// Utilisation des decorators
import { Cacheable, Log, Retry, Validate } from '@/lib/decorators';
import { z } from 'zod';

class UserService {
  @Log({ level: 'info', logArgs: true })
  @Cacheable(600) // Cache 10 minutes
  @Validate({
    rules: [{ paramIndex: 0, schema: z.string().min(1), paramName: 'userId' }],
  })
  async getUserById(userId: string) {
    // Logique
  }

  @Retry({ maxAttempts: 3, delay: 1000 })
  async createUser(data: CreateUserData) {
    // Logique avec retry automatique
  }
}
```

**Fonctionnalités**:

- ✅ `@Cacheable` : Cache automatique avec Redis ou mémoire
- ✅ `@Log` : Logging structuré avec pino et Sentry
- ✅ `@Retry` : Retry automatique avec backoff exponentiel
- ✅ `@Validate` : Validation automatique avec Zod

**Avantages**:

- ✅ Réduction de la duplication de code
- ✅ Séparation des préoccupations
- ✅ Réutilisabilité élevée
- ✅ Type-safety complet

**Cas d'usage**:

- ✅ Caching automatique
- ✅ Logging structuré
- ✅ Validation des paramètres
- ✅ Retry logic pour les appels API

---

### 11. **Facade Pattern** ✅ **IMPLÉMENTÉ**

**Status**: ✅ **Implémenté** - Voir `facades/`

**Localisation**: `facades/` (payment, booking)

**Description**: Interface simplifiée pour orchestrer des sous-systèmes complexes.

**Structure**:

```
facades/
├── payment.facade.ts    # Facade pour le processus de paiement
├── booking.facade.ts    # Facade pour le processus de réservation
└── index.ts             # Exports
```

**Exemple**:

```typescript
// Utilisation de la facade
import { paymentFacade } from '@/facades';

const result = await paymentFacade.processPayment({
  amount: 100,
  currency: 'EUR',
  customerId: 'cus_123',
  paymentMethodId: 'pm_123',
  payerId: 'user_123',
  beneficiaryId: 'provider_456',
  serviceType: 'HEALTH',
  serviceId: 'service_789',
  description: 'Consultation médicale',
  createInvoice: true,
  sendNotification: true,
});

// La facade orchestre automatiquement :
// - PaymentService (création du paiement)
// - TransactionService (enregistrement de la transaction)
// - InvoiceService (création de la facture)
// - NotificationService (envoi de notification)
```

**Avantages**:

- ✅ Interface simple et intuitive
- ✅ Masque la complexité de l'orchestration
- ✅ Facilite les tests (mock de la facade)
- ✅ Réduction de la duplication

**Cas d'usage**:

- ✅ Processus de paiement complet
- ✅ Processus de réservation complet
- ✅ Orchestration de plusieurs services

---

### 12. **Command Pattern** ✅ **IMPLÉMENTÉ**

**Status**: ✅ **Implémenté** - Voir `commands/`

**Localisation**: `commands/` (base, payment, transaction, booking)

**Description**: Encapsule les requêtes comme objets pour permettre l'historique, undo/redo et les transactions.

**Structure**:

```
commands/
├── base.command.ts              # Interface et base abstraite
├── payment.commands.ts          # Commandes de paiement
├── transaction.commands.ts      # Commandes de transaction
├── booking.commands.ts          # Commandes de réservation
├── index.ts                     # Exports
└── app/api/commands/undo/       # API pour undo
```

**Exemple**:

```typescript
// Utilisation des commandes
import { CreatePaymentCommand, CommandHandler } from '@/commands';

const commandHandler = new CommandHandler();

// Exécuter une commande
const createPaymentCmd = new CreatePaymentCommand({
  amount: 100,
  currency: 'EUR',
  // ... autres données
});

const result = await commandHandler.execute(createPaymentCmd);

// Undo (si supporté)
if (result.success && createPaymentCmd.canUndo()) {
  await commandHandler.undo();
}
```

**Fonctionnalités**:

- ✅ Historique des commandes
- ✅ Undo/Redo support
- ✅ Logging automatique
- ✅ Gestion d'erreurs centralisée

**Avantages**:

- ✅ Historique d'actions
- ✅ Undo/Redo possible
- ✅ Transactions atomiques
- ✅ Queue de commandes

**Cas d'usage**:

- ✅ Historique d'actions utilisateur
- ✅ Undo/Redo dans l'interface
- ✅ Transactions atomiques
- ✅ Queue de commandes asynchrones

---

### 13. **Dependency Injection (DI)** ✅ **IMPLÉMENTÉ**

**Status**: ✅ **Implémenté** - Voir `containers/` et `lib/di/`

**Localisation**: `containers/` (service-container, service-registry), `lib/di/` (initialize)

**Description**: Inversion de contrôle pour gérer les dépendances et faciliter les tests.

**Structure**:

```
containers/
├── service-container.ts      # Conteneur principal
├── service-registry.ts       # Registre de services
└── index.ts                  # Exports

lib/di/
└── initialize.ts             # Initialisation du système DI
```

**Exemple**:

```typescript
// Enregistrement de services
import { serviceContainer } from '@/containers';
import { MongoUserRepository } from '@/repositories';
import { UserService } from '@/services';

// Enregistrer un repository
serviceContainer.register(
  'userRepository',
  () => new MongoUserRepository(),
  true // singleton
);

// Enregistrer un service avec dépendances
serviceContainer.register(
  'userService',
  () => new UserService(serviceContainer.resolve('userRepository')),
  true
);

// Utilisation
const userService = serviceContainer.resolve<UserService>('userService');
```

**Fonctionnalités**:

- ✅ Support des singletons
- ✅ Détection des dépendances circulaires
- ✅ Injection automatique
- ✅ Service registry centralisé

**Avantages**:

- ✅ Découplage des dépendances
- ✅ Testabilité élevée (mocks faciles)
- ✅ Flexibilité (changement d'implémentation)
- ✅ Gestion centralisée des services

**Cas d'usage**:

- ✅ Injection de repositories dans les services
- ✅ Injection de services dans les facades
- ✅ Tests unitaires avec mocks
- ✅ Configuration centralisée

---

### 14. **Template Method Pattern** ✅ **IMPLÉMENTÉ**

**Status**: ✅ **Implémenté** - Voir `templates/`

**Localisation**: `templates/` (payment-processor)

**Description**: Définit le squelette d'un algorithme avec des étapes communes et des étapes spécifiques.

**Structure**:

```
templates/
├── payment-processor.template.ts    # Classe abstraite de base
├── stripe-payment-processor.ts      # Implémentation Stripe
└── paypal-payment-processor.ts      # Implémentation PayPal
```

**Exemple**:

```typescript
// Utilisation du template method
import { PaymentProcessor } from '@/templates';
import { StripePaymentProcessor } from '@/templates/stripe-payment-processor';

const processor = new StripePaymentProcessor();

// Le template method définit le flux :
// 1. Validation (commune)
// 2. beforePayment (hook)
// 3. createPayment (spécifique)
// 4. confirmPayment (spécifique)
// 5. afterPayment (hook)
// 6. recordMetrics (commune)
// 7. sendNotification (commune, peut être surchargée)

const result = await processor.process({
  amount: 100,
  currency: 'EUR',
  // ... autres données
});
```

**Fonctionnalités**:

- ✅ Méthode template définissant le flux
- ✅ Méthodes abstraites pour les étapes spécifiques
- ✅ Hooks pour personnalisation (beforePayment, afterPayment)
- ✅ Méthodes communes réutilisables

**Avantages**:

- ✅ Réduction de la duplication
- ✅ Structure claire et prévisible
- ✅ Flexibilité pour personnaliser certaines étapes
- ✅ Maintenabilité élevée

**Cas d'usage**:

- ✅ Processus de paiement avec étapes communes
- ✅ Workflows avec structure fixe
- ✅ Algorithmes avec variantes

---

## 🚫 Patterns Non Implémentés

### 15. **Adapter Pattern**

**Objectif**: Adapter des interfaces incompatibles.

**Status**: ❌ **Non implémenté**

**Cas d'usage potentiels**:

- Intégration de services externes
- Migration entre APIs
- Normalisation de données

**Note**: Le Strategy Pattern peut parfois servir de substitut pour certains cas d'usage de l'Adapter Pattern.

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
- ✅ Dependency Injection pour l'injection de repositories

---

## 📚 Ressources

- [Design Patterns: Elements of Reusable Object-Oriented Software](https://en.wikipedia.org/wiki/Design_Patterns)
- [Refactoring Guru - Design Patterns](https://refactoring.guru/design-patterns)
- [TypeScript Design Patterns](https://www.typescriptlang.org/docs/handbook/decorators.html)

---

**Dernière mise à jour**: 2024
