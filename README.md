# Diaspomoney

Diaspomoney est une plateforme qui permet de trouver et réserver des services en Afrique. La plateforme facilite les transferts de services plutôt que d'argent.

## 🚀 Fonctionnalités

- **Authentification sécurisée** avec NextAuth.js
- **Gestion des utilisateurs** avec rôles (ADMIN, PROVIDER, CUSTOMER, CSM)
- **Système de rendez-vous** complet
- **Gestion des prestataires** avec géolocalisation
- **Système de facturation** intégré
- **Interface responsive** avec Tailwind CSS
- **Base de données MongoDB** avec Mongoose
- **Tests automatisés** avec Vitest
- **Déploiement Docker** prêt

## 🛠️ Technologies

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Base de données**: MongoDB avec Mongoose
- **Authentification**: NextAuth.js
- **Tests**: Vitest, Testing Library
- **Linting**: ESLint, Prettier
- **Déploiement**: Docker, Docker Compose

## 📋 Prérequis

- Node.js 18+
- pnpm (recommandé) ou npm
- MongoDB
- Docker (optionnel)

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone <repository-url>
cd diaspomoney
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Configuration de l'environnement

Créer un fichier `.env.local` à la racine du projet :

```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/diaspomoney

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Email (optionnel)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password

# Variables d'environnement supplémentaires
NODE_ENV=development
```

### 4. Lancer le développement

```bash
pnpm dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 🐳 Déploiement avec Docker

### 1. Lancer avec Docker Compose

```bash
cd docker
docker-compose up -d
```

### 2. Lancer en production

```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Tests

### Lancer tous les tests

```bash
pnpm test
```

### Tests unitaires

```bash
pnpm test:unit
```

### Tests d'intégration

```bash
pnpm test:integration
```

### Tests de sécurité

```bash
pnpm test:security
```

### Couverture de code

```bash
pnpm test:coverage
```

## 📁 Structure du projet

```
diaspomoney/
├── app/                    # Pages et API routes Next.js
│   ├── api/               # API routes
│   ├── dashboard/         # Pages du dashboard
│   └── ...
├── components/            # Composants React
│   ├── common/           # Composants communs
│   ├── features/         # Composants spécifiques
│   ├── layout/           # Composants de mise en page
│   └── ui/               # Composants UI de base
├── config/               # Configuration
├── hooks/                # Hooks React personnalisés
├── lib/                  # Utilitaires et helpers
├── models/               # Modèles Mongoose
├── store/                # État global (Zustand)
├── styles/               # Styles globaux
├── types/                # Types TypeScript
├── test/                 # Tests
└── docker/               # Configuration Docker
```

## 🔧 Scripts disponibles

- `pnpm dev` - Lancer le serveur de développement
- `pnpm build` - Construire pour la production
- `pnpm start` - Lancer le serveur de production
- `pnpm lint` - Linter le code
- `pnpm test` - Lancer les tests
- `pnpm type-check` - Vérifier les types TypeScript
- `pnpm quality:check` - Vérification complète de la qualité

## 🔐 Sécurité

- Authentification sécurisée avec NextAuth.js
- Validation des données avec Zod
- Protection CSRF
- Rate limiting
- Headers de sécurité avec Helmet
- Validation côté serveur

## 📊 Monitoring

Le projet inclut une configuration de monitoring avec :

- Prometheus pour les métriques
- Grafana pour la visualisation
- Loki pour les logs
- Traefik comme reverse proxy

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :

- Ouvrir une issue sur GitHub
- Consulter la documentation dans le dossier `docs/`
- Contacter l'équipe de développement

## 🔄 Changelog

### Version 0.1.0

- Refactoring complet du projet
- Fusion des fichiers en double
- Amélioration de la structure
- Ajout des dépendances manquantes
- Configuration ESLint et Prettier
- Tests automatisés
- Documentation complète
