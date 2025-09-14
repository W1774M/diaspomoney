# Structure du Projet Diaspomoney

## Vue d'ensemble

Ce document décrit l'organisation optimisée du projet Diaspomoney pour une meilleure lisibilité et maintenabilité.

## Structure des dossiers

```
diaspomoney/
├── app/                          # Pages et routes Next.js 13+
│   ├── api/                      # Routes API
│   │   ├── auth/                 # Routes d'authentification
│   │   ├── appointments/         # Routes de rendez-vous
│   │   ├── providers/            # Routes de prestataires
│   │   └── users/                # Routes utilisateurs
│   ├── dashboard/                # Pages du tableau de bord
│   ├── login/                    # Page de connexion
│   ├── register/                 # Page d'inscription
│   ├── support/                  # Page de support
│   ├── hotline/                  # Page de hotline
│   └── layout.tsx                # Layout principal
├── components/                   # Composants React
│   ├── common/                   # Composants communs
│   ├── features/                 # Composants spécifiques aux fonctionnalités
│   │   ├── auth/                 # Composants d'authentification
│   │   ├── appointments/         # Composants de rendez-vous
│   │   ├── payments/             # Composants de paiement
│   │   └── providers/            # Composants de prestataires
│   ├── forms/                    # Composants de formulaires
│   ├── home/                     # Composants de la page d'accueil
│   ├── layout/                   # Composants de mise en page
│   │   ├── footer/               # Pied de page
│   │   └── header/               # En-tête
│   ├── providers/                # Composants de prestataires
│   └── ui/                       # Composants UI de base
├── config/                       # Configuration
│   ├── database.ts               # Configuration base de données
│   ├── env/                      # Variables d'environnement
│   ├── security.ts               # Configuration sécurité
│   └── secrets.ts                # Secrets et clés
├── docs/                         # Documentation
│   ├── API.md                    # Documentation API
│   ├── COMPONENTS.md             # Documentation composants
│   ├── DOCKER_SETUP.md           # Configuration Docker
│   └── PROJECT_STRUCTURE.md      # Ce fichier
├── hooks/                        # Hooks personnalisés
│   ├── api/                      # Hooks pour les appels API
│   ├── auth/                     # Hooks d'authentification
│   ├── data/                     # Hooks de gestion des données
│   ├── forms/                    # Hooks de formulaires
│   └── ui/                       # Hooks d'interface utilisateur
├── lib/                          # Utilitaires et helpers
│   ├── api-client.ts             # Client API
│   ├── datas/                    # Données statiques
│   ├── email.ts                  # Service email
│   ├── mongodb.ts                # Configuration MongoDB
│   ├── security.ts               # Utilitaires de sécurité
│   ├── session-security.ts       # Gestion des sessions
│   ├── utils.ts                  # Utilitaires généraux
│   └── validations.ts            # Schémas de validation
├── middleware/                   # Middleware Next.js
│   └── security.ts               # Middleware de sécurité
├── models/                       # Modèles Mongoose
│   ├── Appointment.ts            # Modèle de rendez-vous
│   ├── User.ts                   # Modèle utilisateur
│   └── ...
├── public/                       # Fichiers statiques
│   ├── img/                      # Images
│   └── ...
├── scripts/                      # Scripts utilitaires
│   ├── check-imports.ts          # Vérification des imports
│   ├── clean-install.sh          # Nettoyage et installation
│   └── ...
├── store/                        # État global (Zustand)
│   ├── auth.ts                   # État d'authentification
│   ├── notifications.ts          # État des notifications
│   └── theme.ts                  # État du thème
├── styles/                       # Styles CSS
│   ├── globals.css               # Styles globaux
│   └── themes/                   # Thèmes
├── test/                         # Tests (nouvelle organisation)
│   ├── README.md                 # Documentation des tests
│   ├── setup.ts                  # Configuration des tests
│   ├── fixtures/                 # Données de test
│   ├── unit/                     # Tests unitaires
│   │   ├── components/           # Tests des composants
│   │   ├── hooks/                # Tests des hooks
│   │   ├── lib/                  # Tests des utilitaires
│   │   ├── models/               # Tests des modèles
│   │   └── validations/          # Tests des validations
│   ├── integration/              # Tests d'intégration
│   │   ├── api/                  # Tests des routes API
│   │   ├── database/             # Tests base de données
│   │   └── e2e/                  # Tests end-to-end
│   └── security/                 # Tests de sécurité
├── types/                        # Types TypeScript
├── .env.example                  # Exemple de variables d'environnement
├── .gitignore                    # Fichiers ignorés par Git
├── docker-compose.yml            # Configuration Docker
├── next.config.ts                # Configuration Next.js
├── package.json                  # Dépendances et scripts
├── tailwind.config.mjs           # Configuration Tailwind CSS
├── tsconfig.json                 # Configuration TypeScript
└── vitest.config.ts              # Configuration Vitest
```

