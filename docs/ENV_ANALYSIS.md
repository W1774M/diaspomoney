# Analyse des Variables d'Environnement - Production

## 📋 Variables NÉCESSAIRES en Production

### 🔐 Authentication & Security
```bash
# OBLIGATOIRE - Secret pour JWT/Session (min 32 caractères)
AUTH_SECRET=votre-secret-tres-long-et-aleatoire-min-32-chars
NEXTAUTH_SECRET=votre-secret-tres-long-et-aleatoire-min-32-chars

# OBLIGATOIRE - URL de l'application en production
NEXTAUTH_URL=https://app.diaspomoney.fr
NEXT_PUBLIC_API_URL=https://app.diaspomoney.fr
```

### 🗄️ Database MongoDB
```bash
# OBLIGATOIRE - URI MongoDB avec authentification
# IMPORTANT: Utilisez "mongodb" comme hostname (nom du service Docker)
MONGODB_URI=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/diaspomoney?authSource=admin

# OBLIGATOIRE - Credentials MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_PASSWORD=votre-mot-de-passe-mongo-securise
```

### 💾 Cache Redis
```bash
# OBLIGATOIRE - URL Redis
# IMPORTANT: Utilisez "redis" comme hostname (nom du service Docker)
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
REDIS_PASSWORD=votre-mot-de-passe-redis-securise
```

### 🔑 OAuth Providers
```bash
# OBLIGATOIRE pour Google Login
GOOGLE_CLIENT_ID=votre-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-google-client-secret

# OBLIGATOIRE pour Facebook Login
FACEBOOK_CLIENT_ID=votre-facebook-app-id
FACEBOOK_CLIENT_SECRET=votre-facebook-app-secret
```

### 📊 Monitoring
```bash
# OBLIGATOIRE pour Grafana
GRAFANA_PASSWORD=votre-mot-de-passe-grafana-admin
```

### 🛠️ Mongo Express (Admin Tool)
```bash
# OBLIGATOIRE pour accéder à Mongo Express
ME_CONFIG_MONGODB_ADMINUSERNAME=admin
ME_CONFIG_MONGODB_ADMINPASSWORD=${MONGO_PASSWORD}
ME_CONFIG_MONGODB_URL=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/
ME_CONFIG_BASICAUTH_USERNAME=admin
ME_CONFIG_BASICAUTH_PASSWORD=votre-mot-de-passe-mongo-express
```

---

## ❌ Variables INUTILES en Production

### Variables de Développement
```bash
# Ne PAS inclure en production
NEXT_PUBLIC_DEV_MODE=true
DEBUG=*
AUTH_DEBUG=true  # Seulement si vous déboguez
```

### Variables Vercel/Hosting Externe
```bash
# Ne PAS inclure si vous utilisez Docker Compose
VERCEL_URL=...
VERCEL_ENV=...
```

### Variables de Test
```bash
# Ne PAS inclure en production
TEST_DATABASE_URL=...
CI=true
```

---

## ⚠️ Variables OPTIONNELLES

### Debug (temporaire)
```bash
# Utile temporairement pour déboguer, puis supprimer
AUTH_DEBUG=false
NODE_ENV=production  # Défini automatiquement par Dockerfile
```

### Email/SMTP (si vous envoyez des emails)
```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password
SMTP_FROM=noreply@diaspomoney.fr
```

### Paiements (si vous utilisez Stripe/PayPal)
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

---

## ✅ Template .env Minimal pour Production

```bash
# ===================================
# PRODUCTION ENVIRONMENT
# ===================================

# Application
NODE_ENV=production
NEXTAUTH_URL=https://app.diaspomoney.fr
NEXT_PUBLIC_API_URL=https://app.diaspomoney.fr

# Security
AUTH_SECRET=CHANGEZ_MOI_SECRET_ALEATOIRE_32_CHARS_MINIMUM_ICI_123456789
NEXTAUTH_SECRET=CHANGEZ_MOI_SECRET_ALEATOIRE_32_CHARS_MINIMUM_ICI_123456789

# Database
MONGODB_URI=mongodb://admin:VOTRE_MONGO_PASSWORD@mongodb:27017/diaspomoney?authSource=admin
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_PASSWORD=CHANGEZ_MOI_MONGO_PASSWORD

# Cache
REDIS_URL=redis://:VOTRE_REDIS_PASSWORD@redis:6379
REDIS_PASSWORD=CHANGEZ_MOI_REDIS_PASSWORD

# OAuth Google
GOOGLE_CLIENT_ID=votre-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-votre-secret

# OAuth Facebook
FACEBOOK_CLIENT_ID=votre-app-id
FACEBOOK_CLIENT_SECRET=votre-app-secret

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

## 🔍 Vérifications Importantes

### 1. Hostnames Docker
✅ **CORRECT** (utilise les noms de services Docker):
```bash
MONGODB_URI=mongodb://admin:password@mongodb:27017/...
REDIS_URL=redis://:password@redis:6379
```

❌ **INCORRECT** (localhost ne fonctionne pas dans Docker):
```bash
MONGODB_URI=mongodb://localhost:27017/...
REDIS_URL=redis://localhost:6379
```

### 2. Secrets
- Utilisez des mots de passe forts (min 32 caractères)
- Ne réutilisez JAMAIS les secrets entre environnements
- Générez avec: `openssl rand -base64 32`

### 3. OAuth Callbacks

#### 📍 URLs de callback à configurer

**Production:**
- **Google**: `https://app.diaspomoney.fr/api/auth/callback/google`
- **Facebook**: `https://app.diaspomoney.fr/api/auth/callback/facebook`

