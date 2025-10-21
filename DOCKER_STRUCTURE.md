# Structure Docker Simplifiée - DiaspoMoney

## Vue d'ensemble

Cette structure Docker a été simplifiée selon le principe suivant :

- **Un Dockerfile unique** pour dev/prod
- **docker-compose.prod.yml** pour la production complète
- **docker-compose.yml** pour le développement local basique

## Fichiers Docker

### 1. Dockerfile

- **Localisation** : `./Dockerfile`
- **Usage** : Build unique pour développement et production
- **Fonctionnalités** :
  - Multi-stage build optimisé
  - Utilisateur non-root (sécurité)
  - Health check intégré
  - Gestion des signaux avec dumb-init

### 2. docker-compose.yml (Développement local)

- **Usage** : `docker-compose up`
- **Services inclus** :
  - MongoDB (port 27017)
  - Redis (port 6379)
  - Mongo Express (port 8081)
  - Prometheus + Grafana (optionnel, profile monitoring)

### 3. docker-compose.prod.yml (Production)

- **Usage** : `docker-compose -f docker-compose.prod.yml up`
- **Services inclus** :
  - Traefik (reverse proxy + SSL)
  - Application DiaspoMoney
  - MongoDB
  - Redis
  - Prometheus + Grafana
  - Mongo Express (admin)

## Commandes utiles

### Développement local

```bash
# Démarrer les services de base
docker-compose up -d

# Démarrer avec monitoring
docker-compose --profile monitoring up -d

# Arrêter tous les services
docker-compose down
```

### Production

```bash
# Démarrer la production
docker-compose -f docker-compose.prod.yml up -d

# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f

# Arrêter la production
docker-compose -f docker-compose.prod.yml down
```

### Build de l'image

```bash
# Build pour développement
docker build -t diaspomoney:dev .

# Build pour production
docker build -t diaspomoney:prod .
```

## Configuration Kubernetes

La configuration k8s dans `./k8s/` est compatible avec le nouveau Dockerfile unique et utilise :

- Image : `ghcr.io/diaspomoney/diaspomoney:latest`
- Auto-scaling horizontal
- Health checks
- Sécurité (utilisateur non-root)

## Variables d'environnement

### Développement

- MongoDB : `admin/password123`
- Redis : `redis123`
- Mongo Express : `admin/admin123`

### Production

- Utilise les variables d'environnement définies dans `.env`
- SSL automatique avec Let's Encrypt
- Monitoring intégré

## Monitoring

### Développement

```bash
# Activer le monitoring
docker-compose --profile monitoring up -d

# Accès :
# - Prometheus : http://localhost:9090
# - Grafana : http://localhost:3001 (admin/admin123)
```

### Production

- **Prometheus** : https://dashboard.diaspomoney.fr/prometheus
- **Grafana** : https://dashboard.diaspomoney.fr/grafana
- **Mongo Express** : https://mongo.diaspomoney.fr

## Sécurité

- Utilisateur non-root dans le conteneur
- Secrets gérés via variables d'environnement
- SSL/TLS automatique en production
- Health checks pour tous les services
- Isolation réseau appropriée
