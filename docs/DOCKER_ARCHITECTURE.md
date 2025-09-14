# Architecture Docker DiaspoMoney

## Structure des fichiers

L'architecture Docker utilise une approche de fichiers combinés pour séparer les environnements :

### Fichiers de base

- `docker-compose.yml` : Services communs (MongoDB, Mongo Express)
- `docker-compose.dev.yml` : Configuration spécifique au développement
- `docker-compose.prod.yml` : Configuration spécifique à la production

### Combinaisons d'environnements

#### Développement

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

- **Application** : http://localhost:3000 (hot reload)
- **Mongo Express** : http://localhost:8081
- **MongoDB** : mongodb://admin:admin123@localhost:27017/diaspomoney

#### Production

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

- **Application** : https://app.diaspomoney.fr
- **Mongo Express** : https://mongo.diaspomoney.fr
- **Dashboard Traefik** : https://dashboard.diaspomoney.fr
- **Monitoring** : https://dashboard.diaspomoney.fr/grafana/

## Services disponibles

### Services communs (docker-compose.yml)

- **mongodb** : Base de données MongoDB 7.0
- **mongo-express** : Interface web pour MongoDB
  - En développement : accessible sur http://localhost:8081
  - En production : accessible sur https://mongo.diaspomoney.fr (via Traefik)

### Services de développement (docker-compose.dev.yml)

- **app** : Application Next.js avec hot reload
  - Port exposé : 3000
  - Volume monté pour le développement

### Services de production (docker-compose.prod.yml)

- **traefik** : Reverse proxy avec SSL/TLS
- **app** : Application Next.js optimisée
- **monitoring** : Prometheus, Grafana, Loki (via compose.monitoring.yml)

## Scripts de déploiement

### Développement

```bash
./scripts/start-dev.sh
```

### Production

```bash
./scripts/prod-setup.sh
```

## Accès aux services

### En développement

- Application : http://localhost:3000
- Mongo Express : http://localhost:8081
  - Utilisateur : admin
  - Mot de passe : admin123

### En production

- Application : https://app.diaspomoney.fr
- Mongo Express : https://mongo.diaspomoney.fr
  - Authentification Traefik requise
- Dashboard Traefik : https://dashboard.diaspomoney.fr
  - Authentification Traefik requise

## Configuration des domaines

Pour la production, assurez-vous que les domaines suivants pointent vers votre serveur :

- `app.diaspomoney.fr`
- `mongo.diaspomoney.fr`
- `dashboard.diaspomoney.fr`

## Sécurité

### Production

- SSL/TLS automatique via Let's Encrypt
- Authentification basique pour les interfaces d'administration
- HSTS activé pour l'application principale

### Développement

- Accès direct aux ports (pas de proxy)
- Pas de SSL/TLS
- Authentification simplifiée