**Développement (optionnel):**
- **Google**: `http://localhost:3000/api/auth/callback/google`
- **Facebook**: `http://localhost:3000/api/auth/callback/facebook`

#### 🔵 Configuration Google Cloud Console

1. **Accédez** à [Google Cloud Console](https://console.cloud.google.com/)
2. **Sélectionnez** votre projet (ou créez-en un nouveau)
3. **Activez** l'API "Google+ API" ou "Google Identity" si ce n'est pas déjà fait:
   - Allez dans "APIs & Services" > "Library"
   - Recherchez "Google+ API" ou "Google Identity"
   - Cliquez sur "Enable"
4. **Créez** les credentials OAuth 2.0:
   - Allez dans "APIs & Services" > "Credentials"
   - Cliquez sur "Create Credentials" > "OAuth 2.0 Client ID"
   - Si demandé, configurez l'écran de consentement OAuth d'abord
5. **Configurez** le client OAuth:
   - Type d'application: **"Web application"**
   - **Name**: DiaspoMoney Production (ou votre nom)
   - **Authorized JavaScript origins** (ajoutez les deux):
     ```
     https://app.diaspomoney.fr
     http://localhost:3000  (pour développement)
     ```
   - **Authorized redirect URIs** (ajoutez les deux):
     ```
     https://app.diaspomoney.fr/api/auth/callback/google
     http://localhost:3000/api/auth/callback/google  (pour développement)
     ```
6. **Copiez** les credentials:
   - `GOOGLE_CLIENT_ID` (format: `xxx.apps.googleusercontent.com`)
   - `GOOGLE_CLIENT_SECRET` (format: `GOCSPX-xxx`)
   - ⚠️ **Important**: Ne partagez jamais ces valeurs publiquement

#### 🔵 Configuration Facebook Developer Console

1. **Accédez** à [Facebook Developers](https://developers.facebook.com/)
2. **Sélectionnez** votre application (ou créez-en une nouvelle):
   - Cliquez sur "My Apps" > "Create App"
   - Type: "Consumer" ou "Business"
   - Remplissez le formulaire de création
3. **Activez** Facebook Login:
   - Dans le menu de gauche, allez dans "Products"
   - Trouvez "Facebook Login" et cliquez sur "Set Up"
4. **Configurez** Facebook Login:
   - Allez dans "Facebook Login" > "Settings"
   - Dans la section **"Valid OAuth Redirect URIs"**, ajoutez:
     ```
     https://app.diaspomoney.fr/api/auth/callback/facebook
     http://localhost:3000/api/auth/callback/facebook  (pour développement)
     ```
   - Sauvegardez les modifications
5. **Récupérez** les credentials:
   - Allez dans "Settings" > "Basic"
   - **App ID** → `FACEBOOK_CLIENT_ID`
   - **App Secret** → `FACEBOOK_CLIENT_SECRET` (cliquez sur "Show" pour le révéler)
   - ⚠️ **Important**: Ne partagez jamais l'App Secret publiquement

#### ✅ Vérifications après configuration

1. **Vérifiez** que les URLs sont exactement identiques (sans slash final, avec `https://`)
2. **Testez** la connexion OAuth:
   - Google: Allez sur `/login` et cliquez sur "Continuer avec Google"
   - Facebook: Allez sur `/login` et cliquez sur "Continuer avec Facebook"
3. **Vérifiez** les logs en cas d'erreur:
   ```bash
   # Erreur commune: "Redirect URI mismatch"
   # → Vérifiez que l'URL dans la console est EXACTEMENT la même
   
   # Erreur commune: "Invalid client"
   # → Vérifiez que GOOGLE_CLIENT_ID / FACEBOOK_CLIENT_ID sont corrects
   ```

#### ⚠️ Notes importantes

- Les URLs de callback sont **sensibles à la casse** et doivent être **exactement identiques**
- Pour la production, utilisez **TOUJOURS `https://`** (jamais `http://`)
- Les URLs doivent être configurées **AVANT** d'utiliser l'authentification OAuth
- Si vous changez de domaine, mettez à jour les URLs dans les deux consoles
- Pour le développement local, vous pouvez créer des applications séparées ou utiliser les mêmes avec les URLs localhost

---

## 🔐 Génération de Secrets Sécurisés

```bash
# Générer AUTH_SECRET
openssl rand -base64 32

# Générer MONGO_PASSWORD
openssl rand -base64 24

# Générer REDIS_PASSWORD
openssl rand -base64 24

# Générer GRAFANA_PASSWORD
openssl rand -base64 16
```

