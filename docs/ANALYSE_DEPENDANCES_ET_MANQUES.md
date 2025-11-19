# Analyse Complète des Dépendances et Manques par Groupe

## 📋 Vue d'Ensemble

Cette analyse identifie les dépendances entre les différents groupes architecturaux (facades, builders, hooks, repositories, decorators, logs, services, constants, mappers, types, schemas) et liste ce qui manque dans chaque groupe pour une architecture complète et cohérente.

### 📅 Dernière mise à jour : 2025-01-10

---

## 1. 🏛️ FACADES

### ✅ Ce qui existe
- `booking.facade.ts` - Orchestre BookingService, PaymentFacade, NotificationService
- `payment.facade.ts` - Orchestre PaymentService, TransactionService, InvoiceService, NotificationService
- `invoice.facade.ts` - Orchestre InvoiceService, EmailService, NotificationService
- `complaint.facade.ts` - Orchestre ComplaintService, NotificationService, EmailService
- `beneficiary.facade.ts` - Orchestre UserService, BeneficiaryRepository, NotificationService

### 🔍 Dépendances utilisées
- ✅ Decorators: `@Log`, `@Validate`, `@Retry`
- ✅ Logger: `logger` de `@/lib/logger`
- ✅ Services: Tous les services nécessaires
- ✅ Schemas: Schémas Zod pour validation
- ✅ Sentry: Pour error tracking

### ❌ Ce qui MANQUE

#### 1.1 Facades manquantes
- **TransactionFacade** - Pour orchestrer TransactionService, PaymentService, NotificationService
- **UserFacade** - Pour orchestrer UserService, KYCService, NotificationService
- **NotificationFacade** - Pour orchestrer NotificationService, EmailService, MessagingService
- **MessagingFacade** - Pour orchestrer MessagingService, NotificationService
- **StatisticsFacade** - Pour orchestrer StatisticsService avec cache et validation
- **SpecialityFacade** - Pour orchestrer SpecialityService avec validation
- **EducationFacade** - Pour orchestrer EducationService
- **BTPFacade** - Pour orchestrer BTPService

#### 1.2 Fonctionnalités manquantes dans les facades existantes
- **Mappers** : Aucune facade n'utilise de mappers pour transformer les données
  - `booking.facade.ts` devrait utiliser `BookingMapper` pour transformer Booking → BookingResponse
  - `payment.facade.ts` devrait utiliser `PaymentMapper` pour transformer PaymentIntent → PaymentResponse
  - `invoice.facade.ts` devrait utiliser `InvoiceMapper` pour transformer Invoice → InvoiceResponse
  - `complaint.facade.ts` devrait utiliser `ComplaintMapper` pour transformer Complaint → ComplaintResponse
  - `beneficiary.facade.ts` devrait utiliser `BeneficiaryMapper` pour transformer Beneficiary → BeneficiaryResponse

- **Constants** : ✅ **AMÉLIORÉ** - Les facades utilisent maintenant `LANGUAGES.FR.code`, `BOOKING_STATUSES`, `CURRENCIES.EUR.code`
  - ✅ `booking.facade.ts` utilise `LANGUAGES.FR.code` et `BOOKING_STATUSES.PENDING`
  - ✅ `payment.facade.ts` utilise `LANGUAGES.FR.code`
  - ✅ `invoice.facade.ts` utilise `LANGUAGES.FR.code` et `CURRENCIES.EUR.code`
  - ✅ `complaint.facade.ts` utilise `LANGUAGES.FR.code`
  - ✅ `beneficiary.facade.ts` utilise `LANGUAGES.FR.code`

- **Builders** : Aucune facade n'utilise de builders pour construire des requêtes
  - Pourraient utiliser des builders pour construire des filtres complexes

- **Types centralisés** : ✅ **AMÉLIORÉ** - Les types de facades sont maintenant centralisés
  - ✅ `lib/types/facades.types.ts` contient `BookingFacadeData`, `PaymentFacadeData`, `InvoiceFacadeData`, `ComplaintFacadeData`, `BeneficiaryFacadeData`
  - ✅ Tous les types de facades sont exportés depuis `lib/types/index.ts`

---

## 2. 🏗️ BUILDERS

### ✅ Ce qui existe
- `QueryBuilder.ts` - Builder de base générique
- `BookingQueryBuilder.ts` - Builder spécialisé pour les réservations
- `UserQueryBuilder.ts` - Builder spécialisé pour les utilisateurs
- `TransactionQueryBuilder.ts` - Builder spécialisé pour les transactions
- `InvoiceQueryBuilder.ts` - Builder spécialisé pour les factures
- `ComplaintQueryBuilder.ts` - Builder spécialisé pour les réclamations
- `BeneficiaryQueryBuilder.ts` - Builder spécialisé pour les bénéficiaires

### 🔍 Dépendances utilisées
- ✅ Base QueryBuilder pour héritage

### ❌ Ce qui MANQUE

#### 2.1 Builders manquants
- **NotificationQueryBuilder** - Pour construire des requêtes de notifications
- **MessageQueryBuilder** - Pour construire des requêtes de messages
- **SpecialityQueryBuilder** - Pour construire des requêtes de spécialités
- **ProviderQueryBuilder** - Pour construire des requêtes de providers (différent de UserQueryBuilder)
- **StatisticsQueryBuilder** - Pour construire des requêtes statistiques complexes

#### 2.2 Fonctionnalités manquantes dans les builders existants
- **Constants** : Les builders utilisent des valeurs hardcodées
  - Devraient utiliser `PAGINATION`, `SERVICE_TYPES`, etc. de `@/lib/constants`

- **Validation** : Aucun builder ne valide les paramètres d'entrée
  - Devraient utiliser des schémas Zod pour valider les filtres

