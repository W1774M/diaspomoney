# Langue ubiquitaire — DiaspoMoney (intégral)

Vocabulaire canonique pour **tous** les bounded contexts.  
À utiliser dans `domain/`, les use cases, puis progressivement facades/API/UI.

## Transverse

| Terme | Définition | À abandonner |
| --- | --- | --- |
| **Client** | Personne qui paie / compte payeur (`clientId`) | requester, payer, customer, `userId` ambigu |
| **Money** | Montant + devise (unité majeure) | nombres nus « parfois centimes » |
| **Provider** | Prestataire de service | mélange Partner / HealthProvider / `User.providerInfo` |

## Identity & Access

| Terme | Définition | À abandonner |
| --- | --- | --- |
| **UserAccount** | Compte authentifiable | « User » fourre-tout (KYC+provider+beneficiary) |
| **AccountStatus** | `PENDING` \| `ACTIVE` \| `SUSPENDED` | flags `isActive` / `emailVerified` contradictoires |
| **RoleSet** | Ensemble de rôles cohérents (`CLIENT`, `PROVIDER`, `ADMIN`…) | `roles[0]` seul comme vérité ; rôle fantôme `PAYER` |

## Catalog & Providers

| Terme | Définition | À abandonner |
| --- | --- | --- |
| **CatalogService** | Offre bookable (santé / éducation / BTP) | confusion avec `ServiceService` applicatif |
| **Category** | `HEALTH` \| `EDUCATION` \| `BTP` | `group` vs `category` vs `SPECIALITY_TYPES` élargi |
| **Speciality** | Spécialité de catalogue | orthographe `specialty` |
| **ServiceOption** | Option additionnelle liée à un CatalogService | push d’IDs sans invariant |

## Booking & Scheduling

| Terme | Définition | À abandonner |
| --- | --- | --- |
| **Booking** | Réservation payée pour un bénéficiaire | Appointment (sauf clinique), Reservation (sauf n° `RES-…`) |
| **BookingStatus** | `DRAFT` \| `PENDING` \| `CONFIRMED` \| `FINISHED` \| `CANCELLED` | enum Mongoose lowercase sans mapping |
| **Beneficiary** (snapshot) | Personne qui reçoit la prestation | recipient |

## Payments & Settlements

| Terme | Définition | À abandonner |
| --- | --- | --- |
| **PaymentProof** | Preuve serveur Stripe (`pi_` / `cs_`) | « confirmed côté client » |
| **PaymentStatus** | `pending` \| `processing` \| `confirmed` \| `failed` | flags metadata sans machine d’état |
| **Transaction** | Écriture ledger | confusion avec PaymentIntent |

## Billing / Invoicing

| Terme | Définition | À abandonner |
| --- | --- | --- |
| **Invoice** | Document de facturation | mélange avec Payment |
| **InvoiceStatus** | `DRAFT` \| `SENT` \| `PAID` \| `OVERDUE` \| `CANCELLED` | `PENDING` vs `SENT` divergents |
| **InvoiceLine** | Ligne : `total = qty × unitPrice` | totaux saisis à la main incohérents |
| **BillTo / ClientId** | Destinataire facture | `customerId` + `userId` doublons |

## CRM Family

| Terme | Définition | À abandonner |
| --- | --- | --- |
| **Beneficiary** (agrégat) | Fiche famille liée à un Client (`ownerClientId`) | création via UserService Identity |
| **Complaint** | Réclamation prestation | `appointmentId` → utiliser **bookingId** |
| **Quote** | Devis BTP/Éducation (`kind`) | double entrée API sans façade unique |
| **SupportTicket** | Ticket support technique (≠ Complaint) | confusion produit |

## Comms & Support

| Terme | Définition | À abandonner |
| --- | --- | --- |
| **NotificationIntent** | Intention d’notifier (domaine) | appels Resend inline dans facades métier |
| **EmailDispatch** | Port d’envoi email (infra) | logique métier dans `email.service` |
| **Conversation / Message** | Messagerie | — |

## Règles globales

1. Les contextes métier **n’importent pas** Stripe / Resend / Mongoose.
2. Comms est **downstream** : events / ports, pas d’orchestration inverse.
3. Booking référence CRM via `beneficiaryId` (+ snapshot), pas l’inverse.
4. Billing ≠ Payments : facture documentaire vs preuve de règlement.
