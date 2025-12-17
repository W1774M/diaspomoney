# Vérification de NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

Ce document explique comment vérifier et configurer correctement la clé publique Stripe.

## 🔍 Vérification rapide

### 1. Utiliser le script de vérification

```bash
# Vérifier dans le namespace par défaut
./scripts/check-stripe-key.sh

# Vérifier dans un namespace spécifique
./scripts/check-stripe-key.sh rct
./scripts/check-stripe-key.sh prod
```

Le script vérifie :
- ✅ L'existence du secret Kubernetes
- ✅ La présence de la clé dans le secret
- ✅ Le format de la clé (pk_test_ ou pk_live_)
- ✅ L'absence de guillemets
- ✅ La référence dans les deployments

### 2. Vérifier via l'API

```bash
# Vérifier la configuration Stripe
curl https://diaspomoney.fr/api/stripe/check-config
```

## 🔧 Configuration

### Mettre à jour la clé dans Kubernetes

```bash
# Mettre à jour dans le namespace par défaut
./scripts/update-stripe-key.sh default pk_test_51S7G0dArnazXOChT...

# Mettre à jour dans un namespace spécifique
./scripts/update-stripe-key.sh rct pk_test_51S7G0dArnazXOChT...
./scripts/update-stripe-key.sh prod pk_live_51S7G0dArnazXOChT...
```

### Créer le secret manuellement

```bash
# Créer le secret avec la clé
kubectl create secret generic app-secrets -n <namespace> \
  --from-literal=NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY='pk_test_...'

# Ou mettre à jour un secret existant
kubectl patch secret app-secrets -n <namespace> \
  --type='json' \
  -p='[{"op": "replace", "path": "/data/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "value": "'$(echo -n 'pk_test_...' | base64)'"}]'
```

## ⚠️ Problèmes courants

### 1. Erreur 401 (Unauthorized)

**Symptôme** : Erreur `401 (Unauthorized)` lors de l'initialisation des éléments Stripe.

**Causes possibles** :
- La clé contient des guillemets ou espaces
- La clé est invalide ou expirée
- La clé ne correspond pas à l'environnement (test vs live)

**Solution** :
```bash
# Vérifier la clé
./scripts/check-stripe-key.sh <namespace>

# Mettre à jour la clé si nécessaire
./scripts/update-stripe-key.sh <namespace> pk_test_...
```

### 2. Clé avec guillemets

**Symptôme** : La clé est entourée de guillemets dans l'URL Stripe.

**Solution** : Le code nettoie automatiquement les guillemets, mais il est préférable de les enlever du secret :

```bash
# Mettre à jour la clé sans guillemets
./scripts/update-stripe-key.sh <namespace> pk_test_...
```

### 3. Clé non trouvée

**Symptôme** : `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` n'est pas définie.

**Solution** :
```bash
# Créer le secret
kubectl create secret generic app-secrets -n <namespace> \
  --from-literal=NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY='pk_test_...'
```

## 📋 Checklist de vérification

Avant de déployer, vérifiez :

- [ ] La clé est définie dans le secret Kubernetes
- [ ] La clé commence par `pk_test_` (test) ou `pk_live_` (production)
- [ ] La clé n'a pas de guillemets ou espaces
- [ ] La clé est référencée dans les deployments
- [ ] Le mode (test/live) correspond à l'environnement
- [ ] Les pods ont été redémarrés après la mise à jour

## 🔄 Redémarrer les pods

Après avoir mis à jour la clé, redémarrez les pods pour appliquer les changements :

```bash
# Redémarrer tous les deployments dans un namespace
kubectl rollout restart deployment -n <namespace>

# Ou redémarrer un deployment spécifique
kubectl rollout restart deployment <deployment-name> -n <namespace>
```

## 🧪 Test en local

Pour tester en local, créez un fichier `.env.local` :

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51S7G0dArnazXOChT...
```

Puis redémarrez le serveur de développement :

```bash
pnpm dev
```

## 📚 Références

- [Documentation Stripe - Clés API](https://stripe.com/docs/keys)
- [Next.js - Variables d'environnement](https://nextjs.org/docs/basic-features/environment-variables)