- **Logging** : Aucun builder n'a de logging
  - Devraient logger les requêtes construites pour debugging

- **Types** : Certains builders utilisent des types `any`
  - Devraient utiliser des types stricts depuis `lib/types/` ou `lib/types/builders.types.ts`

---

## 3. 🎣 HOOKS

### ✅ Ce qui existe
- Hooks API: `useBookings`, `useProvider`, `useProviders`, `useProvidersOptimized`
- Hooks Auth: `useAuth`, `useLogin`, `useSignOut`, `useForgotPassword`, `useOAuthProfileCheck`, `useOAuthStatus`
- Hooks Beneficiaries: `useBeneficiaries`, `useBeneficiaryFilters`, `useBeneficiaryStats`
- Hooks Bookings: `useBookingCancel`, `useBookingFilters`, `useBookingPayment`, `useBookingStats`
- Hooks Complaints: `useComplaints`, `useComplaintFilters`, `useComplaintStats`
- Hooks Invoices: `useInvoice`, `useInvoices`, `useInvoiceCreate`, `useInvoiceEdit`, `useInvoiceFilters`, `useInvoiceStats`, `useInvoiceUsers`, `useInvoiceActions`
- Hooks Payments: `usePayments`, `usePaymentMethodCreate`, `useBillingAddressCreate`, `usePaymentReceipts`
- Hooks Users: `useUser`, `useCreateUser`, `useUserEdit`, `useUserFilters`
- Et beaucoup d'autres...

### 🔍 Dépendances utilisées
- ✅ React hooks de base
- ✅ Fetch API pour les appels API
- ✅ Types depuis `@/lib/types` (via `lib/types/index.ts`)

### ❌ Ce qui MANQUE

#### 3.1 Hooks manquants
- **useTransaction** - Pour gérer les transactions
- **useTransactionFilters** - Pour filtrer les transactions
- **useTransactionStats** - Pour les statistiques de transactions
- **useSpeciality** - Pour gérer les spécialités
- **useSpecialityFilters** - Pour filtrer les spécialités
- **useStatistics** - Pour les statistiques générales (existe mais peut être amélioré)
- **useEducation** - Pour les services d'éducation
- **useBTP** - Pour les services BTP
- **useQuote** - Pour les devis (existe partiellement)
- **useQuoteFilters** - Pour filtrer les devis

#### 3.2 Fonctionnalités manquantes dans les hooks existants
- **Facades** : La plupart des hooks appellent directement les API routes au lieu d'utiliser les facades
  - Devraient utiliser les facades pour une meilleure abstraction
  - Exemple: `useBookings` devrait utiliser `bookingFacade` via une route API dédiée

- **Mappers** : Aucun hook n'utilise de mappers pour transformer les données
  - Devraient mapper les réponses API vers les types frontend

- **Constants** : Utilisation limitée des constantes
  - Devraient utiliser `PAGINATION`, `DEFAULT_LOCALE`, etc.

- **Error Handling** : Gestion d'erreurs incohérente
  - Devraient utiliser un hook centralisé `useErrorHandler`

- **Loading States** : Gestion des états de chargement incohérente
  - Devraient utiliser un hook centralisé `useLoadingState`

- **Cache** : Pas de gestion de cache côté client
  - Devraient utiliser React Query ou SWR pour le cache

- **Validation** : Pas de validation côté client
  - Devraient utiliser les schémas Zod pour valider les données avant envoi

---

## 4. 📦 REPOSITORIES

### ✅ Ce qui existe
- Interfaces: `IRepository`, `IUserRepository`, `IBookingRepository`, `ITransactionRepository`, `IInvoiceRepository`, `IComplaintRepository`, `IBeneficiaryRepository`, `INotificationRepository`, `IMessagingRepository`, `ISpecialityRepository`, `IQuoteRepository`, et beaucoup d'autres
- Implémentations MongoDB: Tous les repositories ont des implémentations MongoDB
- Container: `RepositoryContainer` pour l'injection de dépendances

### 🔍 Dépendances utilisées
- ✅ Decorators: `@Log`, `@Cacheable`, `@InvalidateCache`
- ✅ Logger: `childLogger` de `@/lib/logger`
- ✅ Builders: `BookingQueryBuilder`, `UserQueryBuilder`, etc.
- ✅ Sentry: Pour error tracking
- ✅ MongoDB client

### ❌ Ce qui MANQUE

#### 4.1 Repositories manquants
- **IStatisticsRepository** - Pour les statistiques
- **IEducationRepository** - Pour les services d'éducation
- **IBTPRepository** - Pour les services BTP
- **IAuditLogRepository** - Existe mais peut être amélioré
- **IGDPRConsentRepository** - Existe mais peut être amélioré

#### 4.2 Fonctionnalités manquantes dans les repositories existants
- **Mappers** : Les repositories font du mapping inline dans les méthodes `mapTo*`
  - Devraient utiliser des mappers centralisés depuis `@/lib/mappers`
  - Exemple: `MongoBookingRepository.mapToBooking` devrait utiliser `BookingMapper`

- **Constants** : Utilisation limitée des constantes
  - Devraient utiliser `PAGINATION`, `CACHE_TTL`, etc.

- **Validation** : Aucun repository ne valide les données d'entrée
  - Devraient valider les données avec des schémas Zod avant insertion/mise à jour

- **Builders** : Utilisation limitée des builders
  - Tous les repositories devraient utiliser les builders pour construire des requêtes complexes

- **Types** : Certains repositories utilisent `any` ou des types inline
  - Devraient utiliser des types stricts depuis `lib/types/` et `repositories/interfaces/`

---

## 5. 🎨 DECORATORS

