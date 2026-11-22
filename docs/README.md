# Documentation DiaspoMoney

Présentation du projet et démarrage rapide : [`README.md`](../README.md) à la racine.

## Développement

- [Démarrage en local](./developpement/demarrage-local.md) : installation, variables, MongoDB/Redis, logs, problèmes fréquents
- [Tests](../tests/README.md) : suites Vitest, E2E Playwright, cliquet de couverture

## Architecture

- [Conventions de code](./architecture/conventions.md) : pages, hooks, facades, nommage
- [Cache Redis](./architecture/cache-redis.md) : `@Cacheable`, invalidation, activation
- DDD : [context map](./architecture/ddd/context-map.md), [langue ubiquitaire](./architecture/ddd/ubiquitous-language.md), [audit](./architecture/ddd/audit-integral.md)

## Paiements

- [Intégration Stripe](./paiements/stripe.md) : chemin canonique, configuration
- [Dépannage Stripe](./paiements/stripe-depannage.md)

## Exploitation

- [CI/CD](./exploitation/ci-cd.md) : dev → rct → main, déploiements, rollback, validation Sentry
- [Accès au serveur](./exploitation/acces-serveur.md)
- [Tâches planifiées](./exploitation/taches-planifiees.md) : purge nocturne des journaux d’audit
- [Infrastructure Docker Compose](../docker/README.md)
