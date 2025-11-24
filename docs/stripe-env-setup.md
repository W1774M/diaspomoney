# Configuration des variables d'environnement Stripe

## ⚠️ Problème courant : La clé publique Stripe n'est pas détectée

### Cause

Dans Next.js, les variables d'environnement accessibles côté client (dans les composants `"use client"`) **doivent avoir le préfixe `NEXT_PUBLIC_`**.

Si vous utilisez `STRIPE_PUBLISHABLE_KEY` sans le préfixe, elle ne sera **pas accessible** dans les composants React côté client.

## ✅ Solution

### 1. Ajouter la variable avec le préfixe NEXT_PUBLIC_

Dans votre fichier `.env` ou `.env.local`, ajoutez :

```bash
# ✅ CORRECT - Accessible côté client
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# ❌ INCORRECT - Non accessible côté client (uniquement serveur)
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

### 2. Redémarrer le serveur de développement

**Important** : Après avoir modifié les variables d'environnement, vous devez **redémarrer** le serveur Next.js :

```powershell
# Arrêter le serveur (Ctrl+C)
# Puis relancer
pnpm dev
```

Next.js charge les variables d'environnement au démarrage, pas à chaud.

### 3. Vérifier la configuration

Le code vérifie maintenant automatiquement les deux variables pour compatibilité :

```typescript
// Le code vérifie d'abord NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
// Puis STRIPE_PUBLISHABLE_KEY en fallback
const publishableKey = process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"] || 
                        process.env["STRIPE_PUBLISHABLE_KEY"];
```

## 📋 Variables Stripe complètes

### Variables côté client (avec NEXT_PUBLIC_)

```bash
# Clé publique Stripe (accessible dans les composants React)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Variables côté serveur (sans NEXT_PUBLIC_)

```bash
# Clé secrète Stripe (UNIQUEMENT côté serveur)
STRIPE_SECRET_KEY=sk_test_...

# Secret webhook (UNIQUEMENT côté serveur)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🔍 Vérification

### 1. Vérifier dans le navigateur

Ouvrez la console du navigateur (F12) et tapez :

```javascript
// Devrait afficher votre clé (commençant par pk_test_ ou pk_live_)
console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
```

### 2. Vérifier dans les logs

Le composant `StripeCheckout` log automatiquement la présence de la clé :

```typescript
logger.info({ 
  hasNextPublicKey: !!process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
  hasStripeKey: !!process.env["STRIPE_PUBLISHABLE_KEY"],
}, "Stripe publishable key check");
```

### 3. Vérifier le fichier .env

Assurez-vous que :
- ✅ Le fichier `.env` ou `.env.local` existe à la racine du projet
- ✅ La variable `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` est définie
- ✅ Il n'y a pas d'espaces autour du `=`
- ✅ La valeur commence bien par `pk_test_` ou `pk_live_`

## 🐛 Dépannage

### La clé n'est toujours pas détectée

1. **Vérifier le nom du fichier** :
   - `.env.local` (priorité la plus haute, ignoré par git)
   - `.env.development` (pour le mode développement)
   - `.env` (fichier de base)

2. **Vérifier le format** :
   ```bash
   # ✅ Correct
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51AbC123...
   
   # ❌ Incorrect (espaces, guillemets, etc.)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_51AbC123..."
   ```

3. **Redémarrer complètement** :
   ```powershell
   # Arrêter le serveur
   # Supprimer le cache Next.js
   Remove-Item -Recurse -Force .next
   # Relancer
   pnpm dev
   ```

4. **Vérifier les logs** :
   ```powershell
   $env:LOG_FILE='true'; pnpm dev | Select-String -Pattern "Stripe publishable key"
   ```

## 📚 Références

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Stripe API Keys](https://stripe.com/docs/keys)

