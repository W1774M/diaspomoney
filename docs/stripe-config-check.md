# Vérification de la configuration Stripe

## 🔍 Diagnostic en ligne

Une route API de diagnostic est disponible pour vérifier votre configuration Stripe :

**Ouvrez dans votre navigateur** (pendant que le serveur tourne) :
```
http://localhost:3000/api/stripe/check-config
```

Cette route vérifie :
- ✅ La présence de `STRIPE_SECRET_KEY`
- ✅ Le format de la clé (doit commencer par `sk_test_` ou `sk_live_`)
- ✅ La présence de `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- ✅ Le format de la clé publique (doit commencer par `pk_test_` ou `pk_live_`)
- ✅ La correspondance des modes (test/live) entre les deux clés
- ✅ La connexion à l'API Stripe

## 📋 Vérification manuelle

### 1. Vérifier les variables d'environnement

Dans votre fichier `.env.local`, vous devez avoir :

```bash
# Clé secrète (côté serveur)
STRIPE_SECRET_KEY=sk_test_votre-cle-secrete

# Clé publique (côté client)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre-cle-publique
```

### 2. Vérifier les logs

Pour voir les logs Stripe en temps réel :

```powershell
pnpm check:stripe:logs
```

Ou pour filtrer uniquement les erreurs :

```powershell
pnpm dev:filtered:errors | Select-String -Pattern "stripe"
```

### 3. Vérifier dans le code

Le code vérifie automatiquement la configuration au démarrage. Les logs devraient afficher :

```
[StripeConfig] Initializing Stripe instance { mode: 'test' }
```

Si vous voyez une erreur comme :
```
Stripe secret key validation failed
```

Cela signifie que :
- La variable `STRIPE_SECRET_KEY` n'est pas définie, OU
- La clé n'a pas le bon format (ne commence pas par `sk_test_` ou `sk_live_`)

## 🐛 Problèmes courants

### "STRIPE_SECRET_KEY n'est pas définie"

**Solution** :
1. Vérifiez que le fichier `.env.local` existe à la racine du projet
2. Vérifiez que la variable est bien écrite : `STRIPE_SECRET_KEY=sk_test_...`
3. **Redémarrez le serveur** après modification du `.env.local`

### "Stripe key format may be invalid"

**Solution** :
- La clé doit commencer par `sk_test_` (mode test) ou `sk_live_` (mode production)
- Vérifiez que vous n'avez pas d'espaces ou de guillemets autour de la valeur
- Exemple correct : `STRIPE_SECRET_KEY=sk_test_51AbC123...`
- Exemple incorrect : `STRIPE_SECRET_KEY = "sk_test_51AbC123..."`

### "StripeAuthenticationError"

**Solution** :
- La clé est invalide ou expirée
- Récupérez une nouvelle clé depuis le dashboard Stripe : https://dashboard.stripe.com/apikeys
- Assurez-vous d'utiliser la bonne clé (test vs live)

### "Les modes ne correspondent pas"

**Solution** :
- Si `STRIPE_SECRET_KEY` commence par `sk_test_`, alors `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` doit commencer par `pk_test_`
- Si `STRIPE_SECRET_KEY` commence par `sk_live_`, alors `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` doit commencer par `pk_live_`

## 📊 Logs à surveiller

### Logs de succès

```
[StripeConfig] Initializing Stripe instance { mode: 'test' }
[StripePaymentStrategy] Created new Stripe customer: cus_...
[StripePaymentStrategy] Payment intent created successfully
```

### Logs d'erreur

```
[StripeConfig] Stripe secret key validation failed
[StripePaymentStrategy] Missing client_secret
[StripePaymentStrategy] Error in createPaymentIntent
```

## 🔧 Commandes utiles

```powershell
# Ouvrir la page de diagnostic (dans le navigateur)
# http://localhost:3000/api/stripe/check-config

# Voir tous les logs Stripe
pnpm check:stripe:logs

# Voir uniquement les erreurs
pnpm dev:filtered:errors | Select-String -Pattern "stripe"

# Voir les logs de paiement
pnpm dev:filtered | Select-String -Pattern "payment"
```

