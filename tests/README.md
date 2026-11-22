# Tests

Vitest pour les tests unitaires et d'intégration, Playwright pour l'E2E. En CI, tout passe dans le job `tests` puis `e2e` : voir [`docs/exploitation/ci-cd.md`](../docs/exploitation/ci-cd.md#tests).

## Suites

| Suite | Commande | Config | Dossiers |
| --- | --- | --- | --- |
| Client (jsdom) | `pnpm test:unit:client` | `vitest.config.ts` | `tests/components`, `tests/hooks`, `tests/lib` |
| Serveur (Node + MongoDB) | `pnpm test:unit:server` | `vitest.server.config.ts` | `tests/api`, `tests/facades`, `tests/services`, `tests/domain` |
| Intégration (MongoDB réel) | `pnpm test:integration` | `vitest.integration.config.ts` | `tests/integration` |
| Les trois, avec couverture | `pnpm test:coverage` | `scripts/test-coverage.mjs` | — |
| E2E | `pnpm test:e2e` | `playwright.config.ts` | `tests/e2e` |

`pnpm test:unit` enchaîne client et serveur ; `pnpm test:unit:watch` lance Vitest en mode watch.

## MongoDB de test

Les suites serveur et intégration ont besoin d'une base dédiée :

```bash
pnpm test:db:up      # mongo:7 sur 127.0.0.1:27018, base diaspomoney_test
pnpm test:db:reset   # repartir d'une base vide
pnpm test:db:down
```

## Couverture

`coverage-thresholds.json` est un cliquet : la CI échoue sous ces seuils. On les relève après chaque lot de tests, sans jamais les baisser (objectif 90 %, puis 95 %).

## E2E (Playwright)

```bash
pnpm test:e2e          # headless
pnpm test:e2e:ui       # mode interactif
pnpm test:e2e:headed   # navigateur visible
pnpm test:e2e:debug
```

- En local, Playwright lance `pnpm dev` ; en CI, `pnpm start` sur le build de production.
- `tests/e2e/global-setup.ts` crée les comptes de test et refuse toute base dont le nom ne contient pas « test ».
- `tests/e2e/fixtures.ts` fournit les fixtures partagées ; `tests/e2e/auth/` couvre l'autorisation, `tests/e2e/public/` les parcours publics.
- Sélecteurs par rôle (`getByRole`), pas de `networkidle` ni de délai fixe : uniquement des assertions qui se réessaient seules.

## Écrire un test

- Placer le fichier dans le dossier de la suite voulue (tableau ci-dessus), sinon il n'est exécuté par aucune config.
- Mocks partagés : `tests/mocks/`, setup global : `tests/setup.ts` (+ `setup.mongo.ts` côté serveur).
