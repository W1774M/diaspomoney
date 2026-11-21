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

1. **Project Settings → Environment Variables** : ajouter `DEPLOY_HOST`, `DEPLOY_USER` et `DEPLOY_KNOWN_HOSTS`, avec les valeurs du fichier.
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
