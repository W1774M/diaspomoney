# Configuration Docker et Traefik - DiaspoMoney

## Architecture des réseaux

L'infrastructure est organisée en trois réseaux distincts :

1. **`traefik`** : Réseau partagé pour le reverse proxy Traefik
2. **`diaspomoney-dev`** : Réseau pour l'environnement de développement (`dev.diaspomoney.fr`)
3. **`diaspomoney-prod`** : Réseau pour l'environnement de production (`app.diaspomoney.fr`)

## Fichiers Docker Compose

### 1. `docker-compose.traefik.yml`
**À démarrer en premier** - Configure Traefik qui gère les deux environnements.

```bash
docker-compose -f docker-compose.traefik.yml up -d
```

### 2. `docker-compose.dev.yml`
Environnement de développement avec le domaine `dev.diaspomoney.fr`.

```bash
docker-compose -f docker-compose.traefik.yml -f docker-compose.dev.yml up -d
```

### 3. `docker-compose.prod.yml`
Environnement de production avec le domaine `app.diaspomoney.fr`.

```bash
docker-compose -f docker-compose.traefik.yml -f docker-compose.prod.yml up -d
```

### 4. `docker-compose.yml`
Configuration locale pour développement sans Traefik (ports exposés directement).

```bash
docker-compose up -d
```

## Commandes utiles

### Démarrer tous les environnements
```bash
# Démarrer Traefik
docker-compose -f docker-compose.traefik.yml up -d

# Démarrer l'environnement dev
docker-compose -f docker-compose.traefik.yml -f docker-compose.dev.yml up -d

# Démarrer l'environnement prod
docker-compose -f docker-compose.traefik.yml -f docker-compose.prod.yml up -d
```

### Arrêter un environnement
```bash
# Arrêter dev
docker-compose -f docker-compose.traefik.yml -f docker-compose.dev.yml down

# Arrêter prod
docker-compose -f docker-compose.traefik.yml -f docker-compose.prod.yml down
```

### Voir les logs
```bash
# Logs Traefik
docker-compose -f docker-compose.traefik.yml logs -f traefik

# Logs app dev
docker-compose -f docker-compose.traefik.yml -f docker-compose.dev.yml logs -f app-dev

# Logs app prod
docker-compose -f docker-compose.traefik.yml -f docker-compose.prod.yml logs -f app-prod
```

### Vérifier les réseaux
```bash
docker network ls
docker network inspect traefik
docker network inspect diaspomoney-dev
docker network inspect diaspomoney-prod
```

## Domaines configurés

### Développement (`dev.diaspomoney.fr`)
- Application : `https://dev.diaspomoney.fr`
- Mongo Express : `https://mongo.dev.diaspomoney.fr`

### Production (`app.diaspomoney.fr`)
- Application : `https://app.diaspomoney.fr`
- Mongo Express : `https://mongo.diaspomoney.fr`

### Commun
- Dashboard Traefik : `https://dashboard.diaspomoney.fr`

## Variables d'environnement

### Fichiers `.env`
- `.env.dev` : Variables pour l'environnement de développement
- `.env.prod` : Variables pour l'environnement de production

### Variables importantes
```bash
# MongoDB
MONGO_PASSWORD=...
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=...

# Redis
REDIS_PASSWORD=...

# Traefik Dashboard Auth (format htpasswd)
TRAEFIK_DASHBOARD_AUTH=admin:$apr1$...

# Application
NODE_ENV=development|production
NEXT_PUBLIC_API_URL=https://dev.diaspomoney.fr|https://app.diaspomoney.fr
NEXTAUTH_URL=https://dev.diaspomoney.fr|https://app.diaspomoney.fr
```

## Certificats SSL

Traefik gère automatiquement les certificats Let's Encrypt pour tous les domaines via le resolver `le`.

Les certificats sont stockés dans le volume `traefik_letsencrypt`.

## Troubleshooting

### Traefik ne voit pas les services
1. Vérifier que Traefik est connecté aux bons réseaux :
   ```bash
   docker network inspect traefik | grep -A 5 "Containers"
   ```

2. Vérifier les labels Traefik sur les services :
   ```bash
   docker inspect diaspomoney-app-dev | grep -A 10 "Labels"
   ```

### Certificats SSL non générés
1. Vérifier les logs Traefik :
   ```bash
   docker-compose -f docker-compose.traefik.yml logs traefik | grep -i acme
   ```

2. Vérifier que les domaines pointent vers le serveur

### Services ne peuvent pas communiquer
1. Vérifier que les services sont sur le même réseau :
   ```bash
   docker network inspect diaspomoney-dev
   ```

2. Utiliser les noms de conteneurs pour la communication interne (ex: `mongodb-dev`, `redis-dev`)