### ✅ Ce qui existe
- `@Log` - Pour le logging automatique
- `@Cacheable` - Pour le cache automatique
- `@InvalidateCache` - Pour invalider le cache
- `@Retry` - Pour les tentatives automatiques
- `@Validate` - Pour la validation automatique avec Zod

### 🔍 Dépendances utilisées
- ✅ Logger: `logger` de `@/lib/logger`
- ✅ Sentry: Pour error tracking
- ✅ Zod: Pour la validation

### ❌ Ce qui MANQUE

#### 5.1 Decorators manquants
- **@RateLimit** - Pour limiter le taux d'appels
- **@Authorize** - Pour l'autorisation automatique
- **@Audit** - Pour l'audit automatique des actions
- **@Deprecated** - Pour marquer les méthodes comme dépréciées
- **@Performance** - Pour mesurer les performances
- **@Transaction** - Pour gérer les transactions de base de données
- **@CircuitBreaker** - Pour le circuit breaker pattern

#### 5.2 Fonctionnalités manquantes dans les decorators existants
- **Constants** : Les decorators utilisent des valeurs hardcodées
  - Devraient utiliser des constantes depuis `@/lib/constants`
  - Exemple: `@Cacheable` devrait utiliser `CACHE_TTL` par défaut

- **Types** : Certains decorators utilisent `any`
  - Devraient avoir des types stricts

- **Documentation** : Documentation limitée
  - Devraient avoir des exemples d'utilisation

---

## 6. 📝 LOGS CENTRALISÉS

### ✅ Ce qui existe
- `lib/logger.ts` - Logger centralisé avec Pino
- `childLogger` - Pour créer des loggers enfants avec contexte
- `lib/decorators/log.decorator.ts` - Decorator pour logging automatique
- `lib/security/audit-logging.ts` - Pour l'audit logging

### 🔍 Dépendances utilisées
- ✅ Pino pour le logging structuré
- ✅ Sentry pour l'error tracking

### ❌ Ce qui MANQUE

#### 6.1 Fonctionnalités manquantes
- **Constants** : Pas de constantes pour les niveaux de log
  - Devrait avoir `LOG_LEVELS` dans `@/lib/constants`

- **Formatters** : Pas de formatters personnalisés
  - Devrait avoir des formatters pour différents environnements (dev, prod)

- **Transports** : Transport limité
  - Devrait avoir des transports pour différents services (CloudWatch, Datadog, etc.)

- **Context** : Gestion de contexte limitée
  - Devrait avoir une meilleure gestion du contexte (request ID, user ID, etc.)

- **Structured Logging** : Utilisation incohérente
  - Tous les logs devraient être structurés avec des métadonnées

---

## 7. 🔧 SERVICES

### ✅ Ce qui existe
- `auth.service.ts` - Service d'authentification
- `booking.service.ts` - Service de réservation
- `payment.service.ts` - Service de paiement
- `transaction.service.ts` - Service de transaction
- `invoice.service.ts` - Service de facturation
- `complaint.service.ts` - Service de réclamation
- `user.service.ts` - Service utilisateur
- `notification.service.ts` - Service de notification
- `messaging.service.ts` - Service de messagerie
- `email.service.ts` - Service d'email
- `statistics.service.ts` - Service de statistiques
- `speciality.service.ts` - Service de spécialités
- `education.service.ts` - Service d'éducation
- `btp.service.ts` - Service BTP
- `health.service.ts` - Service de santé
- `pdf-generator.service.ts` - Service de génération PDF

### 🔍 Dépendances utilisées
- ✅ Decorators: `@Log`, `@Cacheable`, `@InvalidateCache`, `@Retry`, `@Validate`
- ✅ Logger: `logger` ou `childLogger` de `@/lib/logger`
- ✅ Repositories: Tous les repositories nécessaires
- ✅ Sentry: Pour error tracking
- ✅ Constants: Utilisation limitée (seulement `BTP_CONSTANTS`)

### ❌ Ce qui MANQUE

#### 7.1 Services manquants
- **AuditService** - Pour l'audit centralisé
- **CacheService** - Pour la gestion centralisée du cache
- **ConfigService** - Pour la gestion centralisée de la configuration
- **HealthService** - Existe mais peut être amélioré

#### 7.2 Fonctionnalités manquantes dans les services existants
- **Mappers** : Aucun service n'utilise de mappers
  - Tous les services devraient utiliser des mappers pour transformer les données
  - Exemple: `UserService` devrait utiliser `UserMapper` au lieu de mapper inline

- **Constants** : Utilisation très limitée des constantes
  - La plupart des services utilisent des valeurs hardcodées
  - Devraient utiliser `PAGINATION`, `DEFAULT_LOCALE`, `SERVICE_TYPES`, etc.

- **Schemas** : Utilisation incohérente des schémas Zod
  - Certains services valident avec Zod, d'autres non
  - Tous les services devraient valider les entrées avec des schémas Zod

- **Types** : Certains services utilisent `any` ou des types inline
  - Devraient utiliser des types stricts depuis `lib/types/`

- **Builders** : Utilisation limitée des builders
  - Les services qui font des requêtes complexes devraient utiliser des builders

---

## 8. 📊 CONSTANTS

### ✅ Ce qui existe
- `lib/constants/index.ts` avec:
  - `DEFAULT_CURRENCY`, `DEFAULT_SERVICE_ID`, `DEFAULT_LOCALE`
  - `SERVICE_TYPES`, `COMPLAINT_TYPES`, `COMPLAINT_PRIORITIES`
  - `INVOICE_STATUSES`, `COMPLAINT_STATUSES`
  - `PAGINATION`, `CACHE_TTL`
  - `BTP_CONSTANTS`, `NOTIFICATION_CONSTANTS`, `PROVIDER_CONSTANTS`

