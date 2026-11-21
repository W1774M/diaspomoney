# CI/CD DiaspoMoney

Tout est piloté par CircleCI (`.circleci/config.yml`). Les déploiements se font sur `diaspomoney-server`, en Docker Compose.

## Parcours d'une modification

```
local ──push──▶ dev ──PR auto──▶ rct ──PR auto + « Approve » CircleCI──▶ main
               │                 │                                       │
               tests, build, E2E tests, build, E2E                       tests, build, E2E
               déploiement dev   déploiement rct                         déploiement prod
               PR dev → rct      PR rct → main
                                 [valider-mise-en-prod] → fusion
```

1. **Développer en local**, puis pousser sur `dev`. `dev` n'est pas protégée.
2. **CircleCI sur `dev`** :
   - lance les tests, le build et l'E2E ;
   - déploie l'image `diaspomoney:dev` (dev.diaspomoney.fr) ;
   - ouvre la PR `dev → rct` si elle n'existe pas déjà.
3. **Valider la PR `dev → rct` sur GitHub**, en la fusionnant.
4. **CircleCI sur `rct`** :
   - relance les tests et déploie `diaspomoney:rct` (rct.diaspomoney.fr) ;
   - ouvre la PR `rct → main` ;
   - attend le bouton **Approve** du job `valider-mise-en-prod` ;
   - après le clic, fusionne la PR `rct → main`.
5. **CircleCI sur `main`** : relance les tests et déploie `diaspomoney:prod` (diaspomoney.fr).

## Protection des branches

`main` et `rct` sont protégées sur GitHub, administrateurs compris :
- pas de push direct ni de force-push : tout passe par une PR ;
- checks requis avant fusion : `ci/circleci: tests`, `ci/circleci: build` et `ci/circleci: e2e`.

## Configuration CircleCI (à faire une fois)

Les valeurs sont dans un fichier lisible par root uniquement sur le serveur :

```
ssh diaspomoney-server "cat /root/.diaspomoney-circleci-setup"
```

1. **Project Settings → Environment Variables** : ajouter `DEPLOY_HOST` et `DEPLOY_USER` (la clé publique du serveur est inscrite dans la config ; `DEPLOY_KNOWN_HOSTS` n'est plus utilisée), avec les valeurs du fichier.
2. **Project Settings → SSH Keys → Additional SSH Keys** :
   - Hostname : la valeur de `DEPLOY_HOST` ;
   - clé privée : `ssh diaspomoney-server "cat /root/.ssh/circleci_deploy"` ;
   - l'empreinte affichée doit être `SHA256:IEBaaimc2F7J9Mr2G0P15yQFZ0p88DKWQcOZa2oujxY`.
3. **GitHub → Settings → Developer settings → Fine-grained tokens** : créer un jeton pour le seul dépôt `W1774M/diaspomoney`, avec les droits *Pull requests : Read and write* et *Contents : Read and write*. Puis l'ajouter dans CircleCI comme variable `GITHUB_TOKEN`.

La clé `circleci-deploy` est limitée côté serveur à `scripts/server/ci-deploy.sh` (forced command dans `authorized_keys`). Elle ne peut que lancer `deploy <dev|rct|prod> <sha>`, et seulement pour un commit présent sur la branche correspondante.

## Déploiement sur le serveur

`scripts/server/ci-deploy.sh` est installé dans `/root/Lab/scripts/ci-deploy.sh`. Pour chaque déploiement, il :
- vérifie que le commit appartient bien à la branche (`dev`, `rct` ou `main`) ;
- prépare un worktree par environnement, `/root/Lab/deploy/<env>`, avec un lien vers le `.env` du checkout principal ;
- enchaîne `docker compose build` puis `up`, pour que le nettoyage Docker horaire ne supprime pas l'image entre les deux ;
- attend le healthcheck du conteneur ;
- n'autorise qu'un déploiement à la fois (verrou `flock`).

Journal : `/root/Lab/scripts/ci-deploy.log`.

## Tests

En CI, les trois suites passent par **CircleCI Smarter Testing** (`.circleci/test-suites.yml`, commande `circleci testsuite run "<suite>"`). Fonctions gratuites actives :
- résultats téléversés (onglet Tests, Test Insights) ;
- « Rerun failed tests » ne relance que les tests en échec ;
- découpage statique par durée si l'on ajoute `parallelism` au job `tests`.

Aucune fonction payante n'est activée (analyse d'impact, découpage dynamique, rerun automatique). Vérification locale d'une suite : `circleci testsuite doctor "<suite>"`.

La couverture globale tourne dans un job `coverage` séparé, sur des exécutions complètes : un rerun partiel ne fausse jamais la mesure.

| Suite | Commande | Contenu |
| --- | --- | --- |
| Client | `pnpm test:unit:client` | composants, hooks, lib (jsdom) |
| Serveur | `pnpm test:unit:server` | routes API, services, facades (MongoDB requis) |
| Intégration | `pnpm test:integration` | flux complets sur MongoDB réel |
| Couverture globale | `pnpm test:coverage` | les trois suites fusionnées, avec les seuils du cliquet |
| E2E | `pnpm test:e2e` | Playwright : parcours publics, SEO/sécurité, autorisation |

