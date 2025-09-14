# Tests Organization

## Structure des tests

```
test/
├── README.md                    # Documentation des tests
├── setup.ts                     # Configuration globale des tests
├── unit/                        # Tests unitaires
│   ├── components/              # Tests des composants React
│   │   ├── auth/               # Tests des composants d'authentification
│   │   ├── forms/              # Tests des composants de formulaires
│   │   ├── layout/             # Tests des composants de mise en page
│   │   └── ui/                 # Tests des composants UI de base
│   ├── hooks/                  # Tests des hooks personnalisés
│   ├── lib/                    # Tests des utilitaires et helpers
│   ├── models/                 # Tests des modèles de données
│   └── validations/            # Tests des schémas de validation
├── integration/                 # Tests d'intégration
│   ├── api/                    # Tests des routes API
│   │   ├── auth/              # Tests des routes d'authentification
│   │   ├── appointments/      # Tests des routes de rendez-vous
│   │   ├── providers/         # Tests des routes de prestataires
│   │   └── users/             # Tests des routes utilisateurs
│   ├── database/              # Tests d'intégration base de données
│   └── e2e/                   # Tests end-to-end
├── security/                   # Tests de sécurité
│   ├── middleware/            # Tests du middleware de sécurité
│   ├── authentication/        # Tests d'authentification
│   └── authorization/         # Tests d'autorisation
└── fixtures/                   # Données de test
    ├── users.json
    ├── appointments.json
    └── providers.json
```

## Conventions de nommage

- **Tests unitaires** : `*.test.ts` ou `*.test.tsx`
- **Tests d'intégration** : `*.integration.test.ts`
- **Tests de sécurité** : `*.security.test.ts`
- **Tests E2E** : `*.e2e.test.ts`

## Exécution des tests

```bash
# Tous les tests
npm test

# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration uniquement
npm run test:integration

# Tests de sécurité uniquement
npm run test:security

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```
