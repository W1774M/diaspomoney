# Repository Pattern - DiaspoMoney

Ce dossier contient l'implémentation formelle du **Repository Pattern** pour le projet DiaspoMoney.

## 📋 Structure

```
repositories/
├── interfaces/          # Interfaces des repositories
│   ├── IRepository.ts           # Interface de base
│   ├── IUserRepository.ts       # Interface utilisateur
│   ├── ITransactionRepository.ts # Interface transaction
│   ├── IBookingRepository.ts    # Interface réservation
│   └── IInvoiceRepository.ts    # Interface facture
├── implementations/    # Implémentations MongoDB
│   └── MongoUserRepository.ts   # Implémentation utilisateur
├── container/          # Container de dépendances
│   └── RepositoryContainer.ts   # DI Container
├── index.ts            # Exports principaux
└── README.md           # Documentation
```

## 🎯 Objectifs

1. **Abstraction de l'accès aux données** : Séparer la logique métier de l'accès aux données
2. **Testabilité** : Faciliter les tests avec des mocks
3. **Flexibilité** : Permettre le changement de source de données sans modifier les services
4. **Maintenabilité** : Code plus propre et organisé

## 📖 Utilisation

### Exemple de base

```typescript
import { getUserRepository } from '@/repositories';

// Dans un service
const userRepository = getUserRepository();

// Trouver un utilisateur par ID
const user = await userRepository.findById(userId);

// Trouver par email
const user = await userRepository.findByEmail(email);

// Créer un utilisateur
const newUser = await userRepository.create({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
});

// Mettre à jour
await userRepository.update(userId, {
  firstName: 'Jane',
});

// Supprimer
await userRepository.delete(userId);
```

### Avec pagination

```typescript
import { getUserRepository } from '@/repositories';

const userRepository = getUserRepository();

const result = await userRepository.findWithPagination(
  { status: 'ACTIVE' },
  {
    page: 1,
    limit: 20,
    sort: { createdAt: -1 },
  }
);

console.log(result.data);      // Tableau d'utilisateurs
console.log(result.total);     // Nombre total
console.log(result.hasMore);   // Y a-t-il plus de résultats ?
```

### Avec filtres avancés

```typescript
import { getUserRepository } from '@/repositories';

const userRepository = getUserRepository();

const result = await userRepository.findUsersWithFilters(
  {
    role: 'PROVIDER',
    status: 'ACTIVE',
    country: 'France',
    specialty: 'HEALTH',
  },
  {
    page: 1,
    limit: 10,
  }
);
```

## 🔧 Refactoring d'un Service

### Avant (accès direct à MongoDB)

```typescript
// services/user/user.service.ts (ANCIEN)
export class UserService {
  async getUserById(id: string) {
    const client = await mongoClient;
    const db = client.db();
    const users = db.collection('users');
    const user = await users.findOne({ _id: new ObjectId(id) });
    return user;
  }
}
```

### Après (avec Repository)

```typescript
// services/user/user.service.ts (NOUVEAU)
import { getUserRepository } from '@/repositories';

export class UserService {
  private userRepository = getUserRepository();

  async getUserById(id: string) {
    return this.userRepository.findById(id);
  }
}
```

## 🧪 Tests

### Mock d'un repository pour les tests

```typescript
// tests/mocks/MockUserRepository.ts
import { IUserRepository, User } from '@/repositories';

export class MockUserRepository implements IUserRepository {
  private users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async create(data: Partial<User>): Promise<User> {
    const user = { id: '1', ...data } as User;
    this.users.push(user);
    return user;
  }

  // ... autres méthodes
}
```

### Utilisation dans les tests

```typescript
// tests/services/user.service.test.ts
import { repositoryContainer } from '@/repositories';
import { MockUserRepository } from '../mocks/MockUserRepository';

describe('UserService', () => {
  beforeEach(() => {
    // Remplacer le repository par un mock
    repositoryContainer.register('user', new MockUserRepository());
  });

  it('should get user by id', async () => {
    const service = new UserService();
    const user = await service.getUserById('1');
    expect(user).toBeDefined();
  });
});
```

## 📝 Interfaces disponibles

### IRepository<T, TId>
Interface de base avec opérations CRUD standard :
- `findById(id)`
- `findAll(filters?)`
- `findOne(filters)`
- `create(data)`
- `update(id, data)`
- `delete(id)`
- `count(filters?)`
- `exists(id)`

### IPaginatedRepository<T, TId>
Étend `IRepository` avec :
- `findWithPagination(filters?, options?)`

### IUserRepository
Méthodes spécifiques :
- `findByEmail(email)`
- `findByRole(role)`
- `findByStatus(status)`
- `updatePassword(userId, hashedPassword)`
- `verifyEmail(userId)`
- `updateKYCStatus(userId, status)`
- `findUsersWithFilters(filters, options?)`

## 🚀 Prochaines étapes

1. ✅ Créer les interfaces de base
2. ✅ Implémenter MongoUserRepository
3. ⏳ Implémenter MongoTransactionRepository
4. ⏳ Implémenter MongoBookingRepository
5. ⏳ Implémenter MongoInvoiceRepository
6. ⏳ Refactoriser tous les services pour utiliser les repositories

## 📚 Références

- [Repository Pattern - Martin Fowler](https://martinfowler.com/eaaCatalog/repository.html)
- [Design Patterns - Repository](https://refactoring.guru/design-patterns/repository)

