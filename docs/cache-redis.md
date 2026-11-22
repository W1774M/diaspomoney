# Cache Redis (`@Cacheable`)

## Fonctionnement

- Les méthodes décorées `@Cacheable(ttl, { prefix })` (dépôts, services, façades) gardent leur résultat dans Redis sous `cache:<prefix>:<arguments JSON>`.
- Les dates sont restaurées en `Date` à la relecture. Les autres types (ObjectId, instances de classes) reviennent en JSON simple.
- Chaque environnement a sa base Redis, lue dans `REDIS_URL` : `/0` dev, `/1` rct, `/2` prod.
- Toutes les clés de cache sont sous `cache:`. Un vidage ne touche jamais les clés de sécurité de `lib/redis/redis-client` (force brute, liste noire de jetons, fraude).

## Invalidation

- **Écriture ordinaire** : toute méthode `@InvalidateCache(...)` vide **tout** le cache de l'environnement. Une même donnée est en cache à plusieurs niveaux (dépôt, service, façade, statistiques), et un motif ciblé en oublie. Le motif passé au décorateur sert seulement à reconnaître le domaine.
- **Exceptions** : les journaux d'audit (`AuditLog*`, `PCIAuditLog*`) et les notifications (`Notification*`) sont écrits à presque chaque requête et ne vident que leur propre domaine.
- **Écriture hors dépôt** (route qui écrit directement dans une collection) : appeler `await invalidateAppCache('<Domaine>Repository')` juste après l'écriture. C'est déjà fait pour les routes existantes : réinitialisation du mot de passe, vérification d'email, profil, avatar, CSM, factures, messagerie, notifications.

## Activation

Interrupteur `CACHE_REDIS_ENABLED=true`, à mettre dans le bloc `environment` du service de `docker-compose.yml`. Le cache n'est jamais actif en test (`NODE_ENV=test`) ni pendant `next build`. Désactivé, `@Cacheable` appelle simplement la méthode.

Déploiement progressif :

1. **dev** : activé.
2. **rct** : ajouter `CACHE_REDIS_ENABLED: "true"` à `app-rct` après observation sur dev (données périmées, erreurs de type sur les valeurs relues, logs « Redis »).
3. **prod** : même chose pour `app-prod`, après la recette.

Retour arrière : retirer la variable et redéployer, le cache cesse d'être lu immédiatement.
