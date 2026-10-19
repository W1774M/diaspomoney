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

- Identity → `AuthService.register` via `UserAccount.register`
- Catalog → `ServiceService.createService` via `CatalogService.create`
- Billing → `InvoiceService.createInvoice` via `Invoice.draft`
- Booking/Payments → ConfirmBookingPayment + `verifyPaymentProof` (existant)

## Prochaines extractions

1. `beneficiary.facade` → `Beneficiary.create` + `assertOwnedBy`
2. Complaint : renommer `appointmentId` → `bookingId`
3. Ports Comms : facades métier émettent `NotificationIntent` au lieu d’appeler Resend
4. Extraire Stripe refund hors `booking.service.deleteBookingCompletely`
5. Façade Quote unique (BTP + Education)
