# 📊 Analyse de l'utilisation des types dans le projet

**Date** : 2024-12-19  
**Objectif** : Vérifier si les types centralisés dans `lib/types/` sont utilisés dans tout le projet

---

## 📈 Statistiques globales

- **Types définis** : ~40+ fichiers de types dans `lib/types/`
- **Fichiers utilisant les types** : ~20 fichiers (API routes, services, repositories, facades, hooks)
- **Utilisation de `any`** : ~42 occurrences détectées
- **Interfaces définies inline** : ~15+ interfaces détectées
- **Taux d'utilisation des types** : ~60% (estimation)

---

## ✅ Utilisation correcte des types

### Routes API
- ✅ `app/api/bookings/route.ts` - Utilise `BookingFacadeData`, `BookingData`
- ✅ `app/api/providers/route.ts` - Utilise `PaginationOptions`, `UserStatus`
- ✅ `app/api/users/route.ts` - Utilise `PaginationOptions`
- ✅ `app/api/availabilities/route.ts` - Utilise `PaginationOptions`
- ✅ `app/api/orders/active/route.ts` - Utilise `UserRole`

### Services
- ✅ `services/transaction/transaction.service.ts` - Utilise `TransactionStatus`
- ✅ `services/statistics/statistics.service.ts` - Utilise `TransactionStatus`
- ✅ `services/payment/payment.service.ts` - Utilise `TransactionStatus`
- ✅ `services/user/user.service.ts` - Utilise `Beneficiary`, `User`, `UserFilters`, etc.
- ✅ `services/invoice/invoice.service.ts` - Utilise `InvoiceStatus`, `PaginationOptions`

### Repositories
- ✅ `repositories/implementations/MongoInvoiceRepository.ts` - Utilise `InvoiceStatus`
- ✅ `repositories/implementations/MongoNotificationTemplateRepository.ts` - Utilise `NotificationTemplate`
- ✅ `repositories/interfaces/IUserRepository.ts` - Utilise `User`

### Facades
- ✅ `facades/complaint.facade.ts` - Utilise `CreateComplaintData`
- ✅ `facades/booking.facade.ts` - Utilise `BookingFacadeData`, `BookingFacadeResult`, etc.
- ✅ `facades/payment.facade.ts` - Utilise `PaymentFacadeData`, `PaymentFacadeResult`

### Hooks
- ✅ `hooks/payments/usePayments.ts` - Utilise `UsePaymentsReturn`
- ✅ `hooks/providers/useProviderDetail.ts` - Utilise `ProviderInfo`
- ✅ `hooks/notifications/useNotificationPreferences.ts` - Utilise `PreferencesData`
- ✅ `hooks/services/useServiceStats.ts` - Utilise `IUser`, `ServiceStats`
- ✅ `hooks/beneficiaries/useBeneficiaryStats.ts` - Utilise `Beneficiary`, `BeneficiaryStats`

---

## ❌ Problèmes détectés

### 1. Utilisation excessive de `any`

#### Routes API
- ❌ `app/api/complaints/route.ts` (lignes 68, 71, 74)
  ```typescript
  queryBuilder.byType(type as any);
  queryBuilder.byPriority(priority as any);
  queryBuilder.byStatus(status as any);
  ```
  **Solution** : Importer `ComplaintType`, `ComplaintPriority`, `ComplaintStatus` depuis `@/repositories/interfaces/IComplaintRepository` ou créer ces types dans `lib/types/complaints.types.ts`

- ❌ `app/api/bookings/pending-count/route.ts` (ligne 39)
  ```typescript
  const filters: any = {};
  ```
  **Solution** : Utiliser `BookingFilters` depuis `lib/types/bookings.types.ts`

- ❌ `app/api/orders/active/route.ts` (lignes 65, 68, 74, 82, 83, 143, 144, 166)
  ```typescript
  const bookingDocs = await (Booking as any).find({...});
  bookingIds.map((id: any) => ...)
  .map((b: any) => ...)
  .filter((id: any): id is string => ...)
  .forEach((booking: any) => {...})
  const bookingDoc: any = ...
  ```
  **Solution** : Créer des types appropriés pour les documents MongoDB et les utiliser

- ❌ `app/api/users/route.ts` (ligne 141)
  ```typescript
  company: (body as any).company?.trim() || undefined,
  ```
  **Solution** : Utiliser le type approprié du schéma de validation

