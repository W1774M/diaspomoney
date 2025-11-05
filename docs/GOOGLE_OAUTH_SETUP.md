# 🔐 Configuration Google OAuth - DiaspoMoney

## 📋 **Vue d'ensemble**

Ce guide explique comment configurer l'authentification Google OAuth pour DiaspoMoney.

## 🚀 **Étapes de configuration**

### **1. Créer un projet Google Cloud Console**

1. **Accédez** à [Google Cloud Console](https://console.cloud.google.com/)
2. **Créez** un nouveau projet ou sélectionnez un projet existant
3. **Activez** l'API Google+ (ou Google Identity)

### **2. Configurer OAuth 2.0**

1. **Allez** dans "APIs & Services" > "Credentials"
2. **Cliquez** sur "Create Credentials" > "OAuth 2.0 Client IDs"
3. **Sélectionnez** "Web application"
4. **Configurez** les URLs autorisées :
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`

### **3. Variables d'environnement**

Ajoutez ces variables à votre fichier `.env` :

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# NextAuth (déjà configuré)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here
```

### **4. Configuration pour différents environnements**

#### **Développement**

```bash
GOOGLE_CLIENT_ID=your-dev-client-id
GOOGLE_CLIENT_SECRET=your-dev-client-secret
NEXTAUTH_URL=http://localhost:3000
```

#### **Production**

```bash
GOOGLE_CLIENT_ID=your-prod-client-id
GOOGLE_CLIENT_SECRET=your-prod-client-secret
NEXTAUTH_URL=https://app.diaspomoney.fr
```

## 🔧 **Configuration technique**

### **URLs de redirection configurées**

- **Développement**: `http://localhost:3000/api/auth/callback/google`
- **Production**: `https://app.diaspomoney.fr/api/auth/callback/google`

### **Scopes Google OAuth**

Les scopes suivants sont automatiquement demandés :

- `openid` - Identité de base
- `email` - Adresse email
- `profile` - Informations de profil

## 🧪 **Test de la configuration**

### **1. Vérifier les providers**

```bash
curl http://localhost:3000/api/auth/providers
```

Vous devriez voir :

```json
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth",
    "signinUrl": "http://localhost:3000/api/auth/signin/google",
    "callbackUrl": "http://localhost:3000/api/auth/callback/google"
  }
}
```

### **2. Tester la connexion**

1. **Accédez** à `http://localhost:3000/login`
2. **Cliquez** sur "Continuer avec Google"
3. **Suivez** le processus d'authentification Google
4. **Vérifiez** que vous êtes redirigé vers le dashboard

## 🔍 **Débogage**

### **Logs utiles**

Les logs suivants apparaissent dans la console :

```bash
[AUTH] SignIn callback: { email: 'user@example.com', provider: 'google' }
[AUTH] Creating new user from Google OAuth
[AUTH] New user created: ObjectId('...')
```

### **Problèmes courants**

#### **1. "Invalid client"**

- ✅ Vérifiez que `GOOGLE_CLIENT_ID` est correct
- ✅ Vérifiez que l'URL de redirection est configurée dans Google Console

#### **2. "Redirect URI mismatch"**

- ✅ Ajoutez `http://localhost:3000/api/auth/callback/google` dans Google Console
- ✅ Pour la production : `https://app.diaspomoney.fr/api/auth/callback/google`

#### **3. "Access blocked"**

- ✅ Vérifiez que l'API Google+ est activée
- ✅ Vérifiez que le projet Google Cloud est actif

## 🛡️ **Sécurité**

### **Bonnes pratiques**

1. **Ne jamais commiter** les vraies clés dans le code
2. **Utiliser des secrets** pour les variables d'environnement
3. **Rotation régulière** des clés OAuth
4. **Limiter les scopes** aux besoins minimum

### **Configuration sécurisée**

```bash
# Variables sensibles dans .env (jamais commiter)
GOOGLE_CLIENT_ID=your-real-client-id
GOOGLE_CLIENT_SECRET=your-real-client-secret

# Variables publiques dans .env.example
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## 📊 **Gestion des utilisateurs OAuth**

### **Création automatique**

Lors de la première connexion Google :

1. **Vérification** si l'utilisateur existe déjà
2. **Création** automatique d'un compte avec les données Google
3. **Attribution** du rôle "customer" par défaut
4. **Sauvegarde** des informations OAuth

### **Structure utilisateur**

```javascript
{
  email: "user@gmail.com",
  name: "John Doe",
  firstName: "John",
  lastName: "Doe",
  image: "https://lh3.googleusercontent.com/...",
  emailVerified: true,
  provider: "google",
  providerAccountId: "123456789",
  role: "customer",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

## 🚀 **Déploiement**

### **Variables d'environnement de production**

```bash
# Production
GOOGLE_CLIENT_ID=your-prod-client-id
GOOGLE_CLIENT_SECRET=your-prod-client-secret
NEXTAUTH_URL=https://app.diaspomoney.fr
NEXTAUTH_SECRET=your-production-secret
```

### **URLs de redirection de production**

Dans Google Cloud Console, ajoutez :

- `https://app.diaspomoney.fr/api/auth/callback/google`

## 📝 **Documentation supplémentaire**

- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Version:** 1.0  
**Dernière mise à jour:** $(date)  
**Auteur:** Équipe DiaspoMoney
