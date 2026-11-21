# Builder Pattern - QueryBuilder

Ce dossier contient l'implémentation du **Builder Pattern** pour construire des requêtes MongoDB de manière fluide et lisible.

## 📋 Structure

```
builders/
├── QueryBuilder.ts              # Builder de base générique
├── UserQueryBuilder.ts          # Builder spécialisé pour les utilisateurs
├── TransactionQueryBuilder.ts  # Builder spécialisé pour les transactions
├── BookingQueryBuilder.ts       # Builder spécialisé pour les réservations
├── InvoiceQueryBuilder.ts       # Builder spécialisé pour les factures
├── index.ts                     # Exports
└── README.md                    # Documentation
```

## 🎯 Objectifs

1. **Lisibilité** : Code plus lisible et expressif
2. **Réutilisabilité** : Construire des requêtes complexes facilement
3. **Type-safety** : Méthodes typées pour éviter les erreurs
4. **Flexibilité** : Combinaison facile de plusieurs filtres

## 📖 Utilisation

### QueryBuilder de base

```typescript
import { QueryBuilder } from '@/builders';

const query = new QueryBuilder()
  .where('status', 'ACTIVE')
  .where('role', 'PROVIDER')
  .whereGreaterThan('rating', 4.0)
  .whereIn('country', ['France', 'Senegal'])
  .orderBy('rating', 'desc')
  .limit(10)
  .build();

// Utiliser dans un repository
const users = await userRepository.findAll(query.filters);
```

### UserQueryBuilder (spécialisé)

```typescript
import { UserQueryBuilder } from '@/builders';

const query = new UserQueryBuilder()
  .byRole('PROVIDER')
  .active()
  .emailVerified()
  .byCountry('France')
  .bySpecialty('HEALTH')
  .orderByRating('desc')
  .limit(20)
  .build();

const users = await userRepository.findUsersWithFilters(query.filters, query.pagination);
```

### TransactionQueryBuilder

```typescript
import { TransactionQueryBuilder } from '@/builders';

const query = new TransactionQueryBuilder()
  .byUser('user_123')
  .completed()
  .byCurrency('EUR')
  .amountBetween(50, 500)
  .createdBetween(new Date('2024-01-01'), new Date('2024-12-31'))
  .orderByAmount('desc')
  .page(1, 20)
  .build();

const transactions = await transactionRepository.findTransactionsWithFilters(
  query.filters,
  query.pagination
);
```

### BookingQueryBuilder

```typescript
import { BookingQueryBuilder } from '@/builders';

// Réservations à venir d'un provider
const query = new BookingQueryBuilder()
  .byProvider('provider_123')
  .upcoming()
  .byServiceType('HEALTH')
  .orderByAppointmentDate('asc')
  .limit(10)
  .build();

const bookings = await bookingRepository.findBookingsWithFilters(
  query.filters,
  query.pagination
);
```

### InvoiceQueryBuilder

```typescript
import { InvoiceQueryBuilder } from '@/builders';

// Factures en retard d'un utilisateur
const query = new InvoiceQueryBuilder()
  .byUser('user_123')
  .overdue()
  .orderByDueDate('asc')
  .build();

const invoices = await invoiceRepository.findInvoicesWithFilters(
  query.filters,
  query.pagination
);
```

## 🔧 Méthodes du QueryBuilder de base

### Filtres

- `where(field, value)` - Égalité
- `whereOperator(field, operator, value)` - Opérateur MongoDB ($gt, $lt, etc.)
- `whereIn(field, values)` - $in
- `whereNotIn(field, values)` - $nin
- `whereGreaterThan(field, value)` - $gt
- `whereGreaterThanOrEqual(field, value)` - $gte
- `whereLessThan(field, value)` - $lt
- `whereLessThanOrEqual(field, value)` - $lte
- `whereNotEqual(field, value)` - $ne
- `whereRegex(field, pattern, options?)` - $regex
- `whereExists(field, exists?)` - $exists
- `whereOr(conditions)` - $or
- `whereAnd(conditions)` - $and

### Tri

- `orderBy(field, direction)` - Trier par un champ
- `orderByMultiple(sorts)` - Trier par plusieurs champs

### Pagination

- `limit(count)` - Limiter le nombre de résultats
- `offset(count)` - Définir l'offset
- `page(pageNumber, pageSize)` - Définir la page (calcule l'offset)

### Utilitaires

- `build()` - Construire la requête finale
- `getFilters()` - Obtenir uniquement les filtres
- `getSort()` - Obtenir uniquement le tri
- `getPagination()` - Obtenir uniquement la pagination
- `reset()` - Réinitialiser le builder
- `clone()` - Cloner le builder

## 💡 Exemples Avancés

### Requête complexe avec $or

```typescript
const query = new UserQueryBuilder()
  .whereOr([
    { status: 'ACTIVE', roles: 'PROVIDER' },
    { status: 'ACTIVE', roles: 'ADMIN' },
  ])
  .emailVerified()
  .orderBy('createdAt', 'desc')
  .limit(50)
  .build();
```

### Requête avec plage de dates

```typescript
const query = new TransactionQueryBuilder()
  .byPayer('user_123')
  .createdBetween(new Date('2024-01-01'), new Date('2024-12-31'))
  .amountBetween(100, 1000)
  .byCurrency('EUR')
  .orderByAmount('desc')
  .page(1, 20)
  .build();
```

### Requête avec plusieurs conditions

```typescript
const query = new BookingQueryBuilder()
  .byProvider('provider_123')
  .upcoming()
  .whereOr([
    { status: 'PENDING' },
    { status: 'CONFIRMED' },
  ])
  .orderByAppointmentDate('asc')
  .limit(10)
  .build();
```

## 🔄 Intégration avec les Repositories

Les builders peuvent être utilisés directement avec les repositories :

```typescript
import { UserQueryBuilder } from '@/builders';
import { getUserRepository } from '@/repositories';

const userRepository = getUserRepository();
const query = new UserQueryBuilder()
  .active()
  .byRole('PROVIDER')
  .orderByRating('desc')
  .limit(10)
  .build();

const result = await userRepository.findUsersWithFilters(
  query.filters,
  query.pagination
);
```

## 🚀 Avantages

1. **Code expressif** : `byRole('PROVIDER').active().emailVerified()` est plus lisible
2. **Type-safety** : Méthodes typées pour éviter les erreurs
3. **Réutilisabilité** : Construire des requêtes complexes facilement
4. **Maintenabilité** : Code organisé et facile à comprendre
5. **Flexibilité** : Combinaison facile de plusieurs filtres

## 📚 Références

- [Builder Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/builder)
- [Builder Pattern - Martin Fowler](https://martinfowler.com/dslCatalog/builder.html)

