# Scripts

## Déploiement et serveur

| Script | Usage | Rôle |
| --- | --- | --- |
| `deploy-compose.sh` | `pnpm deploy:dev\|rct\|prod\|all` ou `./scripts/deploy-compose.sh prod --no-cache` | Build et redémarrage manuel d'un service Compose (en temps normal, CircleCI déploie) |
| `deploy.sh` | idem | Alias de `deploy-compose.sh` |
| `server/ci-deploy.sh` | appelé par CircleCI | Déploiement sur le serveur (installé dans `/root/Lab/scripts/`) — voir [`docs/exploitation/ci-cd.md`](../docs/exploitation/ci-cd.md) |
| `server/docker-cleanup.sh` | cron horaire | Nettoyage Docker du serveur, épargne l'image prod candidate |
| `server/configure-sentry-relay.sh` | `ssh -t diaspomoney-server /root/Lab/scripts/configure-sentry-relay.sh` | Configure le relais Sentry → validation CircleCI |
| `ci/github-pr.sh` | appelé par CircleCI | Ouverture et fusion des PR de promotion |

## Stripe

| Script | Rôle |
| --- | --- |
| `check-stripe-secrets.sh <dev\|rct\|prod>` | Vérifie les clés Stripe du `.env` (préfixes test/live) |
| `fix-stripe-secrets.sh <dev\|rct\|prod>` | Affiche la marche à suivre pour corriger |

Voir [`docs/paiements/stripe-depannage.md`](../docs/paiements/stripe-depannage.md).

## Tests

| Script | Rôle |
| --- | --- |
| `test-coverage.mjs` | `pnpm test:coverage` : les trois suites avec couverture fusionnée et seuils du cliquet |

## Maintenance

| Script | Usage | Rôle |
| --- | --- | --- |
| `cleanup-docker.sh` | `pnpm cleanup:docker` (dry-run), `pnpm cleanup:docker:all` ; options `--images`, `--containers`, `--volumes`, `--build-cache` | Nettoyage Docker en local |
| `find-unused-images.js` | `pnpm cleanup:images` (dry-run), `pnpm cleanup:images:delete` | Images de `public/` jamais référencées (exclut `public/uploads/` et les images de providers) |
| `cleanup-unused-images.sh` | `--dry-run` / `--delete` | Variante shell du précédent |
| `fix-booking-payment-status.sh` | ponctuel | Migration : commandes CONFIRMED/FINISHED restées en `paymentStatus: pending` |
| `remove-dynamic-exports.sh` | ponctuel | Retire les `export const dynamic` par route (désormais global) |