#### Services
- ❌ `services/btp/btp.service.ts` (ligne 780)
  ```typescript
  const quoteData: any = {...}
  ```
  **Solution** : Utiliser `Quote` ou `CreateQuoteData` depuis `lib/types/quotes.types.ts`

- ❌ `services/invoice/pdf-generator.service.ts` (lignes 52-55, 72-75)
  ```typescript
  address: (customer as any).address,
  city: (customer as any).city,
  country: (customer as any)['country'] || (customer as any).countryOfResidence,
  ```
  **Solution** : Créer un type `UserAddress` ou utiliser `User` avec des propriétés optionnelles typées

- ❌ `services/payment/payment.service.ts` (lignes 134, 247, 249, 324, 433)
  ```typescript
  status: paymentIntent.status as any,
  const methods = paymentMethods.data.map((pm: any) => ({...}))
  type: pm.type as any,
  type: paymentMethod.type as any,
  refundPayload.reason = reason as any;
  ```
  **Solution** : Créer des types pour les statuts et méthodes de paiement Stripe

#### Repositories
- ❌ `repositories/implementations/MongoInvoiceRepository.ts` (lignes 67, 86, 186, 216, 479)
  ```typescript
  async findAll(filters?: Record<string, any>): Promise<Invoice[]>
  async findOne(filters: Record<string, any>): Promise<Invoice | null>
  async count(filters?: Record<string, any>): Promise<number>
  private mapToInvoice(doc: any): Invoice
  ```
  **Solution** : Utiliser `InvoiceFilters` depuis `lib/types/invoices.types.ts` et créer un type `MongoDocument` pour les documents MongoDB

- ❌ `repositories/implementations/MongoNotificationTemplateRepository.ts` (lignes 58, 79, 200, 274)
  ```typescript
  filters?: Record<string, any>
  filters: Record<string, any>
  private mapToTemplate(doc: any): NotificationTemplate
  ```
  **Solution** : Créer `NotificationTemplateFilters` et utiliser un type pour les documents MongoDB

- ❌ `repositories/implementations/MongoUserRepository.ts` (lignes 70, 89, 113, 163-165)
  ```typescript
  async findAll(filters?: Record<string, any>): Promise<User[]>
  async findOne(filters: Record<string, any>): Promise<User | null>
  const { _id, id, ...dataWithoutIds } = data as any;
  countryOfResidence: (data as any)['country'] ?? (data as any)['countryOfResidence'],
  ```
  **Solution** : Utiliser `UserFilters` depuis `lib/types/user.types.ts` et créer un type `CreateUserData`

### 2. Interfaces définies inline au lieu d'utiliser les types centralisés

#### Services
- ❌ `services/btp/btp.service.ts` (lignes 23-191)
  Définit plusieurs interfaces inline :
  - `Property`
  - `PropertyFeature`
  - `PropertyImage`
  - `PropertyDocument`
  - `Contractor`
  - `Project`
  - `Certification`
  - `Material`
  - `ConstructionProject`
  
  **Solution** : Déplacer ces interfaces dans `lib/types/btp.types.ts` ou `lib/types/services.types.ts`

#### Routes API
- ❌ `app/api/orders/active/route.ts` (ligne 87)
  ```typescript
  interface ProviderInfo {
    // ...
  }
  ```
  **Solution** : Utiliser `ProviderInfo` depuis `lib/types/user.types.ts`

#### Hooks
- ❌ `hooks/providers/useProviderDetail.ts` (lignes 14, 26)
  ```typescript
  export interface ProviderRatingStats {...}
  export interface UseProviderDetailReturn {...}
  ```
  **Solution** : Déplacer dans `lib/types/hooks.types.ts`

- ❌ `hooks/beneficiaries/useBeneficiaries.ts` (lignes 13, 28)
  ```typescript
  interface UseBeneficiariesReturn {...}
  interface CreateBeneficiaryData {...}
  ```
  **Solution** : Déplacer dans `lib/types/hooks.types.ts` et `lib/types/beneficiaries.types.ts`

#### Composants
- ❌ `components/btp/BTPQuoteForm.tsx` (lignes 28, 43)
  ```typescript
  interface BTPQuoteFormProps {...}
  interface QuoteFormData {...}
  ```
  **Solution** : Déplacer dans `lib/types/components.types.ts` ou `lib/types/quotes.types.ts`

### 3. Types manquants dans `lib/types/`

