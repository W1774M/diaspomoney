# Contrats Facade + Hooks (rewrite)

## Facade

| Fait | Ne fait pas |
| --- | --- |
| Orchestrer 1..n services | Persistence Mongo directe |
| Valider commande (`@Validate`) | HTML email / Resend |
| Appeler domaine via services ou ACL mince | Events domaine côté client |
| Notifier via `dispatchFacadeNotification` | `emailService.sendCustomEmail` ad hoc |

Résultat : `FacadeResult<T>` (`success`, `data?`, `error?`, `metadata?`).

Notify : `facades/_shared/dispatchNotification.ts` → `NotificationIntent` → `notificationService`.

## Hook UI

| Fait | Ne fait pas |
| --- | --- |
| `fetchJson` vers `/api/*` | Import facades / services / domain |
| État `data` / `error` / `isLoading` | EventBus domaine (sauf auth legacy) |
| Actions thin | Emails, PDF, toasts (→ composants) |

Helpers : `lib/api/fetchJson.ts`, `hooks/_shared/useAsyncState.ts`.

## Naming

- Booking canonique : `bookingId` (pas `appointmentId` en API interne)
- Mongo : `@/lib/mongodb`
- Stripe : `docs/stripe-integration.md`
