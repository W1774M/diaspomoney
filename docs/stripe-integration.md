# Intégration Stripe - Documentation

Cette documentation explique comment Stripe est intégré dans DiaspoMoney selon les bonnes pratiques de la [documentation officielle Stripe](https://docs.stripe.com/api/authentication?lang=node).

## Configuration

### Variables d'environnement

Les clés API Stripe doivent être configurées dans les variables d'environnement :

```bash
# Mode test
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Mode production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Webhook secret (pour valider les webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Validation des clés

La configuration valide automatiquement le format des clés API :
- Les clés de test doivent commencer par `sk_test_`
- Les clés de production doivent commencer par `sk_live_`
- Les clés invalides génèrent une erreur explicite

## Utilisation

### Configuration centralisée

Toute l'initialisation Stripe passe par `lib/stripe-config.ts` qui implémente les bonnes pratiques :

```typescript
import { getStripeInstance } from '@/lib/stripe-config';

// Obtient l'instance Stripe globale (singleton)
const stripe = getStripeInstance();

// Créer un Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000, // en centimes
  currency: 'eur',
  automatic_payment_methods: { enabled: true },
});
```

### Gestion des erreurs

La configuration inclut une gestion d'erreurs conforme à la documentation Stripe :

```typescript
import { handleStripeError, StripeErrorType } from '@/lib/stripe-config';

try {
  await stripe.paymentIntents.create({...});
} catch (error) {
  const stripeError = handleStripeError(error);
  
  switch (stripeError.type) {
    case StripeErrorType.CARD_ERROR:
      // Erreur de carte (carte refusée, expiration invalide, etc.)
      console.error('Erreur de carte:', stripeError.message);
      break;
    case StripeErrorType.INVALID_REQUEST_ERROR:
      // Paramètres invalides
      console.error('Requête invalide:', stripeError.message);
      break;
    case StripeErrorType.API_ERROR:
      // Erreur côté Stripe (rare)
      console.error('Erreur API Stripe:', stripeError.message);
      break;
    case StripeErrorType.AUTHENTICATION_ERROR:
      // Clé API invalide
      console.error('Erreur d\'authentification:', stripeError.message);
      break;
    case StripeErrorType.RATE_LIMIT_ERROR:
      // Trop de requêtes
      console.error('Limite de taux atteinte:', stripeError.message);
      break;
  }
}
```

### Types d'erreurs Stripe

Selon la [documentation Stripe](https://docs.stripe.com/api/errors), les erreurs sont classées en plusieurs types :

| Type | Description | Action recommandée |
|------|-------------|-------------------|
| `card_error` | Erreur liée à la carte (refusée, expiration invalide, etc.) | Afficher le message à l'utilisateur |
| `invalid_request_error` | Paramètres de la requête invalides | Vérifier les paramètres envoyés |
| `api_error` | Erreur côté serveur Stripe (rare) | Réessayer plus tard |
| `authentication_error` | Clé API invalide ou manquante | Vérifier la configuration |
| `rate_limit_error` | Trop de requêtes | Implémenter un backoff exponentiel |
| `idempotency_error` | Clé d'idempotence réutilisée incorrectement | Utiliser une nouvelle clé |

### Comptes Connect (Stripe Connect)

Pour les requêtes sur des comptes connectés, utiliser l'option `stripeAccount` :

```typescript
const stripe = getStripeInstance();

// Effectuer une requête pour un compte connecté
const paymentIntent = await stripe.paymentIntents.create(
  {
    amount: 1000,
    currency: 'eur',
  },
  {
    stripeAccount: 'acct_1032D82eZvKYlo2C', // ID du compte connecté
  }
);
```

## Services utilisant Stripe

### PaymentService

Le service principal de paiement (`services/payment/payment.service.ts`) utilise la configuration centralisée :

```typescript
import { getStripeServiceInstance } from '@/services/payment/payment.service';

// Toutes les méthodes utilisent automatiquement la bonne configuration
const paymentIntent = await paymentService.createPaymentIntent(
  amount,
  currency,
  customerId,
  metadata
);
```

### StripePaymentStrategy

L'implémentation du Strategy Pattern utilise également la configuration centralisée :

```typescript
import { StripePaymentStrategy } from '@/strategies/payment/implementations/StripePaymentStrategy';

const strategy = new StripePaymentStrategy();
// La configuration Stripe est automatiquement initialisée
```

## Bonnes pratiques

### 1. Sécurité

- ✅ **Ne jamais** exposer les clés secrètes (`sk_*`) dans le code client
- ✅ Utiliser les clés publiques (`pk_*`) uniquement côté client
- ✅ Valider les webhooks avec `STRIPE_WEBHOOK_SECRET`
- ✅ Utiliser HTTPS pour toutes les requêtes API

### 2. Gestion des erreurs

- ✅ Toujours gérer les erreurs de carte (les plus fréquentes)
- ✅ Implémenter un retry avec backoff exponentiel pour les erreurs API
- ✅ Logger les erreurs avec le contexte approprié
- ✅ Afficher des messages d'erreur clairs aux utilisateurs

### 3. Performance

- ✅ Utiliser l'instance singleton pour éviter les réinitialisations
- ✅ Implémenter un timeout approprié (20s par défaut)
- ✅ Configurer `maxNetworkRetries` pour les retries automatiques

### 4. Monitoring

- ✅ Logger toutes les opérations importantes
- ✅ Envoyer les erreurs à Sentry avec le contexte Stripe
- ✅ Surveiller les métriques de paiement (taux de succès, montants, etc.)

## Références

- [Documentation officielle Stripe - Authentication](https://docs.stripe.com/api/authentication?lang=node)
- [Documentation Stripe - Errors](https://docs.stripe.com/api/errors)
- [Documentation Stripe - Payment Intents](https://docs.stripe.com/api/payment_intents)

