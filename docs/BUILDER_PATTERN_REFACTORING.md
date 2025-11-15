# Refactorisation avec le Builder Pattern

Ce document décrit la refactorisation effectuée pour utiliser le Builder Pattern dans les repositories.

## 📋 Changements Effectués

### Repositories Refactorisés

Tous les repositories ont été refactorisés pour utiliser les QueryBuilders au lieu de construire manuellement les requêtes MongoDB.

#### ✅ MongoUserRepository

**Avant** :
```typescript
async findUsersWithFilters(filters: UserFilters, options?: PaginationOptions) {
  const query: Record<string, any> = {};
  
  if (filters.role) {
    query['roles'] = filters.role;
  }
  if (filters.status) {
    query['status'] = filters.status;
  }
  // ... beaucoup de if/else
  
  return this.findWithPagination(query, options);
}
```

**Après** :
```typescript
async findUsersWithFilters(filters: UserFilters, options?: PaginationOptions) {
  const queryBuilder = this.buildUserQuery(filters, options);
  const query = queryBuilder.build();
  
  return this.findWithPagination(query.filters, query.pagination);
}

private buildUserQuery(filters: UserFilters, options?: PaginationOptions): UserQueryBuilder {
  const builder = new UserQueryBuilder();
  
  if (filters.role) {
    builder.byRole(filters.role);
  }
  if (filters.isActive) {
    builder.active();
  }
  // ... code plus expressif
  
  return builder;
}
```

#### ✅ MongoTransactionRepository

**Avant** : Construction manuelle avec `query['field'] = value`

**Après** : Utilisation de `TransactionQueryBuilder` avec méthodes expressives :
- `byPayer()`, `byBeneficiary()`, `byUser()`
- `completed()`, `failed()`
- `amountBetween()`, `createdBetween()`
- `orderByAmount()`, `orderByCreatedAt()`

#### ✅ MongoBookingRepository

**Avant** : Construction manuelle des filtres

**Après** : Utilisation de `BookingQueryBuilder` avec méthodes :
- `byRequester()`, `byProvider()`
- `upcoming()`, `past()`, `onDate()`
- `betweenDates()`
- `orderByAppointmentDate()`

#### ✅ MongoInvoiceRepository

**Avant** : Construction manuelle des filtres

**Après** : Utilisation de `InvoiceQueryBuilder` avec méthodes :
- `byUser()`, `byTransaction()`, `byBooking()`
- `overdue()`, `paid()`, `pending()`
- `amountBetween()`, `dueBetween()`
- `orderByDueDate()`, `orderByAmount()`

## 🎯 Avantages de la Refactorisation

### 1. **Code Plus Expressif**

**Avant** :
```typescript
if (filters.isActive) {
  query['status'] = 'ACTIVE';
} else {
  query['status'] = { $ne: 'ACTIVE' };
}
```

**Après** :
```typescript
if (filters.isActive) {
  builder.active();
} else {
  builder.inactive();
}
```

### 2. **Réutilisabilité**

Les builders peuvent être utilisés directement dans les services ou routes API :

```typescript
// Dans un service
const query = new UserQueryBuilder()
  .byRole('PROVIDER')
  .active()
  .emailVerified()
  .orderByRating('desc')
  .page(1, 20)
  .build();

const result = await userRepository.findUsersWithFilters(
  query.filters,
  query.pagination
);
```

### 3. **Type-Safety**

Toutes les méthodes sont typées, réduisant les erreurs :

```typescript
// ✅ Type-safe
builder.byStatus('ACTIVE'); // OK
builder.byStatus('INVALID'); // ❌ Erreur TypeScript

// ✅ Méthodes spécialisées
builder.active(); // Plus clair que builder.byStatus('ACTIVE')
```

### 4. **Maintenabilité**

- Code centralisé dans les builders
- Modifications faciles (changer un builder affecte tous les usages)
- Tests plus simples (tester les builders séparément)

## 📝 Utilisation dans les Services

Les services peuvent maintenant utiliser les builders directement :

```typescript
import { UserQueryBuilder } from '@/builders';
import { getUserRepository } from '@/repositories';

// Dans un service
async getActiveProviders() {
  const userRepository = getUserRepository();
  
  const query = new UserQueryBuilder()
    .byRole('PROVIDER')
    .active()
    .emailVerified()
    .orderByRating('desc')
    .limit(10)
    .build();
  
  return await userRepository.findUsersWithFilters(
    query.filters,
    query.pagination
  );
}
```

## 🔄 Migration Progressive

Les repositories acceptent toujours les filtres typés (`UserFilters`, `TransactionFilters`, etc.) pour maintenir la compatibilité. En interne, ils utilisent maintenant les builders.

### Compatibilité Maintenue

```typescript
// ✅ Ancien code fonctionne toujours
const result = await userRepository.findUsersWithFilters({
  role: 'PROVIDER',
  isActive: true,
}, { limit: 10 });

// ✅ Nouveau code avec builder direct
const query = new UserQueryBuilder()
  .byRole('PROVIDER')
  .active()
  .limit(10)
  .build();
  
const result = await userRepository.findUsersWithFilters(
  query.filters,
  query.pagination
);
```

## 🚀 Prochaines Étapes

1. **Mettre à jour les services** pour utiliser les builders directement quand c'est possible
2. **Créer des helpers** dans les services pour les requêtes courantes
3. **Ajouter des tests** pour les builders
4. **Documenter** les patterns d'utilisation dans chaque service

## 📚 Références

- [Builder Pattern Documentation](./builders/README.md)
- [Design Patterns](./DESIGN_PATTERNS.md)
- [Repository Pattern](./repositories/README.md)