### 🔍 Utilisation
- ✅ Utilisé dans: `btp.service.ts`, `notifications/route.ts`, `providers/route.ts`, `user.mapper.ts`, `invoice.schema.ts`, `utils/index.ts`

### ✅ Constantes créées (2024-11-18)
Toutes les constantes manquantes ont été créées dans `lib/constants/index.ts` :

#### 8.1 Constantes de logging
- ✅ **LOG_LEVELS** - Niveaux de log (DEBUG, INFO, WARN, ERROR)

#### 8.2 Constantes HTTP
- ✅ **HTTP_STATUS_CODES** - Codes de statut HTTP (200, 201, 400, 401, 404, 500, etc.)

#### 8.3 Constantes d'erreur
- ✅ **ERROR_CODES** - Codes d'erreur centralisés (VALIDATION_ERROR, AUTHENTICATION_ERROR, etc.)

#### 8.4 Constantes de date et temps
- ✅ **DATE_FORMATS** - Formats de date (ISO, DATE_ONLY, DISPLAY_DATE, etc.)
- ✅ **TIMEZONES** - Fuseaux horaires supportés (PARIS, LONDON, DAKAR, ABIDJAN, etc.)

#### 8.5 Constantes de devises
- ✅ **CURRENCIES** - Devises supportées avec symboles (EUR, USD, XOF, XAF, GBP, JPY)

#### 8.6 Constantes de langue
- ✅ **LANGUAGES** - Langues supportées (FR, EN, ES, DE, IT, PT, AR)

#### 8.7 Constantes utilisateur
- ✅ **ROLES** - Rôles utilisateur (SUPERADMIN, ADMIN, PROVIDER, CUSTOMER, BENEFICIARY, CSM)
- ✅ **USER_STATUSES** - Statuts utilisateur (ACTIVE, INACTIVE, PENDING, SUSPENDED)

#### 8.8 Constantes métier
- ✅ **BOOKING_STATUSES** - Statuts de réservation (PENDING, CONFIRMED, COMPLETED, CANCELLED, etc.)
- ✅ **TRANSACTION_STATUSES** - Statuts de transaction (PENDING, PROCESSING, COMPLETED, FAILED, etc.)
- ✅ **PAYMENT_METHODS** - Méthodes de paiement supportées (CARD, BANK_TRANSFER, MOBILE_MONEY, PAYPAL, STRIPE)
- ✅ **NOTIFICATION_TYPES** - Types de notifications (EMAIL, SMS, PUSH, WHATSAPP, IN_APP)
- ✅ **MESSAGE_TYPES** - Types de messages (TEXT, IMAGE, FILE, AUDIO, VIDEO, SYSTEM)

#### 8.9 Constantes de spécialités
- ✅ **SPECIALITY_TYPES** - Types de spécialités (HEALTH, BTP, EDUCATION, LEGAL, FINANCE, TECHNOLOGY)
- ✅ **EDUCATION_LEVELS** - Niveaux d'éducation (PRIMARY, SECONDARY, BACHELOR, MASTER, DOCTORATE, etc.)
- ✅ **BTP_CATEGORIES** - Catégories BTP (CONSTRUCTION, RENOVATION, PLUMBING, ELECTRICITY, etc.)
- ✅ **HEALTH_SPECIALTIES** - Spécialités santé (GENERAL_MEDICINE, CARDIOLOGY, DERMATOLOGY, etc.)

#### 8.10 Constantes API
- ✅ **API_ENDPOINTS** - Endpoints API centralisés (AUTH, USERS, TRANSACTIONS, PAYMENTS, BOOKINGS, etc.)

#### 8.11 Constantes de validation
- ✅ **VALIDATION_RULES** - Règles de validation (EMAIL, PASSWORD, NAME, PHONE, ADDRESS, AMOUNT, etc.)

### 🔄 Application en cours
Les constantes ont été appliquées dans :
- ✅ `lib/logger.ts` - Utilise `LOG_LEVELS`
- ✅ `lib/mappers/user.mapper.ts` - Utilise `ROLES`, `USER_STATUSES`, `TIMEZONES`
- ✅ `services/transaction/transaction.service.ts` - Utilise les constantes
- ✅ `services/health/health.service.ts` - Utilise les constantes
- ✅ `services/payment/payment.service.ts` - Utilise les constantes
- ✅ `services/notification/notification.service.ts` - Utilise les constantes
- ✅ `services/auth/auth.service.ts` - Utilise les constantes
- ✅ `app/api/providers/route.ts` - Utilise les constantes
- ✅ `lib/validations/invoice.schema.ts` - Utilise les constantes
- ✅ `services/education/education.service.ts` - Utilise les constantes
- ✅ `services/btp/btp.service.ts` - Utilise les constantes
- ✅ `services/booking/booking.service.ts` - Utilise les constantes

### ❌ Utilisation manquante (à améliorer)

#### 📊 Statistiques d'utilisation (2024-12-19 - Mise à jour finale)
- **Fichiers utilisant les constantes** : ~47 fichiers (Phase 1 + Phase 2 + Phase 3 + Repositories + API Routes)
- **Fichiers avec valeurs en dur** : ~3+ fichiers restants (principalement exemples, tests, et valeurs optionnelles comme KYC_STATUSES)
- **Taux d'utilisation** : ~94% (47/50 fichiers analysés) ⬆️ +51% depuis le début
- **Constantes définies** : 50+ constantes
- **Constantes réellement utilisées** : ~75% ⬆️ +45% depuis le début

#### 🔴 Priorité 1 - Fichiers critiques (✅ TERMINÉ)

**1. Modèles (`models/User.ts`)** ✅
- ✅ `enum: Object.values(ROLES)`
- ✅ `enum: Object.values(USER_STATUSES)`
- ✅ `default: USER_STATUSES.PENDING`
- ✅ `default: [ROLES.CUSTOMER]`

