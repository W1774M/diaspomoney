# Déploiement Docker Compose - DiaspoMoney

DiaspoMoney utilise deux stacks Compose :

- `/root/Lab/compose.infra.yml` pour l'infra globale du serveur : Traefik et Portainer.
- `docker-compose.yml` dans ce repo pour l'application : `app-dev`, `app-rct`, `app-prod`, MongoDB, Redis et mongo-express.

Traefik est volontairement hors du repo applicatif pour pouvoir router d'autres applications du serveur.

## Réseaux

- `traefik` : réseau Docker partagé entre Traefik, Portainer et les services HTTP exposés.
- `diaspomoney-app` : réseau interne de DiaspoMoney pour MongoDB, Redis, les apps et le monitoring.

La stack infra crée le réseau `traefik`. La stack applicative crée le réseau `diaspomoney-app` et rejoint `traefik` comme réseau externe.

## Premier démarrage

Depuis le repo applicatif :

```bash
cp .env.example .env
```

Remplacer toutes les valeurs `CHANGE_ME` dans `.env`, puis démarrer l'infra globale depuis `/root/Lab` :

```bash
docker compose -f compose.infra.yml --env-file diaspomoney/.env up -d
```

Démarrer ensuite DiaspoMoney depuis `/root/Lab/diaspomoney` :

```bash
docker compose up -d --build
```

## Services applicatifs

- `app-dev` : `https://dev.diaspomoney.fr`
- `app-rct` : `https://rct.diaspomoney.fr`
- `app-prod` : `https://diaspomoney.fr`
- `mongodb` : MongoDB partagé, accessible seulement sur le réseau interne.
- `redis` : Redis partagé, accessible seulement sur le réseau interne.
- `mongo-express` : exposé via Traefik avec `MONGO_EXPRESS_DOMAIN`.

MongoDB utilise trois bases séparées :

- `diaspomoney-dev`
- `diaspomoney-rct`
- `diaspomoney`

Redis utilise la même instance, avec une base logique différente par environnement :

- `app-dev` : DB `0`
- `app-rct` : DB `1`
- `app-prod` : DB `2`

## Commandes utiles

Valider la configuration :

```bash
pnpm compose:config
docker compose -f ../compose.infra.yml --env-file .env config
docker compose -f compose.monitoring.yml --env-file .env config
```

Démarrer ou arrêter l'application :

```bash
pnpm compose:up
pnpm compose:down
```

Déployer un environnement applicatif :

```bash
pnpm deploy:dev
pnpm deploy:rct
pnpm deploy:prod
pnpm deploy:all
```

Forcer un rebuild sans cache :

```bash
./scripts/deploy-compose.sh prod --no-cache
```

Voir les logs :

```bash
docker compose logs -f app-prod
docker compose logs -f mongodb
docker compose logs -f redis
```

Voir l'infra globale :

```bash
docker compose -f ../compose.infra.yml --env-file .env ps
docker compose -f ../compose.infra.yml --env-file .env logs -f traefik
```

## Monitoring

Le monitoring reste optionnel dans `compose.monitoring.yml`.

```bash
docker compose -f compose.monitoring.yml --env-file .env up -d
```

Grafana et Prometheus rejoignent `traefik` pour l'exposition HTTP et `diaspomoney-app` pour accéder aux services applicatifs.

## Variables d'environnement

Le fichier `.env.example` contient le template non sensible. Le fichier `.env` réel doit rester uniquement sur le serveur.

Variables principales :

```dotenv
TRAEFIK_ACME_EMAIL=admin@example.com
TRAEFIK_DASHBOARD_DOMAIN=dashboard.example.com
PORTAINER_DOMAIN=portainer.example.com
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=CHANGE_ME
REDIS_PASSWORD=CHANGE_ME
MONGO_EXPRESS_DOMAIN=mongo.example.com
GRAFANA_PASSWORD=CHANGE_ME
```

Pour `TRAEFIK_DASHBOARD_AUTH`, générer une valeur htpasswd :

```bash
htpasswd -nb admin 'mot-de-passe-fort'
```

## Dépannage

Vérifier les réseaux :

```bash
docker network inspect traefik
docker network inspect diaspomoney-app
```

Vérifier les labels Traefik d'un service :

```bash
docker inspect diaspomoney-app-prod --format '{{ json .Config.Labels }}'
```

Vérifier les certificats Let's Encrypt :

```bash
docker compose -f ../compose.infra.yml --env-file .env logs traefik | rg -i "acme|certificate|error"
```

Vérifier la santé des services :

```bash
docker compose ps
docker compose logs --tail=100 app-prod
```