MongoDB de test en local : `pnpm -s test:db:up`. La base est `127.0.0.1:27018/diaspomoney_test`.

### Cliquet de couverture

`coverage-thresholds.json` fixe le minimum de couverture globale (les trois suites, sur tout le code applicatif).
- La CI échoue si la couverture descend sous ces seuils.
- À chaque lot de tests, relever les seuils au nouveau niveau, sans jamais les baisser.
- Objectif : 90 %, puis 95 %.
- Point de départ (21/11/2026) : 18 % des lignes.

### E2E : règles suivies

- Sélecteurs par rôle et nom accessible (`getByRole`) ; pas de sélecteur CSS fragile.
- Pas de `networkidle` ni de délai fixe : uniquement des assertions qui se réessaient seules (`expect(...).toBeVisible()`, `toHaveURL`).
- Chaque test part d'un contexte vierge. Les comptes de test sont créés par `tests/e2e/global-setup.ts`, qui refuse toute base dont le nom ne contient pas « test ».
- En CI : Chromium, sur le build de production. En local : Chromium, Firefox et WebKit.

## Déploiements CircleCI (Deploys), rollback et validation

### Ce qui est en place

- **Marqueurs** sur les jobs `deploy-dev`, `deploy-rct` et `deploy-prod` :
  - composant `diaspomoney` ;
  - environnements `development`, `staging` et `production` ;
  - version = SHA git complet.
- **Validation en production** : le job `release-production` (`type: release`, plan `deploy-prod`) écoute pendant 20 min les alertes du webhook `sentry-errors`. Si une alerte arrive, la release échoue et le **rollback automatique** redéploie la version précédente.
- **`.circleci/deploy.yml`** : déploie une version choisie dans l'écran Deploys. La validation s'applique si l'environnement est `production`.
- **`.circleci/rollback.yml`** : redéploie la version cible, sans validation.
- **Sentry côté serveur** (`instrumentation.ts`) : les erreurs sont étiquetées par `SENTRY_ENVIRONMENT`.
- **Relais `docker/sentry-relay`** : Sentry ne peut pas ajouter d'en-tête `Authorization` à ses webhooks. Le relais vérifie la signature Sentry et renvoie l'alerte à CircleCI avec le secret.

### À faire une fois (dans l'ordre)

1. **Connecter la CLI CircleCI** avec le droit d'écriture : `circleci auth login`, en choisissant **Write** sur l'écran d'autorisation.
   - Ensuite, les pipelines `deploy` (`.circleci/deploy.yml`) et `rollback` (`.circleci/rollback.yml`) peuvent être enregistrés avec la CLI.
   - Si l'enregistrement échoue, l'organisation n'a pas l'app GitHub CircleCI. Il faut l'ajouter depuis **CircleCI → Organization Settings → VCS Connections → GitHub App** (pas depuis GitHub).
2. **Désigner les pipelines.** Ouvrir https://app.circleci.com/settings/project/github/W1774M/diaspomoney/deploys :
   - carte **Deploy pipeline** : choisir `deploy` ;
   - carte **Rollback pipeline** : choisir `rollback`.
3. **Créer le secret de validation.** Ouvrir https://app.circleci.com/settings/organization/github/W1774M/deploys, carte **Webhook secrets**, puis **Generate**. Le copier aussitôt : il n'est affiché qu'une fois. **Ne jamais le coller dans une conversation.**
4. **Créer l'intégration Sentry** : Settings → Developer Settings → Custom Integrations → **Create New Integration → Internal Integration** :
   - nom : `CircleCI deploy validation` ;
   - Webhook URL : `https://diaspomoney.fr/__hooks/sentry` ;
   - cocher **Alert Rule Action** ;
   - enregistrer, puis copier le **Client Secret**.
5. **Renseigner le `.env` du serveur**, dans `/root/Lab/diaspomoney/.env`, puis démarrer le relais :

   ```
   SENTRY_RELAY_CLIENT_SECRET='<Client Secret Sentry>'
   CIRCLECI_VALIDATION_URL='https://circleci.com/api/v3/deploy/hooks/0cd6cbdc-890c-4f94-8189-ccb2978954c2/validate'
   CIRCLECI_VALIDATION_SECRET='<secret CCIVWH_… de l'étape 3>'
   ```

   ```
   cd /root/Lab/diaspomoney && docker compose up -d sentry-relay
   ```

   `https://diaspomoney.fr/__hooks/health` doit répondre `{"ok":true}`.
6. **Créer les alertes Sentry** sur l'environnement `production`. Par exemple : nombre d'erreurs supérieur à un seuil sur 5 min, ou nouvelle issue. Action : *Send a notification via* `CircleCI deploy validation`.
   - Le relais n'envoie à CircleCI que les environnements `development`, `staging` et `production`.
7. **Faire un vrai déploiement en production** pour prouver le branchement : seul un déploiement réel montre qu'une alerte s'attache à la release. Vérifier ensuite dans l'écran Deploys qu'une validation est créée.

Tant que les étapes 3 à 6 ne sont pas faites, la validation n'a aucun signal : une mise en production passe en succès à la fin de la fenêtre de 20 min.
