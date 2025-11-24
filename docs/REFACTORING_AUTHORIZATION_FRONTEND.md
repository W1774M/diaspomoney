# Refactoring de l'Autorisation Frontend

**Date**: 2025-01-27  
**Objectif**: Optimiser l'affichage frontend en utilisant les patterns backend (décorateurs, facades) pour la gestion des autorisations

---

## 📋 Résumé

Refactorisation complète du système d'autorisation frontend pour s'aligner avec le décorateur `@Authorize` du backend, permettant une gestion cohérente et centralisée des permissions.

---

## 🎯 Nouveaux Composants et Hooks

### 1. Hook `useAuthorization`

**Fichier**: `hooks/auth/useAuthorization.ts`

Hook personnalisé qui implémente la même logique que le décorateur `@Authorize` backend :

```typescript
const { isAuthorized, reason, error } = useAuthorization({
  roles: [ROLES.ADMIN],
  permissions: ['users:delete'],
  checkOwnership: true,
  resourceOwnerId: userId,
});
```

**Fonctionnalités** :
- ✅ Vérification des rôles (avec priorité ADMIN)
- ✅ Vérification des permissions
- ✅ Vérification de propriété (ownership)
- ✅ Aligné avec le décorateur backend `@Authorize`

**Hooks helpers** :
- `useHasRole(role: string)` - Vérifie un rôle spécifique
- `useHasPermission(permission: string)` - Vérifie une permission spécifique

### 2. Composant `AuthorizedRoute`

**Fichier**: `components/auth/AuthorizedRoute.tsx`

Composant pour protéger des routes complètes avec autorisation :

```tsx
<AuthorizedRoute roles={[ROLES.ADMIN]} permissions={['users:delete']} redirectTo="/dashboard">
  <AdminPanel />
</AuthorizedRoute>
```

**Fonctionnalités** :
- ✅ Protection de route complète
- ✅ Redirection automatique si non autorisé
- ✅ Message d'erreur personnalisé
- ✅ Support des rôles et permissions multiples

**Composants helpers** :
- `<AdminRoute>` - Protection pour ADMIN uniquement
- `<RoleRoute roles={[...]}>` - Protection pour plusieurs rôles

### 3. Composant `AuthorizedContent`

**Fichier**: `components/auth/AuthorizedContent.tsx`

Composant pour afficher conditionnellement du contenu basé sur les autorisations :

```tsx
<AuthorizedContent roles={[ROLES.ADMIN]}>
  <DeleteButton />
</AuthorizedContent>

<AuthorizedContent roles={[ROLES.ADMIN]} invert fallback={<p>Accès limité</p>}>
  <AdminPanel />
</AuthorizedContent>
```

**Fonctionnalités** :
- ✅ Affichage conditionnel de contenu
- ✅ Mode inversé (afficher si non autorisé)
- ✅ Fallback personnalisé
- ✅ Idéal pour masquer/afficher des boutons, sections, etc.

---

## 🔄 Pages Refactorisées

### 1. `app/dashboard/services/page.tsx`

**Avant** :
```typescript
// Vérification manuelle
useEffect(() => {
  if (!isLoading && (!isAuthenticated || !isAdmin())) {
    router.push('/dashboard');
  }
}, [isAuthenticated, isLoading, router]);
```

**Après** :
```typescript
// Utilisation d'AuthorizedRoute
export default function ServicesManagementPage() {
  return (
    <AuthorizedRoute roles={[ROLES.ADMIN]} redirectTo="/dashboard">
      <ServicesManagementPageContent />
    </AuthorizedRoute>
  );
}
```

**Avantages** :
- ✅ Code plus propre et déclaratif
- ✅ Gestion d'erreurs centralisée
- ✅ Aligné avec le backend

### 2. `app/dashboard/admin/page.tsx`

**Avant** :
```typescript
// Vérification manuelle avec useEffect
useEffect(() => {
  if (!isLoading && isAuthenticated && !isAdmin()) {
    router.push('/dashboard');
  }
}, [isAuthenticated, isLoading, router, isAdmin]);
```

**Après** :
```typescript
// Utilisation d'AdminRoute
export default function AdminDashboardPage() {
  return (
    <AdminRoute roles={[ROLES.ADMIN]} redirectTo="/dashboard">
      <AdminDashboardContent />
    </AdminRoute>
  );
}
```

### 3. `app/dashboard/bookings/[id]/page.tsx`

**Avant** :
```typescript
// Vérification conditionnelle inline
{isAdmin() ? (
  <div>Admin controls</div>
) : (
  <div>User view</div>
)}
```

**Après** :
```typescript
// Utilisation d'AuthorizedContent
<AuthorizedContent roles={[ROLES.ADMIN]}>
  <div>Admin controls</div>
</AuthorizedContent>
<AuthorizedContent roles={[ROLES.ADMIN]} invert>
  <div>User view</div>
</AuthorizedContent>
```

### 4. `components/complaints/ComplaintsPage.tsx`

**Avant** :
```typescript
if (!isCustomer()) {
  return <UnauthorizedMessage />;
}
```

**Après** :
```typescript
const { isAuthorized } = useAuthorization({ roles: [ROLES.CUSTOMER] });

if (!isAuthorized) {
  return <UnauthorizedMessage />;
}
```

---

## 📊 Bénéfices

### 1. Cohérence Backend/Frontend

- ✅ Même logique d'autorisation que le décorateur `@Authorize`
- ✅ Support des rôles et permissions
- ✅ Vérification de propriété (ownership)
- ✅ Priorité ADMIN automatique

### 2. Maintenabilité

- ✅ Code centralisé et réutilisable
- ✅ Moins de duplication
- ✅ Plus facile à tester
- ✅ Documentation claire

### 3. Sécurité

