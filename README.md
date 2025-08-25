# DiaspoMoney - Plateforme de Services en Afrique

[![Tests](https://github.com/diaspomoney/diaspomoney/actions/workflows/test.yml/badge.svg)](https://github.com/diaspomoney/diaspomoney/actions/workflows/test.yml)
[![Security](https://github.com/diaspomoney/diaspomoney/actions/workflows/security.yml/badge.svg)](https://github.com/diaspomoney/diaspomoney/actions/workflows/security.yml)
[![Coverage](https://codecov.io/gh/diaspomoney/diaspomoney/branch/main/graph/badge.svg)](https://codecov.io/gh/diaspomoney/diaspomoney)

## 🚀 Vue d'ensemble

DiaspoMoney est une plateforme moderne et sécurisée qui connecte les utilisateurs de la diaspora avec des prestataires de services qualifiés en Afrique. L'application offre une expérience utilisateur fluide avec des fonctionnalités avancées d'authentification, de réservation et de paiement.

## ✨ Fonctionnalités principales

### 🔐 Authentification sécurisée

- **Connexion multi-stratégies** : Email/mot de passe et Google OAuth
- **Validation stricte** : Mots de passe forts avec indicateur visuel
- **Protection CSRF** : Tokens de sécurité pour tous les formulaires
- **Rate limiting** : Protection contre les attaques par force brute
- **Sessions sécurisées** : Gestion avancée des sessions utilisateur

### 🏢 Gestion des prestataires

- **Catalogue complet** : Recherche et filtrage avancés
- **Profils détaillés** : Informations complètes et avis clients
- **Services multiples** : Gestion des différents services proposés
- **Géolocalisation** : Filtrage par pays et région

### 📅 Système de rendez-vous

- **Réservation en ligne** : Interface intuitive pour les rendez-vous
- **Gestion des créneaux** : Disponibilités en temps réel
- **Notifications** : Emails de confirmation et rappels
- **Suivi des statuts** : Pending, confirmé, terminé, annulé

### 💳 Paiements sécurisés

- **Validation des cartes** : Algorithme de Luhn intégré
- **Protection des données** : Chiffrement des informations sensibles
- **Gestion des erreurs** : Messages d'erreur clairs et informatifs

### 🛡️ Sécurité avancée

- **Headers de sécurité** : CSP, XSS Protection, Frame Options
- **Sanitisation automatique** : Protection contre les injections
- **Validation côté serveur** : Schémas Zod stricts
- **Captcha intelligent** : Protection contre les bots

## 🛠️ Technologies utilisées

### Frontend

- **Next.js 14** : Framework React avec App Router
- **React 18** : Bibliothèque UI avec hooks avancés
- **TypeScript** : Typage statique pour la sécurité
- **Tailwind CSS** : Framework CSS utilitaire
- **Zod** : Validation de schémas
- **React Hook Form** : Gestion des formulaires
- **NextAuth.js** : Authentification complète

### Backend

- **Next.js API Routes** : API REST intégrée
- **MongoDB** : Base de données NoSQL
- **Mongoose** : ODM pour MongoDB
- **Nodemailer** : Envoi d'emails
- **bcryptjs** : Hachage des mots de passe
- **jsonwebtoken** : Gestion des tokens JWT

### Tests et Qualité

- **Vitest** : Framework de tests rapide
- **React Testing Library** : Tests de composants
- **MongoDB Memory Server** : Tests d'intégration
- **ESLint** : Linting du code
- **Prettier** : Formatage automatique

### DevOps

- **Docker** : Conteneurisation
- **Docker Compose** : Orchestration multi-services
- **Traefik** : Reverse proxy et load balancer
- **Prometheus** : Monitoring
- **Grafana** : Visualisation des métriques

## 📦 Installation

### Prérequis

- Node.js 18+
- pnpm (recommandé) ou npm
- MongoDB 6+
- Docker (optionnel)

### Installation locale

```bash
# Cloner le repository
git clone https://github.com/diaspomoney/diaspomoney.git
cd diaspomoney

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos configurations

# Lancer la base de données (optionnel avec Docker)
docker-compose up -d mongodb

# Lancer l'application en mode développement
pnpm dev
```

### Installation avec Docker

```bash
# Cloner et configurer
git clone https://github.com/diaspomoney/diaspomoney.git
cd diaspomoney

# Configurer les variables d'environnement
cp .env.example .env.local

# Lancer avec Docker Compose
docker-compose up -d
```

## 🧪 Tests

### Exécuter tous les tests

```bash
pnpm test
```

### Tests spécifiques

```bash
# Tests unitaires
pnpm test:unit

# Tests d'intégration
pnpm test:integration

# Tests de sécurité
pnpm test:security

# Tests avec couverture
pnpm test:coverage
```

### Interface de tests

```bash
pnpm test:ui
```

## 🔒 Sécurité

### Vérifications de sécurité

```bash
# Audit des dépendances
pnpm security:audit

# Tests de sécurité complets
pnpm security:check

# Vérification de qualité complète
pnpm quality:check
```

### Fonctionnalités de sécurité implémentées

- ✅ **Validation stricte des données** avec Zod
- ✅ **Sanitisation automatique** des entrées utilisateur
- ✅ **Protection CSRF** sur tous les formulaires
- ✅ **Rate limiting** intelligent
- ✅ **Headers de sécurité** complets
- ✅ **Validation des mots de passe** forts
- ✅ **Protection XSS** et injection
- ✅ **Sessions sécurisées** avec rotation des tokens
- ✅ **Captcha** contre les bots
- ✅ **Chiffrement** des données sensibles

## 📚 Documentation

### Documentation technique

- [API Documentation](./docs/API.md) - Documentation complète de l'API
- [Components Documentation](./docs/COMPONENTS.md) - Guide des composants React
- [Database Documentation](./docs/README-DATABASE.md) - Structure de la base de données
- [Docker Setup](./docs/DOCKER_SETUP.md) - Configuration Docker
- [Email Setup](./docs/EMAIL_SETUP.md) - Configuration des emails

### Guides utilisateur

- [Guide de démarrage](./docs/GETTING_STARTED.md)
- [Guide de déploiement](./docs/DEPLOYMENT.md)
- [Guide de contribution](./docs/CONTRIBUTING.md)

## 🏗️ Architecture

### Structure du projet

```
diaspomoney/
├── app/                    # Pages Next.js (App Router)
│   ├── api/               # Routes API
│   ├── auth/              # Pages d'authentification
│   ├── dashboard/         # Dashboard utilisateur
│   └── provider/          # Pages des prestataires
├── components/            # Composants React
│   ├── ui/               # Composants UI de base
│   ├── features/         # Composants spécifiques
│   └── layout/           # Composants de mise en page
├── lib/                  # Utilitaires et configurations
│   ├── validations.ts    # Schémas de validation
│   ├── server-validation.ts # Validation côté serveur
│   └── session-security.ts # Gestion des sessions
├── models/               # Modèles Mongoose
├── hooks/                # Hooks React personnalisés
├── store/                # État global (Zustand)
├── middleware/           # Middleware de sécurité
├── test/                 # Tests
│   ├── unit/            # Tests unitaires
│   ├── integration/     # Tests d'intégration
│   └── security/        # Tests de sécurité
└── docs/                # Documentation
```

### Flux de données

```
Utilisateur → Interface React → API Routes → MongoDB
                ↓
            Validation Zod → Sanitisation → Base de données
                ↓
            Session Security → Rate Limiting → Réponse sécurisée
```

## 🚀 Déploiement

### Environnements supportés

- **Développement** : Local avec hot reload
- **Staging** : Tests et validation
- **Production** : Optimisé et sécurisé

### Plateformes de déploiement

- **Vercel** : Déploiement automatique
- **Docker** : Conteneurisation complète
- **AWS** : Infrastructure cloud
- **On-premise** : Serveurs privés

## 🤝 Contribution

### Comment contribuer

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de code

- **TypeScript** strict
- **ESLint** et **Prettier** configurés
- **Tests** obligatoires pour les nouvelles fonctionnalités
- **Documentation** mise à jour

### Tests avant commit

```bash
# Vérification automatique
pnpm pre-commit

# Ou manuellement
pnpm quality:check
```

## 📊 Monitoring et Analytics

### Métriques collectées

- **Performance** : Temps de réponse, utilisation CPU/RAM
- **Sécurité** : Tentatives d'attaque, violations de rate limiting
- **Utilisation** : Pages visitées, actions utilisateurs
- **Erreurs** : Logs d'erreur, stack traces

### Outils de monitoring

- **Prometheus** : Collecte de métriques
- **Grafana** : Visualisation des données
- **Loki** : Centralisation des logs
- **Traefik** : Monitoring du trafic

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

### Contact

- **Email** : support@diaspomoney.com
- **Documentation** : https://docs.diaspomoney.com
- **Issues** : https://github.com/diaspomoney/diaspomoney/issues

### Équipe

- **Développement** : dev@diaspomoney.com
- **Sécurité** : security@diaspomoney.com
- **Support** : support@diaspomoney.com

## 🙏 Remerciements

- **Next.js** pour le framework exceptionnel
- **Vercel** pour l'hébergement et le déploiement
- **MongoDB** pour la base de données
- **Communauté open source** pour les outils et bibliothèques

---

**DiaspoMoney** - Connecter la diaspora avec l'Afrique 🌍