## Principes d'organisation

### 1. Séparation des responsabilités
- **app/**: Pages et routes Next.js
- **components/**: Composants React réutilisables
- **lib/**: Utilitaires et services
- **hooks/**: Logique métier réutilisable
- **models/**: Définition des données
- **test/**: Tests organisés par type

### 2. Organisation des composants
- **ui/**: Composants de base (boutons, inputs, etc.)
- **layout/**: Composants de mise en page
- **features/**: Composants spécifiques aux fonctionnalités
- **common/**: Composants partagés entre fonctionnalités

### 3. Organisation des tests
- **unit/**: Tests unitaires par module
- **integration/**: Tests d'intégration
- **security/**: Tests de sécurité
- **fixtures/**: Données de test réutilisables

### 4. Configuration centralisée
- **config/**: Toutes les configurations
- **middleware/**: Middleware Next.js
- **scripts/**: Scripts utilitaires

## Conventions de nommage

### Fichiers
- **Composants React**: PascalCase (ex: `LoginForm.tsx`)
- **Hooks**: camelCase avec préfixe `use` (ex: `useAuth.ts`)
- **Utilitaires**: camelCase (ex: `api-client.ts`)
- **Tests**: `.test.ts` ou `.test.tsx`
- **Types**: PascalCase (ex: `User.ts`)

### Dossiers
- **Pages**: kebab-case (ex: `forgot-password/`)
- **Composants**: camelCase (ex: `loginForm/`)
- **API routes**: kebab-case (ex: `send-confirmation/`)

## Scripts disponibles

```bash
# Développement
npm run dev                    # Serveur de développement
npm run build                  # Build de production
npm run start                  # Serveur de production

# Tests
npm run test                   # Tous les tests
npm run test:unit              # Tests unitaires uniquement
npm run test:integration       # Tests d'intégration uniquement
npm run test:security          # Tests de sécurité uniquement
npm run test:coverage          # Tests avec couverture
npm run test:watch             # Tests en mode watch

# Qualité
npm run lint                   # Linting
npm run quality:check          # Vérification complète
npm run pre-commit             # Pré-commit hooks

# Docker
npm run docker:dev             # Développement avec Docker
npm run docker:prod            # Production avec Docker
```

## Bonnes pratiques

### 1. Imports
- Utiliser les alias `@/` pour les imports absolus
- Importer les types avec `import type`
- Éviter les imports circulaires

### 2. Tests
- Un test par comportement
- Utiliser des fixtures pour les données de test
- Mocker les dépendances externes
- Tester les cas d'erreur

### 3. Sécurité
- Valider toutes les entrées utilisateur
- Utiliser des tokens CSRF
- Implémenter la rate limiting
- Sanitiser les données

### 4. Performance
- Lazy loading des composants
- Optimisation des images
- Mise en cache appropriée
- Bundle splitting

## Migration depuis l'ancienne structure

1. **Tests**: Déplacer tous les tests vers `/test/`
2. **Lib**: Déplacer les fichiers de `public/lib/` vers `/lib/`
3. **Composants**: Réorganiser selon la nouvelle structure
4. **Configuration**: Centraliser dans `/config/`

## Maintenance

- Mettre à jour cette documentation lors des changements
- Maintenir la cohérence des conventions
- Réviser régulièrement l'organisation
- Documenter les nouvelles fonctionnalités
