# Résolution des erreurs Stripe dans le navigateur

## ⚠️ IMPORTANT : Deux types d'erreurs distinctes

Les erreurs Stripe peuvent provenir de **deux sources différentes** :

1. **Erreurs côté client** (`ERR_BLOCKED_BY_CLIENT`) - Bloqueurs de publicité
2. **Erreurs côté serveur** (500 Internal Server Error) - Configuration Stripe manquante

## 🔍 Erreurs courantes

### 1. `ERR_BLOCKED_BY_CLIENT` - Requêtes Stripe bloquées

**Symptômes :**
```
r.stripe.com/b:1 Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
FetchError: Error fetching https://r.stripe.com/b: Failed to fetch
```

**Causes possibles :**

1. **Bloqueur de publicité** (le plus courant)
   - Extensions comme uBlock Origin, AdBlock Plus, etc.
   - Ces extensions bloquent souvent les domaines `*.stripe.com` car ils sont utilisés pour le tracking

2. **Content Security Policy (CSP) trop restrictive**
   - La CSP peut bloquer les connexions vers Stripe si elle n'autorise pas `*.stripe.com`

3. **Paramètres de sécurité du navigateur**
   - Certains navigateurs ou paramètres de sécurité peuvent bloquer les connexions tierces

### 2. `Cannot redefine property: userAgent` - Erreur ProtectSubFrame.js

**Symptômes :**
```
ProtectSubFrame.js:1 Uncaught TypeError: Cannot redefine property: userAgent
```

**Cause :**
- Extension de navigateur (souvent un bloqueur de publicité ou une extension de sécurité) qui tente de modifier `navigator.userAgent`
- Conflit avec le code de protection de Stripe

## ✅ Solutions

### ⚠️ Erreur 500 - Problème serveur (PRIORITAIRE)

Si vous voyez `POST /api/payments/create-intent 500 (Internal Server Error)`, c'est un **problème serveur**, pas un problème de bloqueur de publicité.

**Causes possibles :**
- `STRIPE_SECRET_KEY` n'est pas définie dans les pods Kubernetes
- Les pods n'ont pas été redémarrés après l'ajout de la variable d'environnement
- Le secret Kubernetes n'a pas été appliqué

**Solution :**
```bash
# 1. Vérifier les secrets
./scripts/check-stripe-secrets.sh prod

# 2. Appliquer les secrets et redémarrer les pods
./scripts/fix-stripe-secrets.sh prod

# 3. Vérifier les logs serveur
kubectl logs -n diaspomoney deployment/diaspomoney-prod --tail=50 | grep -i stripe
```

### Solution 1 : Désactiver temporairement les bloqueurs de publicité

Pour tester si c'est un bloqueur de publicité :

1. **Désactiver les extensions** :
   - Ouvrez les paramètres de votre navigateur
   - Allez dans "Extensions" ou "Modules complémentaires"
   - Désactivez temporairement les bloqueurs de publicité (uBlock Origin, AdBlock, etc.)
   - Rechargez la page

2. **Mode navigation privée** :
   - Ouvrez une fenêtre de navigation privée (sans extensions)
   - Testez le paiement Stripe

3. **Autoriser Stripe dans le bloqueur** :
   - Si vous utilisez uBlock Origin, ajoutez `stripe.com` à la liste blanche
   - Ou créez une exception pour votre site

### Solution 2 : Vérifier la Content Security Policy

La CSP doit autoriser Stripe. Vérifiez que votre configuration inclut :

```
connect-src 'self' https://*.stripe.com;
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
frame-src https://js.stripe.com https://hooks.stripe.com;
```

### Solution 3 : Vérifier les paramètres du navigateur

1. **Chrome/Edge** :
   - Paramètres → Confidentialité et sécurité → Paramètres du site
   - Vérifiez que les cookies et JavaScript sont autorisés

2. **Firefox** :
   - Paramètres → Vie privée et sécurité
   - Vérifiez les paramètres de protection contre le pistage

