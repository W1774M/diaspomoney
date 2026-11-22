# Conventions de code

Le flux d'une requête : **page → composant → hook → `/api/*` → facade → services → repositories**, avec les règles métier dans `domain/` (voir [`ddd/`](./ddd/context-map.md)).

## Pages (`app/`)

Une page du dashboard est un simple wrapper : toute la logique est dans `components/<ressource>/<Ressource>Page.tsx`.

```tsx
// app/dashboard/complaints/page.tsx
"use client";

import { ComplaintsPage } from "@/components/complaints";

export default function Complaints() {
  return <ComplaintsPage />;
}
```

## Hooks UI (`hooks/`)

| Fait | Ne fait pas |
| --- | --- |
| `fetchJson` vers `/api/*` | Import facades / services / domain |
| État `data` / `error` / `isLoading` | EventBus domaine (sauf auth legacy) |
| Actions fines | Emails, PDF, toasts (→ composants) |

Helpers : `lib/api/fetchJson.ts`, `hooks/_shared/useAsyncState.ts`.

## Facades (`facades/`)

| Fait | Ne fait pas |
| --- | --- |
| Orchestrer 1..n services | Persistance Mongo directe |
| Valider la commande (`@Validate`) | HTML d'e-mail / Resend |
| Appeler le domaine via les services ou une ACL mince | Événements domaine côté client |
| Notifier via `dispatchFacadeNotification` | `emailService.sendCustomEmail` ad hoc |

Résultat : `FacadeResult<T>` (`success`, `data?`, `error?`, `metadata?`).

Notification : `facades/_shared/dispatchNotification.ts` → `NotificationIntent` → `notificationService`.

## Cache

Méthodes de dépôts, services et facades décorées `@Cacheable` / `@InvalidateCache` : voir [`cache-redis.md`](./cache-redis.md).

## Nommage

- Réservation canonique : `bookingId` (pas `appointmentId` en API interne).
- MongoDB : `@/lib/mongodb`.
- Stripe : voir [`../paiements/stripe.md`](../paiements/stripe.md).
- Vocabulaire métier : [`ddd/ubiquitous-language.md`](./ddd/ubiquitous-language.md).

## Documentation dans le code

Certains dossiers ont leur propre README : [`builders/`](../../builders/README.md), [`repositories/`](../../repositories/README.md), [`strategies/payment/`](../../strategies/payment/README.md), [`lib/events/`](../../lib/events/README.md).
