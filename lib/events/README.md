# Observer Pattern - EventBus

Ce dossier contient l'implémentation de l'**Observer Pattern** via un système d'événements (EventBus) pour DiaspoMoney.

## 📋 Structure

```
lib/events/
├── EventBus.ts           # Implémentation principale du bus d'événements
├── EventTypes.ts         # Types d'événements et interfaces
├── EventHelpers.ts       # Helpers pour faciliter l'utilisation
├── index.ts              # Exports principaux
└── README.md             # Documentation
```

## 🎯 Objectifs

1. **Découplage** : Communication entre composants sans dépendances directes
2. **Flexibilité** : Ajouter/supprimer des listeners facilement
3. **Scalabilité** : Gérer de nombreux événements et listeners
4. **Type-safety** : Types TypeScript pour tous les événements

## 📖 Utilisation

### Exemple de base

```typescript
import { eventBus } from '@/lib/events';

// Écouter un événement
const unsubscribe = eventBus.on('user:logged-in', (user) => {
  console.log('User logged in:', user);
});

// Émettre un événement
await eventBus.emit('user:logged-in', {
  userId: '123',
  email: 'user@example.com',
});

// Se désabonner
unsubscribe();
```

### Utilisation avec les helpers typés

```typescript
import { authEvents, paymentEvents } from '@/lib/events';

// Écouter un événement d'authentification
const unsubscribe = authEvents.onUserLoggedIn((data) => {
  console.log('User logged in:', data.userId, data.email);
  // Envoyer une notification, mettre à jour l'UI, etc.
});

// Émettre un événement
await authEvents.emitUserLoggedIn({
  userId: '123',
  email: 'user@example.com',
  timestamp: new Date(),
  ipAddress: '192.168.1.1',
});
```

### Exemple dans un service

```typescript
// services/auth/auth.service.ts
import { authEvents } from '@/lib/events';

export class AuthService {
  async login(email: string, password: string) {
    // ... logique de connexion
    
    // Émettre l'événement après connexion réussie
    await authEvents.emitUserLoggedIn({
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
      ipAddress: request.ip,
    });
  }
}
```

### Exemple dans un composant React

```typescript
// components/NotificationCenter.tsx
'use client';

import { useEffect, useState } from 'react';
import { paymentEvents, PaymentSucceededEvent } from '@/lib/events';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Écouter les événements de paiement
    const unsubscribe = paymentEvents.onPaymentSucceeded((data: PaymentSucceededEvent) => {
      setNotifications(prev => [...prev, {
        type: 'success',
        message: `Paiement de ${data.amount}${data.currency} réussi`,
        timestamp: data.timestamp,
      }]);
    });

    // Nettoyer à la destruction du composant
    return unsubscribe;
  }, []);

  return (
    <div>
      {notifications.map(notif => (
        <div key={notif.timestamp}>{notif.message}</div>
      ))}
    </div>
  );
}
```

### Écouter une seule fois

```typescript
import { eventBus } from '@/lib/events';

// Le listener sera automatiquement supprimé après le premier appel
eventBus.once('user:registered', (data) => {
  console.log('First registration:', data);
});
```

### Priorité des listeners

```typescript
import { eventBus } from '@/lib/events';

// Listener avec priorité élevée (appelé en premier)
eventBus.on('payment:succeeded', (data) => {
  console.log('High priority handler');
}, 10);

// Listener avec priorité normale
eventBus.on('payment:succeeded', (data) => {
  console.log('Normal priority handler');
}, 0);
```

### Événements asynchrones

```typescript
import { eventBus } from '@/lib/events';

// Les listeners peuvent être asynchrones
eventBus.on('payment:succeeded', async (data) => {
  await sendEmail(data.userId);
  await updateAnalytics(data);
  await logTransaction(data);
});

// eventBus.emit() attend que tous les listeners se terminent
await eventBus.emit('payment:succeeded', paymentData);
```

## 🔧 Cas d'usage

### 1. Notifications en temps réel

```typescript
// Émettre depuis un service
import { paymentEvents } from '@/lib/events';

await paymentEvents.emitPaymentSucceeded({
  transactionId: 'tx_123',
  amount: 100,
  currency: 'EUR',
  userId: 'user_123',
  provider: 'STRIPE',
  timestamp: new Date(),
});

// Écouter dans un composant React
paymentEvents.onPaymentSucceeded((data) => {
  showNotification(`Paiement de ${data.amount}${data.currency} réussi`);
});
```

### 2. Synchronisation entre composants

```typescript
// Composant A
import { eventBus } from '@/lib/events';

eventBus.emit('cart:updated', { itemCount: 5 });

// Composant B (écoute)
eventBus.on('cart:updated', (data) => {
  updateCartBadge(data.itemCount);
});
```

### 3. Logging d'événements

```typescript
import { systemEvents } from '@/lib/events';

// Écouter toutes les erreurs
systemEvents.onError((data) => {
  console.error('Error occurred:', data.error);
  // Envoyer à Sentry, logger, etc.
});

// Émettre une erreur
systemEvents.emitError(new Error('Something went wrong'), {
  userId: '123',
  action: 'payment',
});
```

### 4. Analytics

```typescript
import { authEvents } from '@/lib/events';

authEvents.onUserLoggedIn((data) => {
  // Envoyer à Google Analytics, Mixpanel, etc.
  analytics.track('user_logged_in', {
    userId: data.userId,
    email: data.email,
    timestamp: data.timestamp,
  });
});
```

## 📝 Types d'événements disponibles

### AuthEvents
- `USER_LOGGED_IN`
- `USER_LOGGED_OUT`
- `USER_REGISTERED`
- `USER_EMAIL_VERIFIED`
- `PASSWORD_RESET_REQUESTED`
- `PASSWORD_RESET_COMPLETED`
- `SESSION_EXPIRED`
- `ACCOUNT_SUSPENDED`

### PaymentEvents
- `PAYMENT_CREATED`
- `PAYMENT_PENDING`
- `PAYMENT_SUCCEEDED`
- `PAYMENT_FAILED`
- `PAYMENT_REFUNDED`
- `PAYMENT_CANCELLED`

### BookingEvents
- `BOOKING_CREATED`
- `BOOKING_CONFIRMED`
- `BOOKING_CANCELLED`
- `BOOKING_FINISHED`
- `BOOKING_REMINDER`

### Et plus...

Voir `EventTypes.ts` pour la liste complète.

## 🧪 Tests

### Mock de l'EventBus pour les tests

```typescript
// tests/mocks/MockEventBus.ts
import { EventBus } from '@/lib/events';

export class MockEventBus extends EventBus {
  private emittedEvents: Array<{ event: string; data: any }> = [];

  async emit(event: string, data?: any): Promise<void> {
    this.emittedEvents.push({ event, data });
    return super.emit(event, data);
  }

  getEmittedEvents(): Array<{ event: string; data: any }> {
    return this.emittedEvents;
  }

  clearEmittedEvents(): void {
    this.emittedEvents = [];
  }
}
```

## 🚀 Avantages

1. **Découplage** : Les composants ne dépendent pas directement les uns des autres
2. **Flexibilité** : Facile d'ajouter/supprimer des listeners
3. **Scalabilité** : Gère de nombreux événements et listeners
4. **Type-safety** : Types TypeScript pour tous les événements
5. **Priorité** : Contrôle de l'ordre d'exécution des listeners
6. **Asynchrone** : Support des listeners asynchrones

## 📚 Références

- [Observer Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/observer)
- [Observer Pattern - Martin Fowler](https://martinfowler.com/eaaCatalog/observer.html)