**2. Composants UI (`components/features/providers/AdvancedFilters.tsx`)** ✅
- ✅ Utilise `USER_STATUSES.ACTIVE`, `USER_STATUSES.INACTIVE`, etc.

**3. Pages de formulaire (`app/dashboard/users/[id]/edit/page.tsx`, `app/dashboard/users/new/page.tsx`)** ✅
- ✅ Utilise `USER_STATUSES.ACTIVE`
- ✅ Utilise `LANGUAGES.FR.code`
- ✅ Utilise `TIMEZONES.PARIS`

**4. Routes API (`app/api/users/route.ts`, `app/api/auth/user-profile/route.ts`, etc.)** ✅
- ✅ Utilise `USER_STATUSES.ACTIVE`
- ✅ Utilise `USER_STATUSES.PENDING`

#### 🟡 Priorité 2 - Services et routes API (✅ TERMINÉ)

**5. Services (`services/transaction/transaction.service.ts`, `services/statistics/statistics.service.ts`, etc.)** ✅
- ✅ Utilise `CURRENCIES.EUR.code` et `CURRENCIES.XOF.code`
- ✅ Utilise `PAYMENT_METHODS.CARD`, `PAYMENT_METHODS.STRIPE`, etc.

**6. Routes API (`app/api/bookings/route.ts`, `app/api/orders/active/route.ts`, etc.)** ✅
- ✅ Utilise `BOOKING_STATUSES.PENDING`, `BOOKING_STATUSES.CONFIRMED`, etc.
- ✅ Utilise `USER_STATUSES` dans les routes providers

#### 🟢 Priorité 3 - Autres fichiers (✅ TERMINÉ)

- ✅ **Facades** : Utilisent maintenant `LANGUAGES`, `CURRENCIES`, `BOOKING_STATUSES`
- ✅ **Hooks** : Utilisent maintenant `USER_STATUSES`, `ROLES`, `LANGUAGES`, `TIMEZONES`, `CURRENCIES`
- ✅ **Builders** : Utilisent maintenant `USER_STATUSES`, `BOOKING_STATUSES`, `TRANSACTION_STATUSES`, `InvoiceStatus`, `ComplaintStatus`
- ✅ **Repositories** : Utilisent maintenant `USER_STATUSES`, `ROLES`, `LANGUAGES`, `CURRENCIES`, `InvoiceStatus`
  - ✅ `repositories/implementations/MongoUserRepository.ts` - Utilise `USER_STATUSES.ACTIVE`, `ROLES.CUSTOMER`
  - ✅ `repositories/implementations/MongoNotificationTemplateRepository.ts` - Utilise `LANGUAGES.FR.code`
  - ✅ `repositories/implementations/MongoInvoiceRepository.ts` - Utilise `CURRENCIES.EUR.code`, `InvoiceStatus`
- ✅ **Decorators** : Aucune valeur en dur détectée (déjà conforme)
- ✅ **API Routes** : Utilisent maintenant `HTTP_STATUS_CODES` (401, 400, 404, 500)
  - ✅ `app/api/orders/active/route.ts` - Utilise `HTTP_STATUS_CODES.UNAUTHORIZED`, `HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR`
  - ✅ `app/api/bookings/pending-count/route.ts` - Utilise `HTTP_STATUS_CODES.UNAUTHORIZED`, `HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR`
  - ✅ `app/api/providers/[id]/route.ts` - Utilise `HTTP_STATUS_CODES.BAD_REQUEST`, `HTTP_STATUS_CODES.NOT_FOUND`, `HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR`
  - ✅ `app/api/auth/user-profile/route.ts` - Utilise `HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR`
  - ✅ `app/api/complaints/route.ts` - Utilise `HTTP_STATUS_CODES.UNAUTHORIZED`
- ⚠️ **Validations** : Utilisent les méthodes Zod standard (`.email()`, `.min()`, `.max()`) - Pas de regex hardcodées détectées. `VALIDATION_RULES` existe mais n'est pas encore utilisé dans les schémas Zod (optionnel car Zod a ses propres validations) (Phase 4)

### 📋 Plan de correction

#### Phase 1 : Fichiers critiques (✅ TERMINÉ - 2024-12-19)
1. ✅ `models/User.ts` - Remplacé les enums par `Object.values(ROLES)` et `Object.values(USER_STATUSES)`
2. ✅ `components/features/providers/AdvancedFilters.tsx` - Utilise maintenant `USER_STATUSES`
3. ✅ `app/dashboard/users/[id]/edit/page.tsx` - Utilise `USER_STATUSES`, `LANGUAGES`, `TIMEZONES`
4. ✅ `app/dashboard/users/new/page.tsx` - Utilise `USER_STATUSES`, `LANGUAGES`, `TIMEZONES`
5. ✅ `app/api/users/route.ts` - Utilise `USER_STATUSES`, `ROLES`, `LANGUAGES`, `TIMEZONES`
6. ✅ `app/api/auth/user-profile/route.ts` - Utilise `USER_STATUSES`, `ROLES`, `LANGUAGES`, `TIMEZONES`

