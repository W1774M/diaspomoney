# Audit DDD intégral — DiaspoMoney

Synthèse Evans / Vernon / IDDD sur **tout** le monolithe (pas seulement Payments).

## Verdict

Couches techniques présentes (`facades` → `services` → `repositories`), mais modèles Mongoose **anémiques** et règles dispersées.  
Couche `domain/` désormais couvre les **7 bounded contexts**.

| BC | Avant | Après (`domain/`) |
| --- | --- | --- |
| Identity | User god-document | `UserAccount`, `AccountStatus`, `RoleSet`, `Email` |
| Catalog | CRUD Service/Speciality | `CatalogService`, `Category`, `Speciality` |
| Booking | metadata + routes | `Booking`, statuses (Phase 1) |
| Payments | double stack puis Strategy | `Money`, `PaymentProof` (Phase 1) |
| Billing | totaux manuels, status divergents | `Invoice`, `InvoiceLine`, `InvoiceStatus` |
| CRM | repos natifs, pas de model | `Beneficiary`, `Complaint`, `Quote` |
| Comms | Resend inline dans facades | `NotificationIntent`, `EmailDispatch`, `SupportTicket` |

## Call sites branchés (invariants)

- Identity → `AuthService.register` (`UserAccount.register`) + `AuthService.login` (`assertCanLogin`)
- Catalog → `createService` / `updateService` / `createServiceOption` / `Speciality.create` + `createBooking.assertBookable` **hard** — **forced Done**
- Billing → `InvoiceService.createInvoice` (`Invoice.draft`) + `updateInvoiceStatus` / `markInvoiceAsPaid` (transitions)
- Booking/Payments → ConfirmBookingPayment + `verifyPaymentProof` (idempotent)
- CRM → Beneficiary (facade + `user.service.addBeneficiary`) + Complaint (`bookingId` dual-write + transitions) + Quote APIs via `quoteFacade` — **forced Done**
- Comms → `NotificationIntent` + `EmailDispatch` (email.service / confirm-payment / payment-link) + `SupportTicket.open` (messaging) — **forced Done**

## Prochaines extractions

1. Drop colonne legacy `appointmentId` Complaint (dual-write déjà en place)
2. Extraire Stripe refund hors `booking.service.deleteBookingCompletely`
3. Isoler education/btp hors parcours critique si pas de vraie persistence
