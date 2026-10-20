# Context map — DiaspoMoney (intégral)

```mermaid
flowchart TB
  Identity[Identity_Access]
  Catalog[Catalog_Providers]
  Booking[Booking_Scheduling]
  Payments[Payments_Settlements]
  Billing[Billing_Invoicing]
  CRM[CRM_Family]
  Comms[Comms_Support]

  Booking -->|"paymentIntentId"| Payments
  Payments -->|"PaymentSucceeded"| Booking
  Payments -->|"settle"| Billing
  Booking -->|"beneficiaryId_ref"| CRM
  CRM -->|"ownerClientId"| Identity
  Booking --> Catalog
  Booking --> Identity
  Billing --> Identity
  Catalog -.->|"ProviderProfile"| Identity
  Booking -->|"notify"| Comms
  Payments -->|"notify"| Comms
  Billing -->|"notify"| Comms
  CRM -->|"notify"| Comms
```

## Contextes & dossiers

| Context | Domaine | Application actuelle |
| --- | --- | --- |
| Identity & Access | `domain/identity` | `models/User`, `services/auth`, `services/user`, `app/api/auth` |
| Catalog & Providers | `domain/catalog` | `models/Service*`, `Speciality`, `Partner`, `services/service`, `speciality` |
| Booking & Scheduling | `domain/booking` | `services/booking`, `facades/service-booking.facade`, `app/api/bookings` |
| Payments & Settlements | `domain/payment` | `strategies/payment`, `services/payment`, `app/api/stripe` |
| Billing / Invoicing | `domain/billing` | `models/Invoice`, `services/invoice`, `facades/invoice.facade` |
| CRM Family | `domain/crm` | beneficiary/complaint/quote repos + facades BTP/Education |
| Comms & Support | `domain/comms` | email, notification, messaging, SupportTicket |

## Relations (ACL)

| Upstream → Downstream | Style | Notes |
| --- | --- | --- |
| Booking → Payments | Customer/Supplier | Booking demande `PaymentProof` |
| Payments → Booking | Partner | Webhook / ConfirmBookingPayment |
| Booking → CRM | OHS / Conformist | Snapshot + `beneficiaryId` cible |
| CRM → Identity | Customer/Supplier | `ownerClientId` = UserAccount |
| * → Comms | Published Language | Events / `NotificationIntent` ; pas d’import Resend dans le métier |

## Entrées techniques (naming)

| Concern | Canonique | Legacy |
| --- | --- | --- |
| Mongo | `@/lib/mongodb` (`dbConnect`, `getMongoClient`, `getCollection`) | `@/lib/database/mongodb` = re-export déprécié |
| Stripe | Voir [`docs/stripe-integration.md`](../stripe-integration.md) | `lib/stripe.ts` (sim) **supprimé** |

## Fuites documentées (à éliminer)

1. `booking.service.deleteBookingCompletely` → Stripe refund
2. ~~Facades CRM/BTP/Education → `notificationService` inline~~ → `dispatchFacadeNotification` (**Done**)
3. Beneficiary créé via `user.service` (Identity)
4. ~~Complaint.`appointmentId` seul~~ → dual-write `bookingId` + ACL facade/schema (**Done** call sites ; drop colonne legacy restant)
5. Invoice status divergents schema vs types
6. Catalog `group` vs `category` vs `SPECIALITY_TYPES`

## Roadmap d’extraction

| Priorité | Context | Wire call site |
| --- | --- | --- |
| Done | Payments + Booking | `verifyPaymentProof`, ConfirmBookingPayment |
| Done | Identity | `auth.service.register` + `login` (`assertCanLogin`) |
| Done | Billing | `createInvoice` + `updateInvoiceStatus` / `markInvoiceAsPaid` |
| Done | Catalog | `createService` + `createBooking.assertBookable` — **forced migration** |
| Done | CRM | `beneficiary.facade` ; `Complaint.open` / `updateComplaint.transitionTo` ; `quoteFacade` sur `api/btp/quote` + `api/education/inquiry` ; ACL `bookingId`\|\|`appointmentId` — **forced migration** |
| Done | Comms | `notification.service` → `NotificationIntent` ; facades → `dispatchFacadeNotification` — **forced migration** |
| P3 | Extraire refund Stripe hors Booking ; drop persistence legacy `appointmentId` |
