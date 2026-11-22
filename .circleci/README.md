# CircleCI

CircleCI sert uniquement à valider le code : installation, lint, TypeScript, tests, couverture et build.

Le déploiement runtime n'est plus géré par CircleCI. Il est opéré sur le serveur avec Docker Compose et Portainer :

```bash
pnpm deploy:dev
pnpm deploy:rct
pnpm deploy:prod
```

## Workflows

- `ci-cd` : un seul workflow. Toutes les branches sauf `main` : `tests` (lint, types, tests + couverture), `build`, `e2e`. Ensuite, selon la branche : déploiement dev, rct (avec validation) ou prod. Détail complet : `docs/ci-cd.md`.

## Artifacts

CircleCI publie :

- `test-results`
- `playwright-report`
- `coverage`
- `.next`

## Dépannage

Si le pipeline ne démarre pas, vérifier que CircleCI a accès au repository et que `.circleci/config.yml` est valide.

Si les tests MongoDB échouent, vérifier que Docker est disponible dans le job et que le port `27018` n'est pas déjà utilisé.

