# Tests End-to-End avec Cypress - DiaspoMoney

Ce dossier contient les tests end-to-end avec Cypress pour l'application DiaspoMoney, couvrant le processus complet d'authentification et d'inscription.

## 📁 Structure des Tests

```
cypress/
├── e2e/
│   ├── auth.cy.ts          # Tests d'authentification et inscription
│   ├── email.cy.ts         # Tests spécifiques d'envoi d'emails
│   └── api.cy.ts          # Tests des endpoints API
├── support/
│   ├── commands.ts        # Commandes personnalisées
│   └── e2e.ts            # Configuration globale
├── fixtures/
│   └── users.json        # Données de test
├── cypress.config.ts     # Configuration Cypress
└── README.md            # Ce fichier
```

## 🚀 Installation et Configuration

### 1. Installer Cypress

```bash
npm install cypress --save-dev
```

### 2. Configuration

Les tests utilisent la configuration dans `cypress.config.ts` qui :

- Démarre automatiquement le serveur de développement
- Configure les timeouts et retries
- Gère les variables d'environnement
- Configure les plugins

## 🧪 Exécution des Tests

### Interface graphique (recommandé)

```bash
npm run test:open
```

### Tous les tests en mode headless

```bash
npm run test
```

### Tests spécifiques

```bash
# Tests d'authentification uniquement
npm run test:auth

# Tests d'emails uniquement
npm run test:email

# Tests d'API uniquement
npm run test:api
```

### Mode avec navigateur visible

```bash
npm run test:headed
```

### Tests en CI

```bash
npm run test:ci
```

### Enregistrement des tests

```bash
npm run test:record
```

## 📋 Tests Inclus

### 🔐 Authentification (`auth.cy.ts`)

- ✅ Inscription complète avec succès
- ✅ Inscription avec erreurs de validation
- ✅ Inscription avec email déjà existant
- ✅ Connexion avec identifiants valides
- ✅ Connexion avec identifiants invalides
- ✅ Gestion des comptes inactifs
- ✅ Déconnexion utilisateur
- ✅ Persistance de session
- ✅ Tests responsive (mobile/tablette)

### 📧 Emails (`email.cy.ts`)

- ✅ Email de bienvenue avec tags valides
- ✅ Gestion des erreurs d'email
- ✅ Validation des tags email (caractères spéciaux)
- ✅ Tests avec emails contenant des accents

### 🔌 API (`api.cy.ts`)

- ✅ POST /api/auth/register - Inscription réussie
- ✅ POST /api/auth/register - Email déjà existant
- ✅ POST /api/auth/register - Données manquantes
- ✅ POST /api/auth/register - Mot de passe trop court
- ✅ POST /api/auth/register - Conditions non acceptées
- ✅ POST /api/auth/register - Inscription OAuth
- ✅ GET /api/users/me - Récupération profil
- ✅ POST /api/auth/complete-profile - Complétion profil

## 🛠️ Commandes Personnalisées

### Créer un utilisateur de test

```typescript
cy.createTestUser({
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
  // ... autres champs
});
```

### Se connecter

```typescript
cy.loginUser('test@example.com', 'password123');
```

### Nettoyer un utilisateur

```typescript
cy.cleanupTestUser('test@example.com');
```

### Attendre un email

```typescript
cy.waitForEmail(5000); // 5 secondes
```

### Vérifier les tags d'email

```typescript
cy.verifyEmailTags([
  { name: 'service', value: 'diaspomoney' },
  { name: 'user_email', value: 'test_example_com' },
]);
```

## 🎯 Scénarios Testés

### 1. Inscription Complète

1. Remplir le formulaire d'inscription (4 étapes)
2. Vérifier la validation des champs
3. Soumettre le formulaire
4. Vérifier la page de succès
5. Vérifier l'envoi d'email

### 2. Gestion des Erreurs

1. Tests avec données manquantes
2. Tests avec emails existants
3. Tests avec mots de passe invalides
4. Tests avec conditions non acceptées

### 3. Connexion/Déconnexion

1. Connexion avec identifiants valides
2. Connexion avec identifiants invalides
3. Gestion des comptes inactifs
4. Déconnexion et persistance de session

### 4. Envoi d'Emails

1. Validation des tags Resend
2. Gestion des caractères spéciaux
3. Gestion des erreurs d'envoi
4. Tests avec emails contenant des accents

## 🔧 Configuration

### Variables d'Environnement

```typescript
// cypress.config.ts
env: {
  apiUrl: 'http://localhost:3000/api',
  testUser: {
    email: 'test@diaspomoney.com',
    password: 'password123',
  },
}
```

### Configuration Cypress

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    // ... autres configurations
  },
});
```

## 📊 Rapports et Résultats

### Rapports HTML

Cypress génère automatiquement des rapports HTML avec :

- Screenshots des échecs
- Vidéos des tests
- Traces des interactions
- Métriques de performance

### Rapports JSON

```json
{
  "stats": {
    "suites": 3,
    "tests": 15,
    "passes": 14,
    "failures": 1,
    "pending": 0,
    "skipped": 0
  }
}
```

## 🐛 Debugging

### Mode Debug

```bash
npm run test:open
```

### Logs Détaillés

Les tests incluent des logs détaillés pour :

- Appels API interceptés
- Tags email nettoyés
- Erreurs capturées
- Screenshots automatiques

### Time Travel

Cypress permet de "voyager dans le temps" pour :

- Voir l'état de l'application à chaque étape
- Déboguer les interactions
- Comprendre les échecs

## 🚀 CI/CD

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:ci
```

### Variables CI

```bash
# GitHub Actions
GITHUB_TOKEN=your_token
CYPRESS_RECORD_KEY=your_record_key

# Docker
DOCKER_BUILDKIT=1
```

## 📝 Bonnes Pratiques

### 1. Isolation des Tests

- Chaque test utilise des données uniques
- Nettoyage automatique après les tests
- Pas de dépendances entre les tests

### 2. Gestion des Données

- Utilisation de fixtures réutilisables
- Données de test prévisibles
- Nettoyage automatique

### 3. Gestion des Erreurs

- Tests des cas d'erreur
- Validation des messages d'erreur
- Gestion des timeouts

### 4. Performance

- Tests optimisés
- Timeouts appropriés
- Attentes intelligentes

## 🔍 Maintenance

### Mise à Jour des Tests

1. Vérifier les sélecteurs CSS/HTML
2. Adapter aux changements d'interface
3. Mettre à jour les données de test
4. Vérifier les endpoints API

### Ajout de Nouveaux Tests

1. Créer le fichier de test
2. Utiliser les commandes personnalisées
3. Ajouter les données de test
4. Documenter le scénario
5. Mettre à jour ce README

## 📞 Support

Pour toute question sur les tests end-to-end :

- Consulter la documentation Cypress
- Vérifier les logs de test
- Utiliser le mode debug
- Contacter l'équipe de développement

## 🎉 Avantages de Cypress

### Interface Utilisateur

- **Time Travel** - Voyage dans le temps des tests
- **Debugging visuel** - Voir l'état de l'application
- **Screenshots automatiques** - Captures d'écran des échecs
- **Vidéos des tests** - Enregistrement complet

### Syntaxe Intuitive

```typescript
// Plus simple et lisible
cy.get('input[type="email"]').type('test@example.com');
cy.contains('button', 'Suivant').click();
cy.get('h3').should('contain', 'Destination et services');
```

### Ecosystem Mature

- **Plugins** - Extensions pour toutes les fonctionnalités
- **Community** - Grande communauté active
- **Documentation** - Documentation excellente
- **Support** - Support communautaire fort