#### Phase 2 : Services et routes API (✅ TERMINÉ - 2024-12-19)
7. ✅ `services/transaction/transaction.service.ts` - Utilise `PAYMENT_METHODS` (CARD, STRIPE)
8. ✅ `services/statistics/statistics.service.ts` - Utilise `CURRENCIES.EUR.code`
9. ✅ `services/payment/payment.service.ts` - Utilise `PAYMENT_METHODS` (STRIPE, PAYPAL, MOBILE_MONEY)
10. ✅ `services/payment/payment.service.strategy.ts` - Utilise `PAYMENT_METHODS` et `CURRENCIES.EUR.code`
11. ✅ `services/invoice/pdf-generator.service.ts` - Utilise `CURRENCIES.EUR.code` comme valeur par défaut
12. ✅ `services/education/education.service.ts` - Utilise `CURRENCIES.XOF.code`
13. ✅ `services/btp/btp.service.ts` - Utilise `CURRENCIES.XOF.code`
14. ✅ `app/api/bookings/route.ts` - Utilise `BOOKING_STATUSES`
15. ✅ `app/api/orders/active/route.ts` - Utilise `BOOKING_STATUSES`
16. ✅ `app/api/bookings/pending-count/route.ts` - Utilise `BOOKING_STATUSES.PENDING`
17. ✅ `app/api/providers/route.ts` - Utilise `USER_STATUSES.PENDING`
18. ✅ `app/api/providers/[id]/route.ts` - Utilise `USER_STATUSES.ACTIVE`

**Note** : `TransactionStatus` utilise un enum TypeScript existant, donc on utilise `TransactionStatus.PENDING` au lieu de la constante `TRANSACTION_STATUSES.PENDING` pour maintenir la compatibilité avec les types existants.

#### Phase 3 : Autres fichiers (✅ TERMINÉ - 2024-12-19)
19. ✅ **Facades** (5 fichiers corrigés)
    - ✅ `facades/beneficiary.facade.ts` - Utilise `LANGUAGES.FR.code`
    - ✅ `facades/payment.facade.ts` - Utilise `LANGUAGES.FR.code`
    - ✅ `facades/booking.facade.ts` - Utilise `LANGUAGES.FR.code` et `BOOKING_STATUSES.PENDING`
    - ✅ `facades/complaint.facade.ts` - Utilise `LANGUAGES.FR.code`
    - ✅ `facades/invoice.facade.ts` - Utilise `LANGUAGES.FR.code` et `CURRENCIES.EUR.code`

20. ✅ **Hooks** (5 fichiers corrigés)
    - ✅ `hooks/services/useServiceStats.ts` - Utilise `USER_STATUSES.ACTIVE`
    - ✅ `hooks/settings/useSettings.ts` - Utilise `LANGUAGES.FR.code` et `TIMEZONES.PARIS`
    - ✅ `hooks/payments/usePayments.ts` - Utilise `CURRENCIES.EUR.code`
    - ✅ `hooks/notifications/useNotificationPreferences.ts` - Utilise `LANGUAGES.FR.code` et `TIMEZONES.PARIS`
    - ✅ `hooks/providers/useProviderDetail.ts` - Utilise `USER_STATUSES.ACTIVE` et `ROLES.PROVIDER`

21. ✅ **Builders** (5 fichiers corrigés)
    - ✅ `builders/UserQueryBuilder.ts` - Utilise `USER_STATUSES.ACTIVE`
    - ✅ `builders/BookingQueryBuilder.ts` - Utilise `BOOKING_STATUSES`
    - ✅ `builders/TransactionQueryBuilder.ts` - Utilise `TRANSACTION_STATUSES`
    - ✅ `builders/InvoiceQueryBuilder.ts` - Utilise `InvoiceStatus` enum
    - ✅ `builders/ComplaintQueryBuilder.ts` - Utilise `ComplaintStatus` type

