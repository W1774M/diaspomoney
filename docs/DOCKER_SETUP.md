# Configuration Docker pour DiaspoMoney

## Vue d'ensemble

Ce guide vous explique comment configurer et utiliser Docker pour développer DiaspoMoney avec une base de données MongoDB locale.

## Prérequis

- Docker et Docker Compose installés
- Node.js et pnpm installés
- Git installé

## Structure des fichiers

```
diaspomoney/
├── docker-compose.dev.yml    # Configuration Docker pour le développement
├── docker/
│   └── mongo-init.js         # Script d'initialisation MongoDB
├── config/
│   └── database.ts           # Configuration de connexion MongoDB
└── DOCKER_SETUP.md           # Ce fichier
```

## Services inclus

### 1. MongoDB (Base de données principale)

- **Port** : 27017
- **Version** : 7.0
- **Base de données** : diaspomoney
- **Utilisateur** : diaspomoney_user
- **Mot de passe** : diaspomoney_app_password

### 2. Mongo Express (Interface d'administration)

- **Port** : 8081
- **URL** : http://localhost:8081
- **Utilisateur** : admin
- **Mot de passe** : diaspomoney123

### 3. Redis (Cache et sessions)

- **Port** : 6379
- **Version** : 7-alpine

## Démarrage rapide

### 1. Créer le fichier .env.local

```bash
# Copier le fichier d'exemple
cp .env.example .env.local
```

Puis éditer `.env.local` avec vos configurations :

```env
# Configuration MongoDB
MONGODB_URI=mongodb://diaspomoney_user:diaspomoney_app_password@localhost:27017/diaspomoney

# Configuration SMTP pour l'envoi d'emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Configuration de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Configuration Redis (optionnel)
REDIS_URL=redis://localhost:6379

# Clés secrètes
JWT_SECRET=your-super-secret-jwt-key-here
NEXTAUTH_SECRET=your-nextauth-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Configuration de l'environnement
NODE_ENV=development
```

### 2. Démarrer les services Docker

```bash
# Démarrer tous les services
docker-compose -f docker-compose.dev.yml up -d

# Vérifier que les services sont démarrés
docker-compose -f docker-compose.dev.yml ps
```

### 3. Vérifier l'initialisation

```bash
# Voir les logs MongoDB
docker-compose -f docker-compose.dev.yml logs mongodb

# Voir les logs Mongo Express
docker-compose -f docker-compose.dev.yml logs mongo-express
```

### 4. Accéder aux interfaces

- **Mongo Express** : http://localhost:8081

  - Utilisateur : admin
  - Mot de passe : diaspomoney123

- **Application DiaspoMoney** : http://localhost:3000

## Commandes utiles

### Gestion des services

```bash
# Démarrer les services
docker-compose -f docker-compose.dev.yml up -d

# Arrêter les services
docker-compose -f docker-compose.dev.yml down

# Redémarrer les services
docker-compose -f docker-compose.dev.yml restart

# Voir les logs
docker-compose -f docker-compose.dev.yml logs

# Voir les logs d'un service spécifique
docker-compose -f docker-compose.dev.yml logs mongodb
```

### Gestion des données

```bash
# Supprimer les volumes (ATTENTION : supprime toutes les données)
docker-compose -f docker-compose.dev.yml down -v

# Sauvegarder la base de données
docker exec diaspomoney-mongodb mongodump --out /data/backup

# Restaurer la base de données
docker exec diaspomoney-mongodb mongorestore /data/backup
```

### Connexion à MongoDB

```bash
# Se connecter au shell MongoDB
docker exec -it diaspomoney-mongodb mongosh -u diaspomoney_user -p diaspomoney_app_password diaspomoney

# Se connecter en tant qu'admin
docker exec -it diaspomoney-mongodb mongosh -u admin -p diaspomoney123
```

## Collections créées automatiquement

Le script d'initialisation crée les collections suivantes :

### 1. providers

- Prestataires de services
- Données de démonstration incluses

### 2. appointments

- Réservations des clients
- Index sur email, provider, timeslot, status

### 3. users

- Utilisateurs de l'application
- Utilisateur admin créé par défaut

### 4. payments

- Historique des paiements
- Index sur appointmentId, status, createdAt

### 5. retry_tokens

- Tokens de retry pour les erreurs de paiement
- Index TTL pour expiration automatique

### 6. email_logs

- Logs des emails envoyés
- Index sur recipient, type, createdAt

### 7. payment_errors

- Erreurs de paiement
- Index sur appointmentId, errorType, createdAt

### 8. statistics

- Statistiques globales de l'application

## Données de démonstration

Le script d'initialisation ajoute automatiquement :

- **3 prestataires** de différents types (médical, beauté, restauration)
- **1 utilisateur admin** : admin@diaspomoney.fr
- **Statistiques initiales** de l'application

## Configuration de l'application

### Connexion MongoDB

L'application utilise la configuration dans `config/database.ts` :

```typescript
export const databaseConfig = {
  url:
    process.env.MONGODB_URI ||
    "mongodb://diaspomoney_user:diaspomoney_app_password@localhost:27017/diaspomoney",
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    bufferCommands: false,
  },
};
```

### Variables d'environnement

Assurez-vous que votre fichier `.env.local` contient :

```env
MONGODB_URI=mongodb://diaspomoney_user:diaspomoney_app_password@localhost:27017/diaspomoney
```

## Dépannage

### Problèmes courants

#### 1. Port déjà utilisé

```bash
# Vérifier les ports utilisés
netstat -tulpn | grep :27017
netstat -tulpn | grep :8081

# Arrêter les services qui utilisent ces ports
sudo systemctl stop mongod  # Si MongoDB est installé localement
```

#### 2. Erreur de connexion MongoDB

```bash
# Vérifier que le conteneur MongoDB est démarré
docker ps | grep mongodb

# Vérifier les logs
docker-compose -f docker-compose.dev.yml logs mongodb

# Redémarrer le service
docker-compose -f docker-compose.dev.yml restart mongodb
```

#### 3. Problème d'authentification

```bash
# Se connecter en tant qu'admin pour réinitialiser l'utilisateur
docker exec -it diaspomoney-mongodb mongosh -u admin -p diaspomoney123

# Dans le shell MongoDB
use diaspomoney
db.dropUser("diaspomoney_user")
db.createUser({
  user: "diaspomoney_user",
  pwd: "diaspomoney_app_password",
  roles: [{ role: "readWrite", db: "diaspomoney" }]
})
```

#### 4. Données corrompues

```bash
# Supprimer et recréer les volumes
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

## Sécurité

### En production

- Changez tous les mots de passe par défaut
- Utilisez des variables d'environnement sécurisées
- Configurez un réseau Docker privé
- Activez l'authentification MongoDB
- Utilisez des certificats SSL/TLS

### Variables sensibles

Ne committez jamais les fichiers suivants :

- `.env.local`
- `.env.production`
- Fichiers contenant des clés privées

## Support

Pour toute question ou problème :

1. Vérifiez les logs Docker : `docker-compose -f docker-compose.dev.yml logs`
2. Consultez la documentation MongoDB
3. Vérifiez la configuration dans `config/database.ts`
4. Contactez l'équipe de développement
