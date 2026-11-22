# Dépannage Stripe

Chemin produit et configuration : [`stripe.md`](./stripe.md).

## 1. Identifier le type d'erreur

| Symptôme | Origine | Bloquant ? |
| --- | --- | --- |
| `POST /api/payments/create-intent 500` | Serveur : clé secrète absente ou invalide | **Oui**, à traiter en priorité |
| `401` à l'initialisation des Elements Stripe | Clé publique invalide, entre guillemets, ou mode test/live incohérent | Oui |
| « Initialisation du paiement sécurisé » qui tourne sans fin | L'API n'a pas renvoyé de `clientSecret` (voir 500 ci-dessus) | Oui |
| `r.stripe.com/b … ERR_BLOCKED_BY_CLIENT` | Bloqueur de publicité qui bloque la télémétrie Stripe | Non |
| `ProtectSubFrame.js: Cannot redefine property: userAgent` | Extension de navigateur | Non |

Les erreurs `ERR_BLOCKED_BY_CLIENT` viennent presque toujours d'une extension (uBlock Origin, AdBlock…) : tester en navigation privée pour le confirmer.

## 2. Vérifier la configuration

### Route de diagnostic

Serveur lancé, ouvrir `http://localhost:3000/api/stripe/check-config` (ou l'URL de l'environnement). Elle vérifie :

- la présence et le préfixe de `STRIPE_SECRET_KEY` (`sk_test_` / `sk_live_`) ;
- la présence et le préfixe de `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_` / `pk_live_`) ;
- la cohérence des modes entre les deux clés ;
- la connexion à l'API Stripe.

### Sur le serveur

```bash
./scripts/check-stripe-secrets.sh dev|rct|prod
```

Le script lit le `.env` et contrôle les préfixes attendus (test en dev et rct, live en prod, variables `*_PROD`). `./scripts/fix-stripe-secrets.sh <env>` affiche la marche à suivre pour corriger.

Après correction du `.env`, **reconstruire** le service : la clé publique est gravée au build.

```bash
pnpm deploy:rct        # ou deploy:dev / deploy:prod
```

### En local

- Les variables vont dans `.env.local` à la racine.
- Pas d'espaces autour du `=` ni de guillemets : `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51…`.
- Une variable lue côté client doit avoir le préfixe `NEXT_PUBLIC_`.
- Redémarrer `pnpm dev` après chaque modification ; en cas de doute, supprimer `.next/`.

## 3. Lire les logs

Journaux attendus :

```
[StripeConfig] Initializing Stripe instance { mode: 'test' }
[StripePaymentStrategy] Payment intent created successfully
```

Erreurs typiques : `Stripe secret key validation failed` (clé absente ou mal formée), `Missing client_secret`, `Error in createPaymentIntent`.

- En local : la sortie de `pnpm dev` (ou `pnpm check:stripe:logs`, filtré sur Stripe et paiements).
- Sur le serveur : `docker logs -f --tail 100 diaspomoney-app-rct` (ou `-dev`, `-prod`).

## 4. Erreurs fréquentes

| Message | Solution |
| --- | --- |
| `StripeAuthenticationError` | Clé invalide ou révoquée : en regénérer une sur https://dashboard.stripe.com/apikeys |
| « Les modes ne correspondent pas » | `sk_test_` va avec `pk_test_`, `sk_live_` avec `pk_live_` |
| `Amount must be positive` | Le montant (en centimes) doit être > 0 |
| « Le serveur n'a pas retourné de clientSecret » | Voir la clé secrète et les logs serveur |

## 5. Content Security Policy

La CSP est définie dans `next.config.mjs` (en `Content-Security-Policy-Report-Only` pour l'instant). Elle doit autoriser :

- `script-src` : `https://js.stripe.com`
- `connect-src` : `https://api.stripe.com`
- `frame-src` : `https://js.stripe.com`, `https://hooks.stripe.com`
- `form-action` : `https://checkout.stripe.com`
