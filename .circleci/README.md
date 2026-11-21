# CircleCI

CircleCI sert uniquement à valider le code : installation, lint, TypeScript, tests, couverture et build.

Le déploiement runtime n'est plus géré par CircleCI. Il est opéré sur le serveur avec Docker Compose et Portainer :

```bash
pnpm deploy:dev
pnpm deploy:rct
pnpm deploy:prod
```

## Workflows

- `ci-dev-workflow` : push sur `dev`, exécute tests, couverture et build.
- `ci-rct-workflow` : push sur `rct`, exécute tests, couverture et build.
- `ci-prod-workflow` : push sur `main`, exécute tests, couverture et build.
- `pr-workflow` : autres branches, exécute tests, couverture et build.

## Artifacts

CircleCI publie :

- `test-results`
- `playwright-report`
- `coverage`
- `.next`

## Dépannage

Si le pipeline ne démarre pas, vérifier que CircleCI a accès au repository et que `.circleci/config.yml` est valide.

Si les tests MongoDB échouent, vérifier que Docker est disponible dans le job et que le port `27018` n'est pas déjà utilisé.

