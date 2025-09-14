# 📁 Structure API - Diaspomoney

## 🎯 Vue d'ensemble

Toutes les API routes sont maintenant centralisées dans `app/api/` selon les conventions Next.js 13+ App Router.

## 📂 Structure des API Routes

```
app/api/
├── auth/                          # Authentification
│   ├── [...nextauth]/             # NextAuth.js v5
│   ├── login/                     # Connexion
│   ├── register/                  # Inscription
│   ├── forgot-password/           # Mot de passe oublié
│   ├── reset-password/            # Réinitialisation mot de passe
│   └── verify-email/              # Vérification email
├── appointments/                  # Gestion des rendez-vous
├── providers/                     # Gestion des prestataires
├── send-confirmation/             # Envoi de confirmations
├── send-payment-error/            # Gestion des erreurs de paiement
├── validate-retry-token/          # Validation des tokens de retry
└── test/                          # Tests de connexion MongoDB
```

## 🔄 Migration Effectuée

### ❌ Supprimé

- `app/dashboard/api/` - Répertoire API dupliqué dans dashboard

### ✅ Déplacé

- `app/dashboard/api/test/route.ts` → `app/api/test/route.ts`
- Configuration NextAuth consolidée dans `app/api/auth/[...nextauth]/route.ts`

### 🎯 Avantages

1. **Structure standardisée** : Toutes les API routes au même endroit
2. **Pas de duplication** : Évite la confusion entre plusieurs endpoints
3. **Maintenance simplifiée** : Un seul endroit pour gérer les API
4. **Conformité Next.js** : Respect des conventions App Router

## 🔗 Endpoints Disponibles

### Authentification

- `GET/POST /api/auth/[...nextauth]` - NextAuth.js
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/forgot-password` - Mot de passe oublié
- `POST /api/auth/reset-password` - Réinitialisation
- `POST /api/auth/verify-email` - Vérification email

### Gestion des Données

- `GET/POST /api/appointments` - Rendez-vous
- `GET/POST /api/providers` - Prestataires

### Utilitaires

- `GET /api/test` - Test de connexion MongoDB
- `POST /api/send-confirmation` - Envoi de confirmations
- `POST /api/send-payment-error` - Gestion erreurs paiement
- `POST /api/validate-retry-token` - Validation tokens

## 🧪 Test de Connexion

Pour tester la connexion MongoDB :

```bash
curl http://localhost:3000/api/test
```

Réponse attendue :

```json
{
  "success": true,
  "message": "MongoDB connection successful",
  "data": { "userCount": 0 },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Configuration

### Variables d'environnement requises

```env
MONGODB_URI=mongodb://localhost:27017/diaspomoney
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### Middleware

- Sécurité appliquée via `middleware.ts`
- Rate limiting et headers de sécurité
- CORS configuré automatiquement

## 📝 Bonnes Pratiques

1. **Toujours utiliser** `app/api/` pour les nouvelles API routes
2. **Éviter la duplication** d'endpoints
3. **Utiliser les types** définis dans `types/index.ts`
4. **Gérer les erreurs** avec des réponses standardisées
5. **Tester les endpoints** avant le déploiement

## 🚀 Développement

### Ajouter une nouvelle API route

1. Créer le dossier dans `app/api/`
2. Ajouter `route.ts` avec les méthodes HTTP
3. Utiliser les types et utilitaires existants
4. Tester l'endpoint

### Exemple de structure

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export async function GET(): Promise<NextResponse<ApiResponse>> {
  // Logique de l'API
}
```
