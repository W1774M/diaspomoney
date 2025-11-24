# Patterns de Standardisation - Phase 4

**Date**: 2025-01-27  
**Objectif**: Documenter les patterns standardisés pour les pages et les hooks

---

## 📋 Table des Matières

1. [Structure des Pages](#structure-des-pages)
2. [Structure des Hooks](#structure-des-hooks)
3. [Exemples](#exemples)

---

## 📄 Structure des Pages

### Pattern Standardisé

Toutes les pages du dashboard doivent suivre ce pattern minimal :

```typescript
// app/dashboard/[resource]/page.tsx
'use client';

import { ResourcePage } from '@/components/[resource]';

export default function Resource() {
  return <ResourcePage />;
}
```

### Principes

1. **Séparation des responsabilités** : Les pages Next.js sont de simples wrappers
2. **Logique dans les composants** : Toute la logique métier est dans `components/[resource]/ResourcePage.tsx`
3. **Réutilisabilité** : Les composants peuvent être utilisés ailleurs (modals, onglets, etc.)
4. **Testabilité** : Les composants sont plus faciles à tester isolément

### Exemples Conformes

✅ **Complaints** (`app/dashboard/complaints/page.tsx`)
```typescript
'use client';
import { ComplaintsPage } from '@/components/complaints';
export default function Complaints() {
  return <ComplaintsPage />;
}
```

✅ **Invoices** (`app/dashboard/invoices/page.tsx`)
```typescript
'use client';
import { InvoicesPage } from '@/components/invoices';
export default function Invoices() {
  return <InvoicesPage />;
}
```

✅ **Quotes** (`app/dashboard/quotes/page.tsx`)
```typescript
'use client';
import { QuotesPage } from '@/components/quotes';
export default function Quotes() {
  return <QuotesPage />;
}
```

✅ **Bookings** (`app/dashboard/bookings/page.tsx`)
```typescript
'use client';
import { BookingsPage } from '@/components/bookings';
export default function Bookings() {
  return <BookingsPage />;
}
```

✅ **Users** (`app/dashboard/users/page.tsx`)
```typescript
'use client';
import { UsersPage } from '@/components/users';
export default function Users() {
  return <UsersPage />;
}
```

✅ **Transactions** (`app/dashboard/payments/transactions/page.tsx`)
```typescript
'use client';
import { TransactionsPage } from '@/components/transactions';
export default function Transactions() {
  return <TransactionsPage />;
}
```

---

## 🎣 Structure des Hooks

### Pattern Standardisé pour les Hooks de Liste

Tous les hooks de récupération de liste doivent suivre ce pattern :

```typescript
// hooks/[resource]/use[Resource].ts
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

export interface Use[Resource]Options {
  limit?: number;
  offset?: number;
  page?: number;
  userId?: string | undefined;
  status?: string | undefined;
  // ... autres filtres spécifiques
}

export interface Use[Resource]Return {
  [resource]: [Resource][];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function use[Resource](
  options: Use[Resource]Options = {},
): Use[Resource]Return {
  const [[resource], set[Resource]] = useState<[Resource][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Mémoriser les options pour éviter les re-renders inutiles
  const memoizedOptions = useMemo(() => options, [options]);

  // Fonction pour récupérer les données
  const fetch[Resource] = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (memoizedOptions.page) {
        params.append('page', memoizedOptions.page.toString());
      } else if (memoizedOptions.offset !== undefined && memoizedOptions.limit) {
        const calculatedPage = Math.floor(memoizedOptions.offset / memoizedOptions.limit) + 1;
        params.append('page', calculatedPage.toString());
      }
      if (memoizedOptions.limit) {
        params.append('limit', memoizedOptions.limit.toString());
      }
      // ... autres paramètres

      // Appeler l'API route
      const response = await fetch(`/api/[resource]?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération');
      }

      const data = await response.json();
      if (data.success) {
        // Format standardisé : data.data pour les listes
        set[Resource](Array.isArray(data.data) ? data.data : []);
        setTotal(data.pagination?.total || 0);
      } else {
        throw new Error(data.error || 'Erreur lors de la récupération');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      set[Resource]([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [memoizedOptions]);

  useEffect(() => {
    fetch[Resource]();
  }, [fetch[Resource]]);

  return {
    [resource],
    total,
    loading,
    error,
    refetch: fetch[Resource],
  };
}
```

### Principes

1. **Options mémorisées** : Utiliser `useMemo` pour éviter les re-renders inutiles
2. **Fetch mémorisé** : Utiliser `useCallback` pour la fonction de fetch
3. **Format standardisé** : Utiliser `data.data` pour les listes (format API standardisé)
4. **Gestion d'erreurs** : Toujours gérer les erreurs et retourner un message clair
5. **Pagination** : Support de `page` et `offset` avec conversion automatique
6. **Types stricts** : Utiliser `string | undefined` pour les propriétés optionnelles avec `exactOptionalPropertyTypes`

### Exemples Conformes

✅ **useBookings** (`hooks/useBookings.ts`)
- ✅ Utilise `useCallback` pour `fetchBookings`
- ✅ Retourne `{ bookings, loading, error, total, refetch }`
- ✅ Support de la pagination
- ✅ Format standardisé `data.data`

✅ **useUsers** (`hooks/useUsers.ts`)
- ✅ Utilise `useMemo` pour les options
- ✅ Utilise `useCallback` pour `fetchUsers`
- ✅ Retourne `{ users, loading, error, total, refetch }`
- ✅ Support de la pagination

✅ **useInvoices** (`hooks/invoices/useInvoices.ts`)
- ✅ Utilise `useMemo` pour les options
- ✅ Utilise `useCallback` pour `fetchInvoices`
- ✅ Retourne `{ invoices, loading, error, total, refetch }`
- ✅ Format standardisé `data.data`

✅ **useQuotes** (`hooks/quotes/useQuotes.ts`)
- ✅ Utilise `useMemo` pour les options
- ✅ Utilise `useCallback` pour `fetchQuotes`
- ✅ Retourne `{ quotes, loading, error, total, refetch }`
- ✅ Format standardisé `data.data`

✅ **useTransactions** (`hooks/transactions/useTransactions.ts`)
- ✅ Utilise `useMemo` pour les options
- ✅ Utilise `useCallback` pour `fetchTransactions`
- ✅ Retourne `{ transactions, loading, error, total, refetch }`
- ✅ Format standardisé `data.data`

### Pattern pour les Hooks de Filtres

```typescript
// hooks/[resource]/use[Resource]Filters.ts
'use client';

import { useCallback, useMemo, useState } from 'react';
import type { [Resource] } from '@/lib/types';

export interface [Resource]Filters {
  searchTerm: string;
  status: 'all' | [StatusType];
  // ... autres filtres
}

export function use[Resource]Filters([resource]: [Resource][]) {
  const [filters, setFilters] = useState<[Resource]Filters>({
    searchTerm: '',
    status: 'all',
  });

  // Sécurité : s'assurer que [resource] est un tableau
  const safe[Resource] = useMemo(() => [resource] || [], [[resource]]);

  // Filter [resource] based on current filters
  const filtered[Resource] = useMemo(() => {
    return safe[Resource].filter(item => {
      // ... logique de filtrage
    });
  }, [safe[Resource], filters]);

  const updateFilter = useCallback(
    (key: keyof [Resource]Filters, value: string | number | undefined) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      status: 'all',
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm.length > 0 ||
      filters.status !== 'all' ||
      // ... autres vérifications
    );
  }, [filters]);

  return {
    filters,
    filtered[Resource],
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}
```

### Pattern pour les Hooks d'Actions

```typescript
// hooks/[resource]/use[Resource]Actions.ts
'use client';

import { useCallback, useState } from 'react';
import { useNotificationManager } from '@/components/ui/Notification';

export interface Use[Resource]ActionsReturn {
  delete[Resource]: (id: string) => Promise<boolean>;
  // ... autres actions
  isDeleting?: boolean;
}

export function use[Resource]Actions(
  onSuccess?: () => void | Promise<void>,
): Use[Resource]ActionsReturn {
  const { addSuccess, addError } = useNotificationManager();
  const [isDeleting, setIsDeleting] = useState(false);

  const delete[Resource] = useCallback(
    async (id: string): Promise<boolean> => {
      if (!window.confirm('Êtes-vous sûr ?')) {
        return false;
      }

      try {
        setIsDeleting(true);
        const response = await fetch(`/api/[resource]/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erreur lors de la suppression');
        }

        addSuccess('[Resource] supprimé avec succès');
        await onSuccess?.();
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur lors de la suppression';
        addError(errorMessage);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [addSuccess, addError, onSuccess],
  );

  return {
    delete[Resource],
    isDeleting,
  };
}
```

---

## ✅ Checklist de Standardisation

### Pour une Page

- [x] La page est un simple wrapper qui importe le composant
  - ✅ `app/dashboard/bookings/page.tsx` → `BookingsPage`
  - ✅ `app/dashboard/users/page.tsx` → `UsersPage`
  - ✅ `app/dashboard/invoices/page.tsx` → `InvoicesPage`
  - ✅ `app/dashboard/quotes/page.tsx` → `QuotesPage`
  - ✅ `app/dashboard/complaints/page.tsx` → `ComplaintsPage`
  - ✅ `app/dashboard/payments/transactions/page.tsx` → `TransactionsPage`
- [x] Toute la logique est dans `components/[resource]/[Resource]Page.tsx`
- [x] Le composant est exporté depuis `components/[resource]/index.ts`
- [x] Le nom de la fonction exportée correspond au nom de la route (sans "Page")

### Pour un Hook de Liste

- [x] Utilise `useMemo` pour mémoriser les options
  - ✅ `useBookings`, `useUsers`, `useInvoices`, `useQuotes`, `useTransactions`
- [x] Utilise `useCallback` pour la fonction de fetch
  - ✅ Tous les hooks de liste
- [x] Retourne `{ data, loading, error, total, refetch }`
  - ✅ `useBookings` → `{ bookings, loading, error, total, refetch }`
  - ✅ `useUsers` → `{ users, loading, error, total, refetch }`
  - ✅ `useInvoices` → `{ invoices, loading, error, total, refetch }`
  - ✅ `useQuotes` → `{ quotes, loading, error, total, refetch }`
  - ✅ `useTransactions` → `{ transactions, loading, error, total, refetch }`
- [x] Support de la pagination (`page` et `offset`)
  - ✅ Tous les hooks supportent `page` et `offset` avec conversion automatique
- [x] Utilise le format standardisé `data.data` pour les listes
  - ✅ Tous les hooks utilisent `Array.isArray(data.data) ? data.data : []`
- [x] Gestion d'erreurs complète
  - ✅ Tous les hooks gèrent les erreurs avec messages clairs
- [x] Types avec `string | undefined` pour les propriétés optionnelles
  - ✅ Tous les hooks utilisent `string | undefined` pour `exactOptionalPropertyTypes`

### Pour un Hook de Filtres

- [x] Utilise `useMemo` pour `safe[Resource]`
  - ✅ `useQuoteFilters` → `safeQuotes`
  - ✅ `useInvoiceFilters` → `safeInvoices`
  - ✅ `useTransactionFilters` → `safeTransactions`
  - ✅ `useBookingFilters` → `safeBookings`
  - ✅ `useComplaintFilters` → `safeComplaints`
  - ✅ `useBeneficiaryFilters` → `safeBeneficiaries`
- [x] Utilise `useMemo` pour `filtered[Resource]`
  - ✅ Tous les hooks de filtres
- [x] Utilise `useCallback` pour `updateFilter` et `clearFilters`
  - ✅ Tous les hooks de filtres
- [x] Retourne `{ filters, filtered[Resource], updateFilter, clearFilters, hasActiveFilters }`
  - ✅ Tous les hooks de filtres retournent cette structure

### Pour un Hook d'Actions

- [x] Utilise `useCallback` pour toutes les actions
  - ✅ `useQuoteActions` → `deleteQuote`, `approveQuote`, `rejectQuote`, `downloadQuote`
  - ✅ `useInvoiceActions` → `deleteInvoice`, `downloadInvoice`, `sendInvoiceByEmail`
- [x] Gère les états de chargement (`isDeleting`, `isSending`, etc.)
  - ✅ `useInvoiceActions` → `isDownloading`, `isSending`
  - ✅ `useQuoteActions` → `isDeleting`, `isApproving`, `isRejecting`, `isDownloading`
- [x] Utilise `useNotificationManager` pour les notifications
  - ✅ Tous les hooks d'actions utilisent `useNotificationManager`
- [x] Support d'un callback `onSuccess` optionnel
  - ✅ `useQuoteActions` et `useInvoiceActions` supportent `onSuccess`
- [x] Gestion d'erreurs avec messages clairs
  - ✅ Tous les hooks d'actions gèrent les erreurs avec messages utilisateur

---

## 📝 Notes

- Les patterns sont basés sur les meilleures pratiques React et Next.js
- La standardisation facilite la maintenance et la compréhension du code
- Tous les hooks doivent être testables isolément
- Les composants doivent être réutilisables dans différents contextes

---

**Dernière mise à jour**: 2025-01-27

