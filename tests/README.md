# Tests - DiaspoMoney

Ce dossier contient tous les tests unitaires et d'intégration pour l'application DiaspoMoney.

## 📁 Structure

```
tests/
├── setup.ts                    # Configuration globale des tests
├── facades/                     # Tests pour les facades
│   └── user.facade.test.ts
├── hooks/                       # Tests pour les hooks
│   ├── useBookings.test.ts
│   └── useQuoteActions.test.ts
├── api/                         # Tests pour les routes API
│   └── users/
│       └── route.test.ts
└── README.md                    # Ce fichier
```

## 🚀 Installation

### 1. Installer Vitest et les dépendances

```bash
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

### 2. Configuration

Le fichier `vitest.config.ts` à la racine configure :
- L'environnement de test (jsdom pour React)
- Les alias de chemins (@/)
- La couverture de code
- Les fichiers d'exclusion

## 🧪 Exécution des Tests

### Tous les tests

```bash
pnpm test:unit
```

### Tests en mode watch

```bash
pnpm test:watch
```

### Tests avec couverture

```bash
pnpm test:coverage
```

### Tests spécifiques

```bash
# Tests des facades uniquement
pnpm test:unit tests/facades

# Tests des hooks uniquement
pnpm test:unit tests/hooks

# Tests des routes API uniquement
pnpm test:unit tests/api
```

## 📝 Patterns de Tests

### Tests de Facades

Les tests de facades vérifient :
- ✅ L'orchestration des services
- ✅ La gestion des erreurs
- ✅ La validation des données
- ✅ Les décorateurs (Log, Audit, Performance, etc.)

**Exemple :**
```typescript
describe('UserFacade', () => {
  it('devrait créer un utilisateur avec succès', async () => {
    const result = await userFacade.execute(userData);
    expect(result.success).toBe(true);
  });
});
```

### Tests de Hooks

Les tests de hooks vérifient :
- ✅ Le chargement des données
- ✅ La gestion des états (loading, error)
- ✅ Les filtres et la pagination
- ✅ Les actions (delete, approve, etc.)
- ✅ Les états de chargement individuels

**Exemple :**
```typescript
describe('useBookings', () => {
  it('devrait récupérer les réservations', async () => {
    const { result } = renderHook(() => useBookings());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.bookings).toBeDefined();
  });
});
```

### Tests de Routes API

Les tests de routes API vérifient :
- ✅ Les méthodes HTTP (GET, POST, PUT, DELETE)
- ✅ La validation des paramètres
- ✅ Les formats de réponse
- ✅ La gestion d'erreurs
- ✅ L'utilisation des facades

**Exemple :**
```typescript
describe('GET /api/users', () => {
  it('devrait retourner une liste paginée', async () => {
    const response = await GET(request);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

## 🎯 Couverture Cible

- **Facades** : 80%+
- **Hooks** : 75%+
- **Routes API** : 70%+
- **Services** : 80%+
- **Repositories** : 70%+

## 📋 Checklist pour Ajouter des Tests

### Pour une Facade

- [ ] Test de création/récupération réussie
- [ ] Test de gestion d'erreurs
- [ ] Test de validation des données
- [ ] Test des décorateurs (si applicable)

### Pour un Hook

- [ ] Test de récupération des données
- [ ] Test de gestion des états (loading, error)
- [ ] Test des filtres
- [ ] Test de la pagination
- [ ] Test des actions (si applicable)
- [ ] Test des états de chargement individuels

### Pour une Route API

- [ ] Test de chaque méthode HTTP
- [ ] Test de validation des paramètres
- [ ] Test de format de réponse
- [ ] Test de gestion d'erreurs
- [ ] Test d'utilisation de la facade

## 🔧 Mocks et Fixtures

### Mocks Globaux

Les mocks suivants sont configurés dans `setup.ts` :
- `next/navigation` (useRouter, usePathname, etc.)
- `next-auth/react` (useSession, signIn, signOut)
- `@sentry/nextjs` (captureException, captureMessage)
- `fetch` global

### Fixtures

Créez des fichiers de fixtures dans `tests/fixtures/` pour les données de test réutilisables.

## 📚 Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)

---

**Dernière mise à jour**: 2025-01-27