- ✅ Vérifications cohérentes
- ✅ Messages d'erreur standardisés
- ✅ Logging structuré (via hooks)
- ✅ Protection au niveau composant et route

### 4. Performance

- ✅ Utilisation de `useMemo` pour optimiser les vérifications
- ✅ Pas de re-renders inutiles
- ✅ Cache des vérifications d'autorisation

---

## 🎨 Patterns Utilisés

### 1. Custom Hooks Pattern
- `useAuthorization` - Logique d'autorisation réutilisable
- `useHasRole` - Vérification de rôle simple
- `useHasPermission` - Vérification de permission simple

### 2. Higher-Order Component Pattern
- `AuthorizedRoute` - Wrapper pour protéger des routes
- `AdminRoute` - Wrapper spécialisé pour ADMIN
- `RoleRoute` - Wrapper pour plusieurs rôles

### 3. Conditional Rendering Pattern
- `AuthorizedContent` - Affichage conditionnel basé sur les autorisations

### 4. Authorization Pattern
- Aligné avec le décorateur `@Authorize` backend
- Support des rôles, permissions, et ownership

---

## 📝 Guide d'Utilisation

### Protection d'une Route Complète

```tsx
// app/dashboard/admin/page.tsx
import { AdminRoute } from '@/components/auth';
import { ROLES } from '@/lib/constants';

export default function AdminPage() {
  return (
    <AdminRoute redirectTo="/dashboard">
      <AdminContent />
    </AdminRoute>
  );
}
```

### Protection avec Plusieurs Rôles

```tsx
import { AuthorizedRoute } from '@/components/auth';
import { ROLES } from '@/lib/constants';

export default function ProviderPage() {
  return (
    <AuthorizedRoute 
      roles={[ROLES.PROVIDER, ROLES.ADMIN]} 
      redirectTo="/dashboard"
    >
      <ProviderContent />
    </AuthorizedRoute>
  );
}
```

### Affichage Conditionnel de Contenu

```tsx
import { AuthorizedContent } from '@/components/auth';
import { ROLES } from '@/lib/constants';

function UserProfile() {
  return (
    <div>
      <h1>Profil</h1>
      
      {/* Bouton admin uniquement */}
      <AuthorizedContent roles={[ROLES.ADMIN]}>
        <button>Modifier tous les utilisateurs</button>
      </AuthorizedContent>
      
      {/* Contenu pour non-admin */}
      <AuthorizedContent roles={[ROLES.ADMIN]} invert>
        <button>Modifier mon profil</button>
      </AuthorizedContent>
    </div>
  );
}
```

### Vérification dans un Hook

```tsx
import { useAuthorization } from '@/hooks/auth';
import { ROLES } from '@/lib/constants';

function MyComponent() {
  const { isAuthorized, reason, error } = useAuthorization({
    roles: [ROLES.ADMIN],
    permissions: ['users:delete'],
  });

  if (!isAuthorized) {
    return <div>Erreur: {error}</div>;
  }

  return <div>Contenu autorisé</div>;
}
```

---

## 🔍 Pages à Refactoriser (Recommandations)

### Priorité Haute

1. ✅ `app/dashboard/services/page.tsx` - **Refactorisé**
2. ✅ `app/dashboard/admin/page.tsx` - **Refactorisé**
3. ✅ `app/dashboard/bookings/[id]/page.tsx` - **Refactorisé** (utilise AuthorizedRoute et AuthorizedContent)
4. ✅ `components/complaints/ComplaintsPage.tsx` - **Refactorisé**
5. ✅ `app/dashboard/users/page.tsx` - **Refactorisé** (composant UsersPage utilise useAuthorization)
6. ✅ `app/dashboard/specialities/page.tsx` - **Refactorisé** (utilise AuthorizedRoute)
7. ✅ `app/dashboard/providers/page.tsx` - **Refactorisé** (utilise AuthorizedRoute et AuthorizedContent)

### Priorité Moyenne

- ✅ `app/dashboard/invoices/[id]/edit/page.tsx` - **Refactorisé** (utilise AuthorizedRoute)
- ✅ `app/dashboard/providers/[id]/page.tsx` - **Refactorisé** (utilise AuthorizedRoute et AuthorizedContent)
- ✅ `app/dashboard/appointments/page.tsx` - **Refactorisé** (utilise AuthorizedRoute et AuthorizedContent)
- ✅ `app/dashboard/agencies/page.tsx` - **Refactorisé** (utilise AuthorizedRoute)

---

## ✅ Checklist de Refactoring

Pour chaque page/composant :

- [x] Identifier les vérifications d'autorisation manuelles
- [x] Remplacer `isAdmin()` inline par `AuthorizedContent` ou `useAuthorization`
- [x] Remplacer les `useEffect` de redirection par `AuthorizedRoute`
- [x] Utiliser `AuthorizedContent` pour masquer/afficher du contenu
- [x] Vérifier que les rôles utilisés correspondent aux constantes `ROLES`
- [x] Refactoriser toutes les pages identifiées (27 pages au total)
- [x] Refactoriser les composants identifiés (2 composants principaux)
- [x] Tester les cas d'erreur (non autorisé, permissions insuffisantes) - Tests unitaires créés

> **Note** : Voir `docs/CHECKLIST_REFACTORING_AUTHORIZATION.md` pour le rapport détaillé de conformité de toutes les pages refactorisées.

---

## 📚 Références

- Décorateur backend : `lib/decorators/authorize.decorator.ts`
- Hook frontend : `hooks/auth/useAuthorization.ts`
- Composants : `components/auth/AuthorizedRoute.tsx`, `components/auth/AuthorizedContent.tsx`
- Constantes : `lib/constants/index.ts` (ROLES)

---

**Dernière mise à jour**: 2025-01-27

