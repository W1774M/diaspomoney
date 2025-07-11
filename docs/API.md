# API DiaspoMoney - Documentation Technique

## Vue d'ensemble

L'API DiaspoMoney est une API REST sécurisée construite avec Next.js, MongoDB et NextAuth. Elle fournit des endpoints pour l'authentification, la gestion des utilisateurs, des prestataires et des rendez-vous.

## Base URL

```
Production: https://api.diaspomoney.com
Development: http://localhost:3000
```

## Authentification

L'API utilise NextAuth.js pour l'authentification avec plusieurs stratégies :

- **Credentials** : Email/mot de passe
- **Google OAuth** : Connexion via Google
- **JWT Tokens** : Pour les sessions sécurisées

### Headers requis

```http
Authorization: Bearer <token>
Content-Type: application/json
X-CSRF-Token: <csrf-token>
```

## Endpoints

### Authentification

#### POST /api/auth/register

Créer un nouveau compte utilisateur.

**Corps de la requête :**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "0123456789",
  "password": "SecurePass123!"
}
```

**Réponse de succès (201) :**

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "0123456789",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Réponse d'erreur (400) :**

```json
{
  "success": false,
  "errors": [
    "Le mot de passe doit contenir au moins une majuscule",
    "Format d'email invalide"
  ]
}
```

#### POST /api/auth/login

Se connecter avec email et mot de passe.

**Corps de la requête :**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Réponse de succès (200) :**

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  "session": {
    "sessionId": "session_token",
    "refreshToken": "refresh_token"
  }
}
```

#### POST /api/auth/forgot-password

Demander une réinitialisation de mot de passe.

**Corps de la requête :**

```json
{
  "email": "john.doe@example.com"
}
```

**Réponse de succès (200) :**

```json
{
  "success": true,
  "message": "Un email de réinitialisation a été envoyé"
}
```

#### POST /api/auth/reset-password

Réinitialiser le mot de passe avec un token.

**Corps de la requête :**

```json
{
  "token": "reset_token",
  "password": "NewSecurePass123!"
}
```

**Réponse de succès (200) :**

```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès"
}
```

### Prestataires

#### GET /api/providers

Récupérer la liste des prestataires avec pagination et filtres.

**Paramètres de requête :**

- `page` (number) : Numéro de page (défaut: 1)
- `limit` (number) : Nombre d'éléments par page (défaut: 10)
- `search` (string) : Terme de recherche
- `country` (string) : Filtre par pays
- `service` (string) : Filtre par service

**Réponse de succès (200) :**

