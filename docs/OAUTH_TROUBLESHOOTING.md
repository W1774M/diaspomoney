# Guide de dépannage OAuth - DiaspoMoney

## Problème: Redirection vers /api/auth/error

Si vous êtes redirigé vers `/api/auth/error` lors de la connexion avec Google ou Facebook, suivez ce guide.

## Causes communes

### 1. Variables d'environnement manquantes ou incorrectes

**Vérifier les variables requises:**

```bash
# En production sur app.diaspomoney.fr
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
FACEBOOK_CLIENT_ID=xxx
FACEBOOK_CLIENT_SECRET=xxx
AUTH_SECRET=xxx  # ou NEXTAUTH_SECRET
NEXTAUTH_URL=https://app.diaspomoney.fr
MONGODB_URI=mongodb://...
```

**Vérifier la configuration:**
```bash
# SSH dans le serveur
ssh user@app.diaspomoney.fr

# Vérifier les variables d'environnement (sans afficher les valeurs sensibles)
env | grep -E "(GOOGLE|FACEBOOK|AUTH|NEXTAUTH)" | sed 's/=.*/=***/'
```

### 2. URL de redirection OAuth non configurée

**Google Cloud Console:**
1. Aller sur https://console.cloud.google.com
2. Sélectionner votre projet
3. Aller dans "APIs & Services" > "Credentials"
4. Cliquer sur votre OAuth 2.0 Client ID
5. Ajouter ces URIs de redirection autorisés:
   ```
   https://app.diaspomoney.fr/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google  (pour dev)
   ```

**Facebook Developer Console:**
1. Aller sur https://developers.facebook.com
2. Sélectionner votre app
3. Aller dans "Facebook Login" > "Settings"
4. Ajouter ces Valid OAuth Redirect URIs:
   ```
   https://app.diaspomoney.fr/api/auth/callback/facebook
   http://localhost:3000/api/auth/callback/facebook  (pour dev)
   ```

### 3. Problème de connexion MongoDB

**Vérifier la connexion:**
```bash
# Test de connexion MongoDB
node -e "const { MongoClient } = require('mongodb'); const client = new MongoClient(process.env.MONGODB_URI); client.connect().then(() => { console.log('✅ MongoDB connecté'); client.close(); }).catch(err => console.error('❌ Erreur:', err));"
```

### 4. Secret NextAuth manquant ou invalide

**Générer un nouveau secret:**
```bash
# Générer un secret fort
openssl rand -base64 32
```

Ajouter dans `.env.production`:
```
AUTH_SECRET=<le_secret_généré>
```

## Debugging en temps réel

### 1. Activer les logs de debug

Ajouter dans `.env.production`:
```
AUTH_DEBUG=true
NODE_ENV=production
```

### 2. Voir les logs en temps réel

```bash
# Logs Docker (si vous utilisez Docker)
docker logs -f diaspomoney-app --tail=100

# Ou logs PM2
pm2 logs diaspomoney --lines 100

# Ou logs Next.js
tail -f .next/trace
```

### 3. Logs spécifiques à chercher

Les logs commenceront par `[AUTH][signIn]`:
```
[AUTH][signIn] Starting signIn callback
[AUTH][signIn] user= { ... }
[AUTH][signIn] account= { ... }
[AUTH][signIn] Connecting to MongoDB...
[AUTH][signIn] Existing user found: Yes/No
```

Si vous voyez `[AUTH][signIn] FATAL ERROR:`, c'est là que se trouve le problème.

## Solutions rapides

### Redémarrer le serveur

```bash
# Docker
docker restart diaspomoney-app

# PM2
pm2 restart diaspomoney

# Next.js dev
npm run build && npm start
```

### Vider le cache

```bash
rm -rf .next
npm run build
```

### Tester en local d'abord

```bash
# Copier les variables d'environnement de production
cp .env.production .env.local

# Modifier pour pointer vers localhost
# NEXTAUTH_URL=http://localhost:3000

# Lancer en dev
npm run dev
```

## Page d'erreur personnalisée

Une page d'erreur personnalisée a été créée à `/app/api/auth/error/page.tsx` qui affiche:
- Le type d'erreur
- Une description claire
- Des boutons pour retourner à la connexion ou à l'accueil

## Erreurs communes et solutions

| Code d'erreur | Signification | Solution |
|---------------|---------------|----------|
| `Configuration` | Variables d'environnement manquantes | Vérifier GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc. |
| `AccessDenied` | L'utilisateur a refusé l'accès | Normal si l'utilisateur clique "Annuler" |
| `OAuthCallback` | Erreur lors du callback | Vérifier les URLs de redirection |
| `OAuthCreateAccount` | Impossible de créer le compte | Vérifier MongoDB et les logs |
| `OAuthAccountNotLinked` | Compte existant avec autre provider | L'email existe déjà |

## Test de la configuration

Créer un fichier `test-oauth.js`:

```javascript
const https = require('https');

// Test Google OAuth
const testGoogleOAuth = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = 'https://app.diaspomoney.fr/api/auth/callback/google';
  
  console.log('Testing Google OAuth...');
  console.log('Client ID:', clientId ? '✅ Set' : '❌ Missing');
  console.log('Redirect URI:', redirectUri);
  console.log('\\nManual test URL:');
  console.log(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile`);
};

testGoogleOAuth();
```

Exécuter:
```bash
node test-oauth.js
```

## Contact support

Si le problème persiste après avoir suivi ce guide:

1. Collecter les logs
2. Noter l'heure exacte de l'erreur
3. Noter le provider utilisé (Google/Facebook)
4. Contacter le support avec ces informations

## Checklist rapide

- [ ] Variables d'environnement présentes et correctes
- [ ] URLs de redirection configurées dans Google/Facebook Console
- [ ] MongoDB accessible et fonctionnel
- [ ] AUTH_SECRET défini
- [ ] NEXTAUTH_URL correct (https://app.diaspomoney.fr)
- [ ] Serveur redémarré après changements
- [ ] Logs vérifiés pour erreurs spécifiques
- [ ] Test en local fonctionne

