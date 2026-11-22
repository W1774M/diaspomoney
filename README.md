# DiaspoMoney

Plateforme qui permet à la diaspora de réserver et payer des services en Afrique pour ses proches : santé, éducation, BTP et immobilier.

- Production : https://diaspomoney.fr
- Recette : https://rct.diaspomoney.fr
- Développement : https://dev.diaspomoney.fr

## Stack

- **Next.js 16** (App Router), React 18, TypeScript, Tailwind CSS
- **MongoDB** (Mongoose) et **Redis** (cache, sécurité)
- **NextAuth** pour l'authentification, **Stripe** pour les paiements, **Resend** pour les e-mails
- **Pino** pour les logs, **Sentry** pour le suivi des erreurs
- **Vitest** et **Playwright** pour les tests
- **Docker Compose** + Traefik sur le serveur, **CircleCI** pour la CI/CD

## Démarrage rapide

```bash
pnpm install
cp env.example .env.local   # puis adapter (voir docs/developpement/demarrage-local.md)
pnpm dev                    # http://localhost:3000
```

## Commandes principales

| Commande | Rôle |
| --- | --- |
| `pnpm dev` | Serveur de développement |
| `pnpm build` / `pnpm start` | Build et serveur de production |
| `pnpm lint` / `pnpm tsc:check` | Lint et vérification TypeScript |
| `pnpm test:unit` | Tests unitaires (client + serveur) |
| `pnpm test:coverage` | Toutes les suites, avec seuils de couverture |
| `pnpm test:e2e` | Tests E2E Playwright |
| `pnpm test:db:up` | MongoDB de test (port 27018) |

## Organisation du code

```
app/            pages et routes API (App Router)
components/     composants React
hooks/          hooks UI (appels /api/*)
facades/        orchestration des cas d'usage
services/       logique applicative
repositories/   accès aux données
domain/         modèle métier (bounded contexts DDD)
models/         schémas Mongoose
lib/            utilitaires transverses (auth, redis, stripe, logger…)
tests/          tests Vitest et Playwright
docker/         infrastructure Docker Compose
scripts/        scripts de déploiement et de maintenance
docs/           documentation
```

## Contribuer

On développe sur `dev` (ou une branche ouverte en PR vers `dev`) ; la CI promeut ensuite vers `rct` puis `main`. Pas de PR directe vers `main`. Détail : [`docs/exploitation/ci-cd.md`](docs/exploitation/ci-cd.md).

## Documentation

Index complet : [`docs/README.md`](docs/README.md).