```json
{
  "success": true,
  "providers": [
    {
      "id": "provider_id",
      "name": "Prestataire Example",
      "description": "Description du prestataire",
      "country": "Cameroun",
      "services": ["Service 1", "Service 2"],
      "rating": 4.5,
      "image": "image_url"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### GET /api/providers/[id]

Récupérer les détails d'un prestataire spécifique.

**Réponse de succès (200) :**

```json
{
  "success": true,
  "provider": {
    "id": "provider_id",
    "name": "Prestataire Example",
    "description": "Description détaillée",
    "country": "Cameroun",
    "city": "Douala",
    "address": "123 Rue Example",
    "phone": "+237123456789",
    "email": "contact@prestataire.com",
    "services": [
      {
        "id": 1,
        "name": "Service 1",
        "description": "Description du service",
        "price": 100,
        "currency": "EUR"
      }
    ],
    "rating": 4.5,
    "reviews": [
      {
        "id": "review_id",
        "userName": "John D.",
        "rating": 5,
        "comment": "Excellent service !",
        "date": "2024-01-15T10:00:00Z"
      }
    ],
    "images": ["image1.jpg", "image2.jpg"]
  }
}
```

### Rendez-vous

#### POST /api/appointments

Créer un nouveau rendez-vous.

**Corps de la requête :**

```json
{
  "providerId": "provider_id",
  "requester": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "0123456789"
  },
  "recipient": {
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "0987654321"
  },
  "timeslot": "2024-01-20T14:00:00Z",
  "selectedService": {
    "id": 1,
    "name": "Service Example",
    "price": 100
  }
}
```

**Réponse de succès (201) :**

```json
{
  "success": true,
  "appointment": {
    "id": "appointment_id",
    "providerId": "provider_id",
    "requester": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "0123456789"
    },
    "recipient": {
      "firstName": "Jane",
      "lastName": "Smith",
      "phone": "0987654321"
    },
    "timeslot": "2024-01-20T14:00:00Z",
    "service": {
      "id": 1,
      "name": "Service Example",
      "price": 100
    },
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### GET /api/appointments

Récupérer les rendez-vous de l'utilisateur connecté.

**Paramètres de requête :**

- `page` (number) : Numéro de page
- `limit` (number) : Nombre d'éléments par page
- `status` (string) : Filtre par statut (pending, confirmed, completed, cancelled)

**Réponse de succès (200) :**

```json
{
  "success": true,
  "appointments": [
    {
      "id": "appointment_id",
      "provider": {
        "id": "provider_id",
        "name": "Prestataire Example"
      },
      "requester": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "recipient": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "timeslot": "2024-01-20T14:00:00Z",
      "service": {
        "name": "Service Example",
        "price": 100
      },
      "status": "pending",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### PUT /api/appointments/[id]

Mettre à jour un rendez-vous.

**Corps de la requête :**

```json
{
  "status": "confirmed",
  "notes": "Notes additionnelles"
}
```

#### DELETE /api/appointments/[id]

Annuler un rendez-vous.

### Paiements

#### POST /api/payments

Traiter un paiement.

**Corps de la requête :**

```json
{
  "appointmentId": "appointment_id",
  "paymentMethod": {
    "type": "card",
    "cardNumber": "4532015112830366",
    "expiryDate": "12/25",
    "cvv": "123",
    "cardholderName": "John Doe"
  }
}
```

**Réponse de succès (200) :**

```json
{
  "success": true,
  "payment": {
    "id": "payment_id",
    "appointmentId": "appointment_id",
    "amount": 100,
    "currency": "EUR",
    "status": "completed",
    "transactionId": "txn_123456",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

## Codes d'erreur

| Code | Description                      |
| ---- | -------------------------------- |
| 200  | Succès                           |
| 201  | Créé avec succès                 |
| 400  | Requête invalide                 |
| 401  | Non autorisé                     |
| 403  | Accès interdit                   |
| 404  | Ressource non trouvée            |
| 409  | Conflit (ex: email déjà utilisé) |
| 422  | Données de validation invalides  |
| 429  | Trop de requêtes (rate limiting) |
| 500  | Erreur serveur interne           |

## Validation des données

Tous les endpoints utilisent Zod pour la validation des données avec les règles suivantes :

### Utilisateurs

- **firstName/lastName** : 2-50 caractères, lettres uniquement
- **email** : Format email valide, max 254 caractères
- **phone** : Format français (+33, 0, ou 33)
- **password** : Min 8 caractères, majuscule, minuscule, chiffre, caractère spécial

### Rendez-vous

- **timeslot** : Date future valide
- **requester/recipient** : Données utilisateur valides
- **selectedService** : Service existant avec prix positif

### Paiements

- **cardNumber** : Algorithme de Luhn valide
- **expiryDate** : Format MM/YY, date future
- **cvv** : 3-4 chiffres

## Sécurité

### Headers de sécurité

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`: Politique stricte
- `Referrer-Policy: strict-origin-when-cross-origin`

### Rate Limiting

- **Login** : 5 tentatives par 15 minutes
- **Register** : 3 tentatives par heure
- **API générale** : 100 requêtes par 15 minutes

### Protection CSRF

Tous les endpoints POST/PUT/DELETE nécessitent un token CSRF valide.

### Sanitisation

Toutes les données d'entrée sont automatiquement sanitizées pour prévenir les attaques XSS.

## Exemples d'utilisation

### JavaScript/TypeScript

```typescript
// Connexion
const loginResponse = await fetch("/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrfToken,
  },
  body: JSON.stringify({
    email: "john.doe@example.com",
    password: "SecurePass123!",
  }),
});

const { user, session } = await loginResponse.json();

// Récupérer les prestataires
const providersResponse = await fetch("/api/providers?page=1&limit=10", {
  headers: {
    Authorization: `Bearer ${session.sessionId}`,
    "X-CSRF-Token": csrfToken,
  },
});

const { providers, pagination } = await providersResponse.json();
```

### cURL

```bash
# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-csrf-token" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'

# Récupérer les prestataires
curl -X GET "http://localhost:3000/api/providers?page=1&limit=10" \
  -H "Authorization: Bearer your-session-token" \
  -H "X-CSRF-Token: your-csrf-token"
```

## Support

Pour toute question ou problème avec l'API, contactez l'équipe technique :

- **Email** : tech@diaspomoney.com
- **Documentation** : https://docs.diaspomoney.com
- **Statut API** : https://status.diaspomoney.com
