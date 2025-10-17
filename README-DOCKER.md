# DiaspoMoney - Développement Local avec Docker

Ce guide vous explique comment configurer et utiliser l'environnement de développement local de DiaspoMoney avec Docker.

## 🚀 Démarrage Rapide

### 1. Prérequis

- Docker et Docker Compose installés
- Node.js 18+ (pour le développement local si nécessaire)
- Git

### 2. Configuration

```bash
# Cloner le repository
git clone <repository-url>
cd diaspomoney

# Copier le fichier d'environnement
cp env.local.example .env.local

# Éditer les variables d'environnement
nano .env.local
```

### 3. Démarrage des Services

```bash
# Démarrer tous les services
./scripts/docker-local.sh start

# Ou avec Docker Compose directement
docker-compose -f docker-compose.local.yml up -d
```

## 📋 Services Inclus

### Services Principaux

- **Application Next.js** (Port 3000)
  - Hot reload activé
  - Variables d'environnement configurées
  - Volumes montés pour le développement

- **MongoDB** (Port 27017)
  - Base de données principale
  - Utilisateur: `admin` / Mot de passe: `password123`
  - Base de données: `diaspomoney`

- **Redis** (Port 6379)
  - Cache et sessions
  - Mot de passe: `redis123`

### Services Optionnels (Monitoring)

- **Prometheus** (Port 9090) - Métriques
- **Grafana** (Port 3001) - Tableaux de bord
  - Utilisateur: `admin` / Mot de passe: `admin123`

## 🛠️ Commandes Utiles

### Script de Gestion

```bash
# Démarrer les services
./scripts/docker-local.sh start

# Arrêter les services
./scripts/docker-local.sh stop

# Redémarrer les services
./scripts/docker-local.sh restart

# Voir les logs de l'application
./scripts/docker-local.sh logs

# Voir tous les logs
./scripts/docker-local.sh logs-all

# Statut des services
./scripts/docker-local.sh status

# Nettoyer l'environnement
./scripts/docker-local.sh clean

# Ouvrir un shell dans l'application
./scripts/docker-local.sh shell

# Ouvrir un shell MongoDB
./scripts/docker-local.sh db

# Ouvrir un shell Redis
./scripts/docker-local.sh redis

# Démarrer avec monitoring
./scripts/docker-local.sh monitoring
```

### Commandes Docker Compose Directes

```bash
# Démarrer tous les services
docker-compose -f docker-compose.local.yml up -d

# Démarrer avec monitoring
docker-compose -f docker-compose.local.yml --profile monitoring up -d

# Voir les logs
docker-compose -f docker-compose.local.yml logs -f app

# Arrêter les services
docker-compose -f docker-compose.local.yml down

# Nettoyer les volumes
docker-compose -f docker-compose.local.yml down -v
```

## 🔧 Configuration

### Variables d'Environnement

Éditez le fichier `.env.local` pour configurer :

```env
# Base de données
MONGODB_URI=mongodb://admin:password123@localhost:27017/diaspomoney?authSource=admin

# Cache
REDIS_URL=redis://:redis123@localhost:6379

# JWT (changez en production)
JWT_SECRET=your-super-secret-jwt-key-for-development
JWT_REFRESH_SECRET=your-super-secret-refresh-key-for-development

# Services externes
RESEND_API_KEY=re_your_resend_api_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### Services Externes

Pour un fonctionnement complet, configurez :

1. **Resend** (Email) - https://resend.com
2. **Stripe** (Paiements) - https://stripe.com
3. **Sentry** (Monitoring) - https://sentry.io (optionnel)

## 📊 Monitoring

### Avec Prometheus et Grafana

```bash
# Démarrer avec monitoring
./scripts/docker-local.sh monitoring
```

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin123)

### Métriques Disponibles

- Performance de l'application
- Utilisation des ressources
- Métriques MongoDB
- Métriques Redis
- Métriques personnalisées DiaspoMoney

## 🐛 Débogage

### Logs

```bash
# Logs de l'application
docker-compose -f docker-compose.local.yml logs -f app

# Logs de MongoDB
docker-compose -f docker-compose.local.yml logs -f mongodb

# Logs de Redis
docker-compose -f docker-compose.local.yml logs -f redis
```

### Accès aux Services

```bash
# Shell dans l'application
docker-compose -f docker-compose.local.yml exec app sh

# Shell MongoDB
docker-compose -f docker-compose.local.yml exec mongodb mongosh -u admin -p password123 --authenticationDatabase admin

# Shell Redis
docker-compose -f docker-compose.local.yml exec redis redis-cli -a redis123
```

## 🔄 Développement

### Hot Reload

L'application est configurée avec le hot reload activé. Les modifications du code sont automatiquement reflétées.

### Base de Données

```bash
# Se connecter à MongoDB
./scripts/docker-local.sh db

# Dans MongoDB shell
use diaspomoney
db.users.find()
```

### Cache Redis

```bash
# Se connecter à Redis
./scripts/docker-local.sh redis

# Dans Redis CLI
KEYS *
GET session:user123
```

## 🧹 Nettoyage

### Nettoyer l'Environnement

```bash
# Arrêter et supprimer les conteneurs
docker-compose -f docker-compose.local.yml down

# Supprimer les volumes (ATTENTION: supprime les données)
docker-compose -f docker-compose.local.yml down -v

# Nettoyer le système Docker
docker system prune -f
```

## 🚨 Dépannage

### Problèmes Courants

1. **Port déjà utilisé**

   ```bash
   # Vérifier les ports utilisés
   netstat -tulpn | grep :3000
   ```

2. **Problème de permissions**

   ```bash
   # Sur Linux/Mac
   chmod +x scripts/docker-local.sh
   ```

3. **Conteneurs qui ne démarrent pas**

   ```bash
   # Vérifier les logs
   docker-compose -f docker-compose.local.yml logs
   ```

4. **Problème de connexion à la base de données**
   ```bash
   # Vérifier que MongoDB est démarré
   docker-compose -f docker-compose.local.yml ps
   ```

## 📝 Notes Importantes

- Les données sont persistantes dans les volumes Docker
- Les variables d'environnement sont configurées pour le développement
- Le monitoring est optionnel et peut être activé avec le profil `monitoring`
- Les mots de passe par défaut ne doivent JAMAIS être utilisés en production

## 🔗 Liens Utiles

- **Application**: http://localhost:3000
- **MongoDB Express** (si installé): http://localhost:8081
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