22. ✅ **Routes API** - `HTTP_STATUS_CODES` (✅ TERMINÉ - 2024-12-19)
    - ✅ 5 routes API corrigées pour utiliser `HTTP_STATUS_CODES` au lieu de codes en dur
    - ⚠️ `ERROR_CODES` : Existe dans les constantes mais peu utilisé (optionnel car les messages d'erreur sont déjà gérés par `ApiError`)

23. ⚠️ **Validations** - `VALIDATION_RULES` dans les schémas (Optionnel - Phase 4)
    - Les schémas Zod utilisent les méthodes standard (`.email()`, `.min()`, `.max()`) qui sont déjà bien typées
    - `VALIDATION_RULES` existe dans les constantes mais son utilisation dans Zod est optionnelle

---

## 9. 🔄 MAPPERS

### ✅ Ce qui existe
- `lib/mappers/user.mapper.ts` - Mapper pour les utilisateurs
  - `mapUserToResponse` - Transforme UserDocument → UserResponse

### 🔍 Utilisation
- ✅ Utilisé dans: `app/api/users/me/route.ts`

### ❌ Ce qui MANQUE

#### 9.1 Mappers manquants
- **BookingMapper** - Pour transformer Booking → BookingResponse
- **PaymentMapper** - Pour transformer PaymentIntent → PaymentResponse
- **TransactionMapper** - Pour transformer Transaction → TransactionResponse
- **InvoiceMapper** - Pour transformer Invoice → InvoiceResponse
- **ComplaintMapper** - Pour transformer Complaint → ComplaintResponse
- **BeneficiaryMapper** - Pour transformer Beneficiary → BeneficiaryResponse
- **NotificationMapper** - Pour transformer Notification → NotificationResponse
- **MessageMapper** - Pour transformer Message → MessageResponse
- **SpecialityMapper** - Pour transformer Speciality → SpecialityResponse
- **QuoteMapper** - Pour transformer Quote → QuoteResponse
- **ProviderMapper** - Pour transformer Provider → ProviderResponse
- **StatisticsMapper** - Pour transformer Statistics → StatisticsResponse

#### 9.2 Fonctionnalités manquantes dans le mapper existant
- **Constants** : `user.mapper.ts` utilise `LOCALE` mais pourrait utiliser plus de constantes
- **Types** : Devrait exporter les types de mapping
- **Documentation** : Documentation limitée

#### 9.3 Utilisation manquante
- **Facades** : Aucune facade n'utilise de mappers
- **Services** : Aucun service n'utilise de mappers (mapping inline)
- **Repositories** : Les repositories font du mapping inline au lieu d'utiliser des mappers
- **Hooks** : Les hooks ne mappent pas les données reçues

---

## 10. 📘 TYPES

### ✅ Ce qui existe
Tous les types sont centralisés dans `lib/types/` avec différents formats de nommage:

#### Format `*.types.ts` (avec suffixe .types)
- `lib/types/auth.types.ts` - Types authentification
- `lib/types/bookings.types.ts` - Types réservation
- `lib/types/beneficiaries.types.ts` - Types bénéficiaires

#### Format `*.ts` (sans suffixe .types)
- `lib/types/index.ts` - Point d'entrée centralisé avec tous les exports
- `lib/types/user.ts` - Types utilisateur
- `lib/types/users.ts` - Types utilisateur (variante)
- `lib/types/transaction.ts` - Types transaction
- `lib/types/payments.ts` - Types paiement
- `lib/types/invoices.ts` - Types facture
- `lib/types/complaints.ts` - Types réclamation
- `lib/types/notifications.ts` - Types notification
- `lib/types/messaging.ts` - Types messagerie
- `lib/types/statistics.ts` - Types statistiques
- `lib/types/quotes.ts` - Types devis
- `lib/types/services.ts` - Types services
- `lib/types/kyc.ts` - Types KYC
- `lib/types/gdpr.ts` - Types GDPR
- `lib/types/pci.ts` - Types PCI
- `lib/types/health.ts` - Types santé
- `lib/types/orders.ts` - Types commandes
- `lib/types/email.ts` - Types email
- `lib/types/settings.ts` - Types paramètres
- `lib/types/dashboard.ts` - Types dashboard
- `lib/types/dashboard-services.ts` - Types services dashboard
- `lib/types/layout.ts` - Types layout
- `lib/types/hooks.ts` - Types hooks
- `lib/types/next-auth.d.ts` - Types NextAuth
- `lib/types/next-navigation.d.ts` - Types Next Navigation

### 🔍 Utilisation
- ✅ Utilisé partout dans le projet

### ❌ Ce qui MANQUE

#### 10.1 Types manquants
- ✅ **lib/types/mappers.types.ts** - Types pour les mappers (input/output, transformations) - **CRÉÉ**
- ✅ **lib/types/builders.types.ts** - Types pour les builders (query builders, filter builders) - **CRÉÉ**
- ✅ **lib/types/decorators.types.ts** - Types pour les decorators (options, metadata) - **CRÉÉ**
- ✅ **lib/types/constants.types.ts** - Types pour les constantes (types dérivés des constantes) - **CRÉÉ**
- ✅ **lib/types/errors.types.ts** - Types d'erreurs centralisés (ErrorCode, ApiError, etc.) - **CRÉÉ**
- ✅ **lib/types/events.types.ts** - Types d'événements (EventBus, EventPayload, etc.) - **CRÉÉ**
- ✅ **lib/types/cache.types.ts** - Types pour le cache (CacheKey, CacheOptions, etc.) - **CRÉÉ**
- ✅ **lib/types/validation.types.ts** - Types pour la validation (ValidationResult, ValidationError, etc.) - **CRÉÉ**
- ✅ **lib/types/repositories.types.ts** - Types génériques pour les repositories (si pas déjà dans interfaces) - **CRÉÉ**
- ✅ **lib/types/facades.types.ts** - Types pour les facades (FacadeData, FacadeResult patterns) - **CRÉÉ ET UTILISÉ**

**✅ Tous les types manquants ont été créés et intégrés dans `lib/types/index.ts`**

**📝 Note (2025-01-10)** : Les types de facades (`BookingFacadeData`, `PaymentFacadeData`, etc.) sont maintenant centralisés dans `lib/types/facades.types.ts` et exportés depuis `lib/types/index.ts`. Cependant, certaines facades utilisent encore des interfaces locales qui devraient être migrées vers les types centralisés.

#### 10.2 Fonctionnalités manquantes
- **Cohérence de nommage** : Mélange de formats `*.types.ts` et `*.ts`
  - Devrait standardiser le format (recommandation: utiliser `*.types.ts` pour tous)
  - Exemples d'incohérence: `auth.types.ts` vs `user.ts`, `bookings.types.ts` vs `statistics.ts`

- **Documentation** : Documentation limitée des types
  - Devrait avoir des JSDoc comments pour tous les types et interfaces
  - Devrait documenter les enums et leurs valeurs

- **Validation** : Pas de types dérivés des schémas Zod
  - Devrait exporter les types depuis les schémas Zod avec `z.infer<>`
  - Devrait créer des types de mapping entre schémas Zod et types TypeScript

- **Index centralisé** : Le fichier `index.ts` est volumineux (1088 lignes)
  - Devrait être mieux organisé avec des sections claires
  - Devrait avoir une meilleure structure d'export

---

## 11. ✅ SCHEMAS (ZOD)

### ✅ Ce qui existe
- `lib/validations/user.schema.ts` - Schémas utilisateur
- `lib/validations/booking.schema.ts` - Schémas réservation
- `lib/validations/payment.schema.ts` - Schémas paiement
- `lib/validations/transaction.schema.ts` - Schémas transaction
- `lib/validations/invoice.schema.ts` - Schémas facture
- `lib/validations/complaint.schema.ts` - Schémas réclamation
- `lib/validations/beneficiary.schema.ts` - Schémas bénéficiaire
- `lib/validations/notification.schema.ts` - Schémas notification
- `lib/validations/provider.schema.ts` - Schémas provider
- `lib/validations/availability.schema.ts` - Schémas disponibilités
- `lib/validations/index.ts` - Export centralisé

### 🔍 Utilisation
- ✅ Utilisé dans: Facades (partiellement), Services (partiellement), Routes API (partiellement)

### ❌ Ce qui MANQUE

#### 11.1 Schemas manquants
- **message.schema.ts** - Schémas pour les messages
- **conversation.schema.ts** - Schémas pour les conversations
- **speciality.schema.ts** - Schémas pour les spécialités
- **quote.schema.ts** - Schémas pour les devis
- **statistics.schema.ts** - Schémas pour les statistiques
- **education.schema.ts** - Schémas pour l'éducation
- **btp.schema.ts** - Schémas pour BTP
- **audit.schema.ts** - Schémas pour l'audit
- **kyc.schema.ts** - Schémas pour KYC
- **gdpr.schema.ts** - Schémas pour GDPR

#### 11.2 Fonctionnalités manquantes dans les schemas existants
- **Constants** : Utilisation limitée des constantes
  - `invoice.schema.ts` utilise `DEFAULT_CURRENCY` mais les autres non
  - Devraient tous utiliser les constantes appropriées

- **Types exportés** : Tous les schémas devraient exporter les types TypeScript
  - Utiliser `z.infer<>` pour créer les types depuis les schémas

- **Réutilisabilité** : Certains schémas ont des parties communes qui pourraient être extraites
  - Exemple: `RecipientSchema` dans `booking.schema.ts` pourrait être réutilisé

- **Validation messages** : Messages d'erreur incohérents
  - Devraient avoir des messages d'erreur cohérents et traduits

#### 11.3 Utilisation manquante
- **Facades** : Utilisation partielle (certaines facades valident, d'autres non)
- **Services** : Utilisation incohérente (certains services valident, d'autres non)
- **Repositories** : Aucun repository ne valide avec Zod
- **Hooks** : Aucun hook ne valide avec Zod côté client
- **Routes API** : Utilisation partielle (certaines routes valident, d'autres non)

---

## 📊 RÉSUMÉ PAR PRIORITÉ

### 🔴 PRIORITÉ HAUTE (Impact majeur sur la cohérence)

1. **Mappers** : Créer tous les mappers manquants et les utiliser partout
2. **Constants** : Créer toutes les constantes manquantes et les utiliser partout
3. **Schemas** : Créer tous les schémas manquants et les utiliser partout
4. **Types** : Centraliser et documenter tous les types

### 🟡 PRIORITÉ MOYENNE (Amélioration de la qualité)

5. **Facades** : Créer les facades manquantes et améliorer les existantes
6. **Builders** : Créer les builders manquants et améliorer les existants
7. **Decorators** : Créer les decorators manquants
8. **Services** : Améliorer l'utilisation des mappers, constants, et schemas

### 🟢 PRIORITÉ BASSE (Optimisation)

9. **Hooks** : Améliorer l'utilisation des facades, mappers, et validation
10. **Repositories** : Améliorer l'utilisation des mappers et builders
11. **Logs** : Améliorer la centralisation et la structure

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Phase 1: Fondations (Semaine 1-2)
1. Créer toutes les constantes manquantes
2. Créer tous les types manquants
3. Créer tous les schémas Zod manquants

### Phase 2: Transformation (Semaine 3-4)
4. Créer tous les mappers manquants
5. Remplacer le mapping inline par les mappers dans services et repositories
6. Utiliser les mappers dans les facades

### Phase 3: Amélioration (Semaine 5-6)
7. Créer les facades manquantes
8. Créer les builders manquants
9. Améliorer l'utilisation des constants partout

### Phase 4: Optimisation (Semaine 7-8)
10. Créer les decorators manquants
11. Améliorer les hooks pour utiliser facades et mappers
12. Améliorer la validation avec Zod partout

---

## 📝 NOTES IMPORTANTES

- Cette analyse est basée sur l'état actuel du code
- Certaines fonctionnalités peuvent exister mais ne pas être utilisées de manière cohérente
- L'objectif est d'avoir une architecture cohérente où chaque groupe utilise les autres groupes de manière standardisée
- La priorité est de réduire la duplication et d'améliorer la maintenabilité

---

## 📊 ÉTAT ACTUEL (2025-01-10)

### ✅ Progrès réalisés

1. **Constants** : ✅ **94% d'utilisation** - La plupart des constantes ont été créées et appliquées dans ~47 fichiers
2. **Types** : ✅ **100%** - Tous les types manquants ont été créés et centralisés
3. **Facades - Constants** : ✅ **Amélioré** - Les facades utilisent maintenant les constantes (`LANGUAGES`, `BOOKING_STATUSES`, `CURRENCIES`)
4. **Facades - Types** : ✅ **Amélioré** - Les types de facades sont centralisés dans `lib/types/facades.types.ts`
5. **Schemas** : ✅ **Ajouté** - `availability.schema.ts` a été créé

### ⚠️ En attente

1. **Mappers** : ❌ **Toujours 1 seul mapper** (`user.mapper.ts`) - 11 mappers manquants
2. **Facades manquantes** : ❌ **8 facades manquantes** (TransactionFacade, UserFacade, NotificationFacade, etc.)
3. **Builders manquants** : ❌ **5 builders manquants** (NotificationQueryBuilder, MessageQueryBuilder, etc.)
4. **Decorators manquants** : ❌ **7 decorators manquants** (@RateLimit, @Authorize, @Audit, etc.)
5. **Schemas manquants** : ❌ **10 schémas manquants** (message, conversation, speciality, etc.)

### 📈 Statistiques globales

- **Constants** : 94% d'utilisation ⬆️
- **Types** : 100% créés ✅
- **Schemas** : 55% créés (10/18) ⚠️
- **Mappers** : 8% créés (1/12) ⚠️
- **Facades** : 38% créées (5/13) ⚠️
- **Builders** : 54% créés (6/11) ⚠️
- **Decorators** : 42% créés (5/12) ⚠️