- ⚠️ `ComplaintType`, `ComplaintPriority`, `ComplaintStatus` - Existent dans `repositories/interfaces/IComplaintRepository.ts` mais devraient être dans `lib/types/complaints.types.ts`
- ⚠️ `BookingFilters` - Existe peut-être mais pas utilisé dans `app/api/bookings/pending-count/route.ts`
- ⚠️ `MongoDocument<T>` - Type générique pour les documents MongoDB
- ⚠️ `StripePaymentIntentStatus` - Type pour les statuts Stripe
- ⚠️ `StripePaymentMethodType` - Type pour les types de méthodes de paiement Stripe
- ⚠️ Types BTP (`Property`, `Contractor`, `Project`, etc.) - Devraient être dans `lib/types/btp.types.ts`

---

## 📋 Plan de correction

### Phase 1 : Corriger les utilisations de `any` (Priorité haute)

1. **Routes API**
   - [x] `app/api/complaints/route.ts` - Importer `ComplaintType`, `ComplaintPriority`, `ComplaintStatus`
   - [x] `app/api/bookings/pending-count/route.ts` - Utiliser `BookingFilters`
   - [x] `app/api/orders/active/route.ts` - Créer des types pour les documents MongoDB
   - [x] `app/api/users/route.ts` - Utiliser le type du schéma de validation

2. **Services**
   - [x] `services/btp/btp.service.ts` - Utiliser `Quote` ou créer `CreateQuoteData`
   - [x] `services/invoice/pdf-generator.service.ts` - Créer `UserAddress` ou utiliser `User` typé
   - [x] `services/payment/payment.service.ts` - Créer des types Stripe

3. **Repositories**
   - [x] `repositories/implementations/MongoInvoiceRepository.ts` - Utiliser `InvoiceFilters` et créer `MongoDocument<Invoice>`
   - [x] `repositories/implementations/MongoNotificationTemplateRepository.ts` - Créer `NotificationTemplateFilters`
   - [x] `repositories/implementations/MongoUserRepository.ts` - Utiliser `UserFilters` et créer `CreateUserData`

### Phase 2 : Déplacer les interfaces inline (Priorité moyenne)

4. **Services**
   - [x] `services/btp/btp.service.ts` - Déplacer les interfaces BTP dans `lib/types/btp.types.ts`

5. **Hooks**
   - [x] `hooks/providers/useProviderDetail.ts` - Déplacer dans `lib/types/hooks.types.ts`
   - [x] `hooks/beneficiaries/useBeneficiaries.ts` - Déplacer dans `lib/types/hooks.types.ts` et `lib/types/beneficiaries.types.ts`

6. **Composants**
   - [x] `components/btp/BTPQuoteForm.tsx` - Déplacer dans `lib/types/components.types.ts` ou `lib/types/quotes.types.ts`

### Phase 3 : Créer les types manquants (Priorité basse)

7. **Types manquants**
   - [x] Créer `lib/types/btp.types.ts` avec toutes les interfaces BTP
   - [x] Créer `lib/types/stripe.types.ts` pour les types Stripe
   - [x] Créer `lib/types/mongodb.types.ts` pour `MongoDocument<T>` (déjà existant)
   - [x] Ajouter `ComplaintType`, `ComplaintPriority`, `ComplaintStatus` dans `lib/types/complaints.types.ts` (déjà existants)
   - [x] Créer `lib/types/components.types.ts` pour les props de composants

---

## 🎯 Recommandations

1. **Éviter `any`** : Toujours utiliser des types spécifiques, même pour les filtres génériques
2. **Centraliser les types** : Tous les types doivent être dans `lib/types/`
3. **Réutiliser les types** : Éviter de redéfinir des interfaces qui existent déjà
4. **Types MongoDB** : Créer un type générique `MongoDocument<T>` pour les documents MongoDB
5. **Types Stripe** : Créer un fichier dédié pour les types Stripe
6. **Validation** : Utiliser les types des schémas Zod au lieu de `as any`

---

## 📊 Métriques

- **Taux d'utilisation des types** : ~60% (à améliorer)
- **Utilisations de `any`** : ~42 occurrences (à réduire)
- **Interfaces inline** : ~15+ (à déplacer)
- **Types manquants** : ~10+ types identifiés

---

**Note** : Cette analyse est basée sur une recherche dans le code. Certains fichiers peuvent avoir été modifiés depuis.

