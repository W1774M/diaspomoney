# Démarrage en local

## Prérequis

- Node.js 20 (version de l'image Docker) et pnpm 10 (`corepack enable`).
- Docker, pour MongoDB et Redis.

## Installation

```bash
pnpm install
cp env.example .env.local
```

`env.example` est la référence de toutes les variables. Pour le local, adapter au minimum :

```env
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/diaspomoney-dev
REDIS_URL=redis://127.0.0.1:6379/0
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Les secrets (`AUTH_SECRET`, `JWT_SECRET`, `ENCRYPTION_MASTER_KEY`…) se génèrent avec `openssl rand -hex 64`. Les clés Stripe de test : voir [`../paiements/stripe.md`](../paiements/stripe.md#configuration).

## Base de données et Redis

Le `docker-compose.yml` du dépôt est celui du serveur (ports non exposés). En local, lancer simplement :

```bash
docker run -d --name diaspomoney-mongo-local -p 27017:27017 mongo:7
docker run -d --name diaspomoney-redis-local -p 6379:6379 redis:7.2-alpine
```

Le cache Redis (`CACHE_REDIS_ENABLED`) est désactivé par défaut : voir [`../architecture/cache-redis.md`](../architecture/cache-redis.md).

## Lancer l'application

```bash
pnpm dev              # http://localhost:3000 (Turbopack)
pnpm build && pnpm start
```

Contrôles avant de pousser (les mêmes que la CI) :

```bash
pnpm lint
pnpm tsc:check
pnpm test:unit
```

Tests détaillés : [`tests/README.md`](../../tests/README.md).

## Logs

L'application journalise avec Pino sur la sortie standard (`lib/logger.ts`). Le niveau se règle avec `LOG_LEVEL` (`debug` par défaut hors production, `info` en production). Les champs sensibles (`password`, `token`, en-têtes `authorization` et `cookie`) sont retirés.

- En local : la sortie de `pnpm dev`. Filtres prêts à l'emploi sous Windows : `pnpm dev:filtered`, `pnpm dev:filtered:errors`, `pnpm check:stripe:logs`.
- Sur le serveur : `docker logs -f --tail 100 diaspomoney-app-dev` (ou `-rct`, `-prod`).

## Problèmes fréquents

### `ERR_SSL_PROTOCOL_ERROR` sur localhost

Le serveur de dev est en HTTP : utiliser `http://localhost:3000`, pas `https://`. `proxy.ts` ne force HTTPS que sur les domaines publics. Si le navigateur force quand même HTTPS (HSTS), supprimer la politique de `localhost` dans `chrome://net-internals/#hsts`, ou tester en navigation privée.

### Variable d'environnement ignorée

Next.js lit l'environnement au démarrage : relancer `pnpm dev` après chaque modification de `.env.local`. Une variable lue côté client doit commencer par `NEXT_PUBLIC_`.