### Solution 4 : Message d'erreur utilisateur

Ajoutez un message d'information pour les utilisateurs qui rencontrent ce problème :

```typescript
// Dans votre composant de paiement
if (error?.message?.includes('ERR_BLOCKED_BY_CLIENT') || 
    error?.message?.includes('Failed to fetch')) {
  return (
    <div className="error-message">
      <h3>Paiement bloqué</h3>
      <p>
        Il semble qu'une extension de navigateur bloque les connexions vers Stripe.
        Veuillez :
      </p>
      <ul>
        <li>Désactiver temporairement votre bloqueur de publicité</li>
        <li>Ou autoriser stripe.com dans les paramètres de votre bloqueur</li>
        <li>Ou utiliser le mode navigation privée</li>
      </ul>
    </div>
  );
}
```

## 🔧 Configuration recommandée

### Content Security Policy complète pour Stripe

```typescript
'Content-Security-Policy': 
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: https:; " +
  "font-src 'self' data:; " +
  "connect-src 'self' https://api.diaspomoney.fr https://*.stripe.com; " +
  "frame-src https://js.stripe.com https://hooks.stripe.com;"
```

### Domains Stripe nécessaires

- `js.stripe.com` - SDK JavaScript Stripe
- `*.stripe.com` - API et ressources Stripe
- `hooks.stripe.com` - Webhooks Stripe (si utilisés côté client)

## 📝 Notes importantes

1. **Distinction importante** :
   - `ERR_BLOCKED_BY_CLIENT` = Problème côté client (bloqueur de publicité) - **Non bloquant pour le fonctionnement**
   - `500 Internal Server Error` = Problème côté serveur (STRIPE_SECRET_KEY manquante) - **BLOQUANT, doit être résolu**

2. **Les bloqueurs de publicité sont la cause la plus fréquente** des erreurs `ERR_BLOCKED_BY_CLIENT` - Environ 80% des cas
3. **La CSP est maintenant configurée correctement** - Le problème vient généralement des extensions navigateur
4. **Les utilisateurs doivent être informés** - Ajoutez un message d'aide si le paiement échoue
5. **L'erreur 500 est prioritaire** - Si vous voyez `500 Internal Server Error`, vérifiez d'abord que `STRIPE_SECRET_KEY` est bien définie dans les pods

## 🐛 Débogage

### Diagnostic rapide

**Étape 1 : Identifier le type d'erreur**

- Si vous voyez `ERR_BLOCKED_BY_CLIENT` uniquement → Problème de bloqueur de publicité (non bloquant)
- Si vous voyez `500 Internal Server Error` → Problème serveur (BLOQUANT, à résoudre en priorité)

**Étape 2 : Pour les erreurs 500 (serveur)**

```bash
# Vérifier que les secrets sont bien configurés
./scripts/check-stripe-secrets.sh prod

# Si les secrets manquent, les appliquer
./scripts/fix-stripe-secrets.sh prod

# Vérifier les logs serveur pour l'erreur exacte
kubectl logs -n diaspomoney deployment/diaspomoney-prod --tail=100 | grep -i "stripe\|payment\|error"
```

**Étape 3 : Pour les erreurs ERR_BLOCKED_BY_CLIENT (client)**

1. **Ouvrez la console du navigateur** (F12)
2. **Vérifiez les erreurs réseau** dans l'onglet Network
3. **Filtrez par "stripe"** pour voir les requêtes bloquées
4. **Vérifiez les en-têtes CSP** dans la réponse HTTP
5. **Testez en mode navigation privée** pour isoler le problème

## 🔗 Ressources

- [Documentation Stripe - Intégration JavaScript](https://stripe.com/docs/stripe-js)
- [Content Security Policy - Stripe](https://stripe.com/docs/security/guide#content-security-policy)
- [Résolution des problèmes Stripe](https://stripe.com/docs/stripe-js/elements/quickstart#troubleshooting)
