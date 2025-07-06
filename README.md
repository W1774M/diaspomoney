# DiaspoMoney - Plateforme de Réservation de Services en Afrique

## 📚 Documentation

Toute la documentation du projet se trouve dans le dossier [`docs/`](./docs/) :

- **[README Principal](./docs/README.md)** - Guide général du projet
- **[Documentation Base de Données](./docs/README-DATABASE.md)** - Architecture MongoDB et migration des données
- **[Configuration Docker](./docs/DOCKER_SETUP.md)** - Guide d'installation et configuration Docker
- **[Configuration Email](./docs/EMAIL_SETUP.md)** - Guide de configuration des emails

## 🚀 Démarrage Rapide

### 1. Installation des dépendances

```bash
npm install
```

### 2. Démarrer la base de données MongoDB

```bash
docker-compose up -d
```

### 3. Migrer les données vers MongoDB

```bash
npm run migrate
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

### 5. Ouvrir l'application

```
http://localhost:3000
```

## 📖 Pour plus d'informations

Consultez la documentation complète dans le dossier [`docs/`](./docs/).
