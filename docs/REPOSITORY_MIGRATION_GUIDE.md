# Guide de Migration vers le Repository Pattern

Ce guide explique comment migrer progressivement le code existant vers les nouveaux services utilisant le Repository Pattern.

## 📋 Vue d'ensemble

Les services suivants ont été refactorisés :
- ✅ **UserService** - Exemple disponible (à migrer)
- ✅ **TransactionService** - Version refactorée disponible
- ✅ **BookingService** - Version refactorée disponible
- ✅ **InvoiceService** - Nouveau service créé

## 🔄 Processus de Migration

### Étape 1 : Identifier les usages

Rechercher tous les imports du service ancien :

```bash
# Pour TransactionService
grep -r "from.*transaction.service" --include="*.ts" --include="*.tsx"

# Pour BookingService
grep -r "from.*bookingService" --include="*.ts" --include="*.tsx"
```

### Étape 2 : Migrer progressivement

#### Exemple : Migration de TransactionService

**AVANT** :
```typescript
import { TransactionService } from '@/services/transaction/transaction.service';

const transactionService = TransactionService.getInstance();
const transaction = await transactionService.createTransaction(data);
```

**APRÈS** :
```typescript
import { transactionService } from '@/services/transaction/transaction.service.refactored';

const transaction = await transactionService.createTransaction(data);
```

### Étape 3 : Tester chaque migration

1. Remplacer l'import
2. Vérifier que les types correspondent
3. Tester la fonctionnalité
4. Vérifier les logs pour s'assurer que le repository est utilisé

## 📝 Services Disponibles

### TransactionService (Refactoré)

**Fichier** : `services/transaction/transaction.service.refactored.ts`

**Méthodes disponibles** :
- `createTransaction(data)` - Crée et persiste une transaction
- `getTransaction(id, userId)` - Récupère une transaction
- `getTransactions(userId, filters)` - Liste les transactions avec filtres
- `updateTransactionStatus(id, status, metadata)` - Met à jour le statut
- `refundTransaction(id, reason)` - Rembourse une transaction
- `getTransactionStats(userId, filters)` - Statistiques

**Exemple d'utilisation** :
```typescript
import { transactionService } from '@/services/transaction/transaction.service.refactored';

// Créer une transaction
const transaction = await transactionService.createTransaction({
  payerId: 'user_123',
  beneficiaryId: 'user_456',
  amount: 100,
  currency: 'EUR',
  serviceType: 'HEALTH',
  serviceId: 'service_123',
  description: 'Consultation médicale',
});

// Récupérer les transactions d'un utilisateur
const transactions = await transactionService.getTransactions('user_123', {
  status: 'COMPLETED',
  dateFrom: new Date('2024-01-01'),
});
```

### BookingService (Refactoré)

**Fichier** : `services/booking/booking.service.refactored.ts`

**Méthodes disponibles** :
- `getBookings(filters)` - Liste les réservations avec pagination
- `getBookingById(id)` - Récupère une réservation
- `createBooking(data)` - Crée une réservation
- `updateBooking(id, data)` - Met à jour une réservation
- `updateBookingStatus(id, status)` - Met à jour le statut
- `deleteBooking(id)` - Supprime une réservation
- `getUserBookings(userId, options)` - Réservations d'un utilisateur
- `getProviderBookings(providerId, options)` - Réservations d'un provider
- `getUpcomingBookings(options)` - Réservations à venir

**Exemple d'utilisation** :
```typescript
import { bookingService } from '@/services/booking/booking.service.refactored';

// Créer une réservation
const booking = await bookingService.createBooking({
  requesterId: 'user_123',
  providerId: 'provider_456',
  serviceId: 'service_789',
  serviceType: 'HEALTH',
  appointmentDate: new Date('2024-12-25'),
  timeslot: '10:00-11:00',
  consultationMode: 'video',
});

// Récupérer les réservations d'un utilisateur
const result = await bookingService.getUserBookings('user_123', {
  limit: 20,
  offset: 0,
});
```

### InvoiceService (Nouveau)

**Fichier** : `services/invoice/invoice.service.ts`

**Méthodes disponibles** :
- `createInvoice(data)` - Crée une facture avec numéro auto-généré
- `getInvoiceById(id)` - Récupère une facture
- `getUserInvoices(userId, options)` - Factures d'un utilisateur
- `getInvoices(filters, options)` - Liste avec filtres
- `updateInvoice(id, data)` - Met à jour une facture
- `updateInvoiceStatus(id, status)` - Met à jour le statut
- `markInvoiceAsPaid(id, paidAt)` - Marque comme payée
- `getOverdueInvoices(options)` - Factures en retard
- `deleteInvoice(id)` - Supprime une facture

**Exemple d'utilisation** :
```typescript
import { invoiceService } from '@/services/invoice/invoice.service';

// Créer une facture
const invoice = await invoiceService.createInvoice({
  userId: 'user_123',
  transactionId: 'txn_456',
  amount: 100,
  currency: 'EUR',
  tax: 20,
  items: [
    {
      description: 'Consultation médicale',
      quantity: 1,
      unitPrice: 100,
      total: 100,
    },
  ],
  dueDate: new Date('2024-12-31'),
});

// Récupérer les factures en retard
const overdue = await invoiceService.getOverdueInvoices({
  limit: 50,
});
```

## 🔧 Migration des Routes API

### Exemple : Migration d'une route API

**AVANT** (`app/api/transactions/route.ts`) :
```typescript
import { TransactionService } from '@/services/transaction/transaction.service';

export async function GET(request: NextRequest) {
  const transactionService = TransactionService.getInstance();
  const transactions = await transactionService.getTransactions(userId, {});
  return NextResponse.json(transactions);
}
```

**APRÈS** :
```typescript
import { transactionService } from '@/services/transaction/transaction.service.refactored';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const transactions = await transactionService.getTransactions(userId, {});
  return NextResponse.json(transactions);
}
```

## ✅ Checklist de Migration

Pour chaque service à migrer :

- [ ] Identifier tous les imports du service ancien
- [ ] Créer une branche de migration
- [ ] Remplacer les imports par la version refactorée
- [ ] Vérifier que les types correspondent
- [ ] Tester chaque fonctionnalité migrée
- [ ] Vérifier les logs pour confirmer l'utilisation du repository
- [ ] Mettre à jour les tests unitaires
- [ ] Documenter les changements
- [ ] Supprimer l'ancien service une fois la migration complète

## 🚨 Points d'attention

1. **Types** : Les types peuvent avoir légèrement changé, vérifier la compatibilité
2. **Pagination** : Les nouvelles méthodes retournent `PaginatedResult<T>` au lieu de tableaux simples
3. **Filtres** : Les filtres sont maintenant typés avec des interfaces spécifiques
4. **Erreurs** : Les messages d'erreur peuvent avoir changé

## 📚 Références

- [Repository Pattern Documentation](./repositories/README.md)
- [Design Patterns](./DESIGN_PATTERNS.md)

