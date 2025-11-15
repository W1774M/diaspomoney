# ✅ Checklist Variables d'Environnement - Production

## 🟢 OBLIGATOIRES (L'app ne démarre pas sans elles)

```bash
# Authentication - CRITIQUE
AUTH_SECRET=                     # Min 32 caractères
NEXTAUTH_SECRET=                 # Min 32 caractères (peut être identique à AUTH_SECRET)
NEXTAUTH_URL=https://app.diaspomoney.fr

# Database - CRITIQUE
MONGODB_URI=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/diaspomoney?authSource=admin
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_PASSWORD=                  # Mot de passe fort

# Cache - CRITIQUE
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
REDIS_PASSWORD=                  # Mot de passe fort
```

## 🟡 NÉCESSAIRES (Pour fonctionnalités OAuth)

```bash
# Google Login - NÉCESSAIRE si vous utilisez Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Facebook Login - NÉCESSAIRE si vous utilisez Facebook
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

## 🟠 MONITORING (Recommandé en production)

```bash
# Grafana - Pour le monitoring
GRAFANA_PASSWORD=

# Mongo Express - Pour l'admin database
ME_CONFIG_MONGODB_ADMINUSERNAME=admin
ME_CONFIG_MONGODB_ADMINPASSWORD=${MONGO_PASSWORD}
ME_CONFIG_MONGODB_URL=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/
ME_CONFIG_BASICAUTH_USERNAME=admin
ME_CONFIG_BASICAUTH_PASSWORD=
```

## 🔵 OPTIONNELLES (Développement)

```bash
# Debug - OPTIONNEL (mettre à false en prod)
AUTH_DEBUG=false
NODE_ENV=production              # Défini automatiquement par Dockerfile

# Public URL - OPTIONNEL (si différent de NEXTAUTH_URL)
NEXT_PUBLIC_API_URL=https://app.diaspomoney.fr
```

## 🔴 INUTILES / À SUPPRIMER

```bash
# ❌ Variables de développement local
DATABASE_URL=postgres://...      # Si vous n'utilisez pas Postgres
DEV_MODE=true
DEBUG=*

# ❌ Variables Vercel (inutiles avec Docker)
VERCEL_URL=
VERCEL_ENV=
VERCEL_GIT_COMMIT_SHA=

# ❌ Variables de test
TEST_DATABASE_URL=
CI=true
NODE_ENV=test

# ❌ Anciens providers non utilisés
GITHUB_ID=                       # Si vous n'utilisez pas GitHub OAuth
TWITTER_ID=                      # Si vous n'utilisez pas Twitter OAuth

# ❌ Services externes non configurés
STRIPE_SECRET_KEY=               # Si vous n'utilisez pas Stripe
SENDGRID_API_KEY=                # Si vous n'utilisez pas SendGrid
AWS_ACCESS_KEY_ID=               # Si vous n'utilisez pas AWS
```

---

## 📝 Template .env Minimal (Production)

Voici le strict minimum pour démarrer en production:

```bash
# ============================================
# CONFIGURATION MINIMALE PRODUCTION
# ============================================

# Application
NEXTAUTH_URL=https://app.diaspomoney.fr

# Security
AUTH_SECRET=CHANGEZ_MOI_SECRET_32_CARACTERES_MINIMUM_RANDOM
NEXTAUTH_SECRET=CHANGEZ_MOI_SECRET_32_CARACTERES_MINIMUM_RANDOM

# Database MongoDB
MONGODB_URI=mongodb://admin:VOTRE_MONGO_PASSWORD@mongodb:27017/diaspomoney?authSource=admin
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_PASSWORD=CHANGEZ_MOI_MONGO_PASSWORD

# Cache Redis
REDIS_URL=redis://:VOTRE_REDIS_PASSWORD@redis:6379
REDIS_PASSWORD=CHANGEZ_MOI_REDIS_PASSWORD

# OAuth Google (si utilisé)
GOOGLE_CLIENT_ID=votre-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-votre-secret

