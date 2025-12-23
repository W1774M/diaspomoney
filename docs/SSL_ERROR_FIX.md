# 🔒 Correction de l'erreur SSL sur localhost

## ❌ Erreur rencontrée

```
ERR_SSL_PROTOCOL_ERROR
Ce site ne peut pas fournir de connexion sécurisée
localhost a envoyé une réponse incorrecte.
```

## 🔍 Cause

Cette erreur se produit lorsque le navigateur essaie d'accéder à `https://localhost:3000` alors que Next.js en développement tourne en **HTTP** sur `http://localhost:3000`.

## ✅ Solutions

### Solution 1 : Utiliser HTTP au lieu de HTTPS (Recommandé)

**Accédez à l'application avec HTTP :**
```
http://localhost:3000
```

**⚠️ Important :** Assurez-vous d'utiliser `http://` et non `https://`

### Solution 2 : Nettoyer le cache HSTS du navigateur

Si votre navigateur force HTTPS à cause de HSTS (HTTP Strict Transport Security) :

#### Chrome/Edge :
1. Allez à `chrome://net-internals/#hsts`
2. Dans "Delete domain security policies", entrez `localhost`
3. Cliquez sur "Delete"

#### Firefox :
1. Allez à `about:config`
2. Recherchez `security.tls.insecure_fallback_hosts`
3. Ajoutez `localhost` à la liste

#### Ou supprimez les données de navigation :
- Chrome/Edge : `Ctrl+Shift+Delete` → Cochez "Cookies et autres données de sites"
- Firefox : `Ctrl+Shift+Delete` → Cochez "Cookies"

### Solution 3 : Utiliser un port différent

Si le problème persiste, changez le port :

```bash
pnpm dev -- -p 3001
```

Puis accédez à : `http://localhost:3001`

### Solution 4 : Vérifier les variables d'environnement

Assurez-vous que `NEXT_PUBLIC_APP_URL` est en HTTP pour le développement :

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

## 🚀 Configuration recommandée pour le développement

Dans votre `.env` ou `.env.local` :

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

## 📝 Note

Le middleware `proxy.ts` ne redirige **PAS** localhost vers HTTPS. Il ne redirige que les domaines (`diaspomoney.fr`, `dev.diaspomoney.fr`, `rct.diaspomoney.fr`) vers HTTPS.

Si vous voyez toujours une redirection HTTPS sur localhost, c'est probablement :
- Le navigateur qui force HTTPS (HSTS)
- Une extension de navigateur
- Un proxy/VPN qui force HTTPS

## 🔧 Vérification rapide

1. **Vérifiez l'URL dans la barre d'adresse** : doit être `http://localhost:3000`
2. **Vérifiez que le serveur tourne** : `pnpm dev` doit afficher "Ready on http://localhost:3000"
3. **Testez dans un navigateur en navigation privée** : cela évite les problèmes de cache

