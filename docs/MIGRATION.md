# Migration des Dépendances - Diaspomoney

## 📋 Résumé des Changements

Ce document décrit les changements effectués lors de la modernisation des dépendances du projet Diaspomoney.

## ❌ Dépendances Supprimées

### Dépendances obsolètes ou inutiles :

1. **`crypto`** - Module Node.js intégré, pas besoin de l'installer
2. **`@types/mongoose`** - Types intégrés dans Mongoose 8+
3. **`nodemailer-express-handlebars`** - Obsolète, remplacé par React Email
4. **`handlebars`** - Remplacé par React Email
5. **`multer`** - Pas nécessaire pour Next.js API routes
6. **`compression`** - Géré automatiquement par Next.js
7. **`express`** - Pas nécessaire avec Next.js API routes
8. **`cors`** - Géré automatiquement par Next.js
9. **`helmet`** - Remplacé par des headers de sécurité Next.js
10. **`express-rate-limit`** - Remplacé par rate-limiter-flexible

## ✅ Nouvelles Dépendances

### Authentification :

- **`@auth/mongodb-adapter`** - Nouvel adaptateur MongoDB pour Auth.js v5
- **`next-auth@5.0.0-beta.0`** - Mise à jour vers Auth.js v5

### Email moderne :

- **`resend`** - Service d'email moderne et fiable
- **`@react-email/components`** - Composants React pour les emails
- **`react-email`** - Framework pour créer des emails avec React

### Sécurité :

- **`rate-limiter-flexible`** - Rate limiting moderne et flexible
- **`nanoid`** - Génération d'IDs uniques sécurisés

## 🔄 Mises à jour

### Dépendances majeures mises à jour :

- **`next-auth`** : v4 → v5 (Auth.js)
- **`@next-auth/mongodb-adapter`** → **`@auth/mongodb-adapter`**

## 🛠️ Nouveaux Systèmes

### 1. Système de Sécurité Moderne (`lib/security.ts`)

- Rate limiting avec `rate-limiter-flexible`
- Headers de sécurité personnalisés
- Sanitisation des entrées
- Validation des mots de passe
- Protection CSRF

### 2. Système d'Email Moderne (`lib/email.ts`)

- Templates React Email
- Service Resend pour l'envoi
- Emails responsifs et modernes
- Templates pour :
  - Vérification d'email
  - Réinitialisation de mot de passe
  - Confirmation de rendez-vous

### 3. Configuration Auth.js v5 (`config/auth.ts`)

- Nouvelle API Auth.js v5
- Adaptateur MongoDB moderne
- Callbacks optimisés
- Gestion des rôles et statuts

## 📝 Changements dans le Code

### Middleware (`middleware.ts`)

```typescript
// Avant
import { addSecurityHeaders, securityMiddleware } from "./middleware/security";

// Après
import { applySecurityHeaders } from "@/lib/security";
```

### Configuration Auth (`config/auth.ts`)

```typescript
// Avant
import { NextAuthOptions } from "next-auth";
export const authOptions: NextAuthOptions = { ... };

// Après
import { NextAuthConfig } from "next-auth";
export const authConfig: NextAuthConfig = { ... };
```

### Email (`lib/email.ts`)

```typescript
// Avant
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({ ... });

// Après
import { Resend } from "resend";
import { render } from "@react-email/render";
const resend = new Resend(process.env.RESEND_API_KEY);
```

## 🚀 Installation

### 1. Nettoyer et réinstaller

```bash
pnpm clean-install
```

### 2. Configurer les variables d'environnement

```bash
cp env.example .env.local
```

### 3. Variables d'environnement requises

```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/diaspomoney

# Auth.js v5
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
```

## 🔧 Scripts Disponibles

### Nouveaux scripts :

- `pnpm clean-install` - Nettoyer et réinstaller tout
- `pnpm format` - Formater le code avec Prettier
- `pnpm format:check` - Vérifier le formatage
- `pnpm check-imports` - Vérifier les imports problématiques

## ⚠️ Points d'Attention

### 1. Auth.js v5

- Nouvelle API avec des changements breaking
- Adaptateur MongoDB différent
- Callbacks modifiés

### 2. Email

- Migration de Nodemailer vers Resend
- Nouveaux templates React Email
- Configuration Resend requise

### 3. Sécurité

- Headers de sécurité personnalisés
- Rate limiting intégré
- Sanitisation automatique

## 🧪 Tests

### Vérifier que tout fonctionne :

```bash
# Vérifier les imports
pnpm check-imports

# Vérifier la qualité
pnpm quality:check

# Lancer les tests
pnpm test

# Vérifier les types
pnpm type-check
```

## 📚 Documentation

- [Auth.js v5 Documentation](https://authjs.dev/)
- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/)
- [Rate Limiter Flexible](https://github.com/animir/node-rate-limiter-flexible)

## 🆘 Support

En cas de problème :

1. Vérifier les variables d'environnement
2. Consulter les logs d'erreur
3. Vérifier la compatibilité des versions
4. Consulter la documentation des nouvelles dépendances