# OAuth Facebook (si utilisé)
FACEBOOK_CLIENT_ID=votre-app-id
FACEBOOK_CLIENT_SECRET=votre-secret

# Monitoring
GRAFANA_PASSWORD=CHANGEZ_MOI_GRAFANA_PASSWORD

# Mongo Express
ME_CONFIG_MONGODB_ADMINUSERNAME=admin
ME_CONFIG_MONGODB_ADMINPASSWORD=${MONGO_PASSWORD}
ME_CONFIG_MONGODB_URL=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/
ME_CONFIG_BASICAUTH_USERNAME=admin
ME_CONFIG_BASICAUTH_PASSWORD=CHANGEZ_MOI_MONGO_EXPRESS_PASSWORD
```

---

## 🔐 Générer des Secrets Sécurisés

```bash
# AUTH_SECRET / NEXTAUTH_SECRET
openssl rand -base64 32

# MONGO_PASSWORD
openssl rand -base64 24

# REDIS_PASSWORD
openssl rand -base64 24

# GRAFANA_PASSWORD
openssl rand -base64 16

# ME_CONFIG_BASICAUTH_PASSWORD
openssl rand -base64 16
```

---

## ⚠️ Erreurs Communes

### ❌ Hostname "localhost"
```bash
# INCORRECT
MONGODB_URI=mongodb://localhost:27017/diaspomoney

# CORRECT (Docker)
MONGODB_URI=mongodb://admin:password@mongodb:27017/diaspomoney?authSource=admin
```

### ❌ Secret trop court
```bash
# INCORRECT (trop court)
AUTH_SECRET=secret123

# CORRECT (min 32 caractères)
AUTH_SECRET=votre-secret-aleatoire-minimum-32-caracteres-ici
```

### ❌ URL sans protocole
```bash
# INCORRECT
NEXTAUTH_URL=app.diaspomoney.fr

# CORRECT
NEXTAUTH_URL=https://app.diaspomoney.fr
```

### ❌ Mélange dev/prod
```bash
# INCORRECT (mix local + docker)
MONGODB_URI=mongodb://localhost:27017/diaspomoney  # Local
REDIS_URL=redis://redis:6379                       # Docker

# CORRECT (tout en Docker)
MONGODB_URI=mongodb://admin:password@mongodb:27017/diaspomoney?authSource=admin
REDIS_URL=redis://:password@redis:6379
```

---

## 🎯 Vérification Rapide

Vérifiez votre `.env` avec ces commandes:

```bash
# Vérifier que les variables critiques existent
grep -E "AUTH_SECRET|MONGODB_URI|REDIS_URL|GOOGLE_CLIENT" .env

# Vérifier que MongoDB utilise le bon hostname
grep MONGODB_URI .env | grep -q "mongodb:27017" && echo "✅ OK" || echo "❌ Utilise localhost?"

# Vérifier la longueur du secret
grep AUTH_SECRET .env | awk -F= '{print length($2)}'
# Doit retourner >= 32

# Compter le nombre de variables
wc -l .env
```

---

## 📊 Statistiques Recommandées

Pour une application production complète:

- **Minimum vital:** 10 variables (auth + database + cache)
- **Recommandé:** 15-20 variables (+ OAuth + monitoring)
- **Maximum utile:** 25-30 variables (+ tous les services)

**Plus de 30 variables = probablement des variables inutiles à nettoyer**

---

## ✅ Validation Finale

Avant le déploiement, vérifiez:

- [ ] Aucune variable avec `localhost`
- [ ] Tous les secrets font 32+ caractères
- [ ] Toutes les URLs ont `https://`
- [ ] OAuth callbacks configurés dans les consoles
- [ ] Pas de variables de test/dev
- [ ] Pas de secrets par défaut (ex: "password123")
- [ ] Variables MongoDB/Redis utilisent les noms de services Docker

**Si toutes les cases sont cochées, vous êtes prêt à déployer ! 🚀**

