# CircleCI

CircleCI valide le code **et** déploie les trois environnements sur le serveur (Docker Compose, via `scripts/server/ci-deploy.sh`). Parcours complet, protection des branches et configuration à faire une fois : [`docs/exploitation/ci-cd.md`](../docs/exploitation/ci-cd.md).

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `config.yml` | Workflow `ci-cd` : `tests` (lint, types, tests + couverture), `build`, `e2e` sur `dev` ; contrôles de promotion et déploiements dev, rct, prod |
| `deploy.yml` | Pipeline `deploy` : redéploie une version choisie dans l'écran Deploys |
| `rollback.yml` | Pipeline `rollback` : redéploie une version précédente, sans validation |

## Artifacts

- `test-results` (JUnit, onglet Tests)
- `coverage`
- `playwright-report`

## Dépannage

- Le pipeline ne démarre pas : vérifier que CircleCI a accès au dépôt et que `config.yml` est valide (`circleci config validate`).
- Les tests MongoDB échouent : vérifier que le conteneur MongoDB du job a démarré (étape « Attente de MongoDB »).
- Un job de promotion (`promotion-depuis-dev`, `promotion-depuis-rct`) échoue : la PR a été fusionnée autrement qu'en « Create a merge commit », ou le code diffère du commit testé.
