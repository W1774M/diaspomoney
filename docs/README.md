# DiaspoMoney - Documentation Complète

## 📋 Table des Matières

### 🚀 [Guide de Démarrage](./README.md#guide-de-démarrage)

- Installation et configuration
- Premiers pas avec le projet
- Structure du projet

### 🗄️ [Architecture Base de Données](./README-DATABASE.md)

- Modèles MongoDB (Provider, Appointment, RetryToken)
- API Routes et hooks personnalisés
- Migration des données statiques
- Performance et optimisation

### 🐳 [Configuration Docker](./DOCKER_SETUP.md)

- Installation et configuration Docker
- Services MongoDB et Redis
- Scripts d'initialisation
- Monitoring et logs

### 📧 [Configuration Email](./EMAIL_SETUP.md)

- Configuration SMTP
- Templates d'emails
- Notifications de réservation
- Gestion des erreurs de paiement

## 🎯 Vue d'Ensemble du Projet

**DiaspoMoney** est une plateforme de réservation de services en Afrique, permettant aux utilisateurs de réserver des services dans trois catégories principales :

- 🏥 **Santé** - Cliniques, médecins, hôpitaux
- 🎓 **Éducation** - Écoles, universités, formations
- 🏗️ **BTP & Immobilier** - Construction, rénovation, immobilier

## 🛠️ Technologies Utilisées

- **Frontend** : Next.js 14, React, TypeScript, Tailwind CSS
- **Backend** : Next.js API Routes, MongoDB, Mongoose
- **Base de Données** : MongoDB avec Docker
- **Email** : Nodemailer pour les notifications
- **Paiements** : Intégration de système de paiement
- **Tests** : Vitest

## 📁 Structure du Projet

```
diaspomoney/
├── app/                    # Pages Next.js (App Router)
│   ├── api/               # API Routes
│   ├── provider/[id]/     # Page prestataire
│   ├── search/            # Page de recherche
│   └── ...
├── components/            # Composants React
│   ├── features/          # Composants métier
│   ├── layout/            # Composants de mise en page
│   └── ui/                # Composants UI réutilisables
├── models/                # Modèles Mongoose
├── hooks/                 # Hooks personnalisés
├── lib/                   # Utilitaires et données
├── docs/                  # Documentation
└── scripts/               # Scripts utilitaires
```

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/diaspomoney

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app

# NextAuth
NEXTAUTH_SECRET=votre-secret-nextauth
NEXTAUTH_URL=http://localhost:3000

# JWT
JWT_SECRET=votre-secret-jwt
```

### Docker

Le projet utilise Docker Compose pour la base de données :

```bash
# Démarrer les services
docker-compose up -d

# Voir les logs
docker-compose logs

# Arrêter les services
docker-compose down
```

## 🚀 Scripts Disponibles

```bash
# Développement
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run start            # Serveur de production

# Base de données
npm run migrate          # Migrer les données vers MongoDB

# Tests
npm run test             # Lancer les tests
npm run test:ui          # Interface de tests

# Linting
npm run lint             # Vérifier le code
```

## 📊 Fonctionnalités Principales

### 🔍 Recherche et Filtrage

- Recherche par type de service (Santé, Éducation, BTP)
- Filtres par spécialité, localisation, prix
- Tri par recommandation, prix, évaluations
- Pagination côté serveur

### 📅 Système de Réservation

- Sélection de service et créneau
- Formulaire de réservation complet
- Validation des données
- Génération de numéro de réservation unique

### 💳 Paiements

- Intégration de système de paiement
- Confirmation par email
- Gestion des échecs de paiement
- Liens de retry sécurisés

### 📧 Notifications

- Emails de confirmation de réservation
- Emails d'erreur de paiement avec lien de retry
- Templates HTML personnalisés

## 🔒 Sécurité

- **Validation des données** avec Mongoose
- **Sanitisation** des entrées utilisateur
- **Tokens sécurisés** pour les retry de paiement
- **TTL Index** pour nettoyage automatique
- **Types TypeScript** pour la sécurité des types

## 📈 Performance

- **Index MongoDB** optimisés
- **Pagination** côté serveur
- **Cache** des requêtes fréquentes
- **Lazy loading** des composants
- **Optimisation** des images

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📞 Support

Pour toute question ou problème :

- 📧 Email : contact@diaspomoney.fr
- 🐛 Issues : [GitHub Issues](https://github.com/votre-repo/issues)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

**DiaspoMoney** - Simplifiez vos réservations de services en Afrique 🌍
