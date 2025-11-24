# Tests E2E avec Playwright

Ce dossier contient les tests end-to-end (E2E) utilisant Playwright pour tester le comportement complet de l'application dans un navigateur réel.

## 🚀 Pourquoi Playwright ?

Playwright a été choisi pour sa **performance supérieure** par rapport à Cypress :

- ✅ **Plus rapide** : Tests parallèles natifs, exécution plus rapide
- ✅ **Meilleure gestion des navigateurs** : Support natif de Chrome, Firefox, Safari
- ✅ **Support TypeScript natif** : Pas besoin de configuration supplémentaire
- ✅ **Meilleure intégration Next.js** : Support natif des routes Next.js
- ✅ **API moderne** : API plus intuitive et flexible
- ✅ **Meilleure gestion des timeouts** : Gestion automatique des attentes

## 📁 Structure

```
tests/e2e/
├── auth/
│   ├── authorization.spec.ts    # Tests du système d'autorisation
│   └── helpers.ts               # Helpers pour les tests d'autorisation
└── README.md                    # Ce fichier
```

## 🧪 Exécution des Tests

### Tous les tests E2E

```bash
pnpm test:e2e
```

### Tests en mode UI (interactif)

```bash
pnpm test:e2e:ui
```

### Tests en mode headed (avec navigateur visible)

```bash
pnpm test:e2e:headed
```

### Tests en mode debug

```bash
pnpm test:e2e:debug
```

### Tests spécifiques

```bash
# Un seul fichier
playwright test tests/e2e/auth/authorization.spec.ts

# Avec un navigateur spécifique
playwright test --project=chromium

# Avec plusieurs navigateurs
playwright test --project=chromium --project=firefox
```

## 📝 Tests d'Autorisation

Les tests d'autorisation vérifient :

- ✅ Redirections pour utilisateurs non authentifiés
- ✅ Messages d'erreur pour permissions insuffisantes
- ✅ Accès aux pages avec différents rôles (ADMIN, CSM, PROVIDER, CUSTOMER)
- ✅ Comportement des composants `AuthorizedRoute` et `AuthorizedContent`
- ✅ Vérification de propriété (ownership)

## 🔧 Configuration

La configuration Playwright se trouve dans `playwright.config.ts` à la racine du projet.

### Variables d'environnement

Les tests utilisent les variables d'environnement suivantes :

- `BASE_URL` : URL de base de l'application (défaut: `http://localhost:3000`)
- `CI` : Mode CI/CD (active les retries et réduit les workers)

### Serveur de développement

Playwright démarre automatiquement le serveur de développement Next.js avant les tests si `reuseExistingServer` est activé.

## 📊 Rapports

Les rapports de test sont générés dans :

- **HTML** : `playwright-report/index.html` (ouvrir avec `npx playwright show-report`)
- **JSON** : `test-results/results.json`
- **Console** : Sortie dans le terminal

## 🎯 Prochaines Étapes

Pour compléter les tests E2E, il faut :

1. **Implémenter la connexion réelle** dans les helpers
2. **Créer des utilisateurs de test** dans la base de données
3. **Ajouter des tests pour chaque page refactorisée**
4. **Créer des fixtures** pour les données de test réutilisables

## 📚 Ressources

- [Documentation Playwright](https://playwright.dev/)
- [Playwright avec Next.js](https://playwright.dev/docs/test-nextjs)
- [Best Practices Playwright](https://playwright.dev/docs/best-practices)

---

**Dernière mise à jour**: 2025-01-27

