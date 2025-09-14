# Refactorisation vers le Pattern Dispatch

## 🎯 **Objectif**

Refactoriser le code du projet DiaspoMoney pour utiliser le pattern **Dispatch** avec des actions et des reducers, remplaçant l'approche Zustand directe par une architecture plus prévisible et maintenable.

## 🏗️ **Architecture**

### **Structure des fichiers**

```
store/
├── simple-store.ts          # Store principal avec pattern dispatch
├── actions.ts               # Actions et action creators (version complète)
├── reducers.ts              # Reducers pour chaque slice (version complète)
├── hooks.ts                 # Hooks utilitaires (version complète)
└── index.ts                 # Store principal (version complète)
```

### **Pattern Dispatch**

Le pattern dispatch suit le flux Redux classique :

```
Action → Dispatch → Reducer → State Update → UI Re-render
```

## 🔧 **Implémentation**

### **1. Actions**

Les actions sont des objets qui décrivent ce qui s'est passé :

```typescript
// Action Types
export const THEME_ACTIONS = {
  SET_THEME: "THEME/SET",
  TOGGLE_THEME: "THEME/TOGGLE",
} as const;

// Action Creators
export const themeActions = {
  set: (theme: "light" | "dark" | "system") => ({
    type: THEME_ACTIONS.SET_THEME,
    payload: theme,
  }),
  toggle: () => ({ type: THEME_ACTIONS.TOGGLE_THEME }),
};
```

### **2. Reducers**

Les reducers sont des fonctions pures qui gèrent les actions :

```typescript
const themeReducer = (state: any, action: AppAction) => {
  switch (action.type) {
    case THEME_ACTIONS.SET_THEME:
      return { ...state, theme: action.payload };
    case THEME_ACTIONS.TOGGLE_THEME:
      const newTheme = state.theme === "light" ? "dark" : "light";
      return { ...state, theme: newTheme };
    default:
      return state;
  }
};
```

### **3. Store avec Dispatch**

Le store centralise la logique et expose une fonction `dispatch` :

```typescript
export const useSimpleStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ... state initial

      dispatch: (action: AppAction) => {
        const currentState = get();
        const sliceName = action.type.split("/")[0].toLowerCase();

        if (sliceName === "theme") {
          const newThemeState = themeReducer(currentState, action);
          set({ theme: newThemeState.theme });
        }
        // ... autres slices
      },
    }),
    { name: "diaspomoney-simple-store" }
  )
);
```

### **4. Utilisation dans les composants**

```typescript
export function ThemeToggle() {
  const theme = useTheme();
  const dispatch = useDispatch();

  const toggleTheme = () => {
    dispatch(themeActions.toggle());
  };

  // ... reste du composant
}
```

## 📊 **Avantages du Pattern Dispatch**

### **✅ Avantages**

1. **Prévisibilité** : Le flux de données est unidirectionnel et prévisible
2. **Maintenabilité** : Logique métier centralisée dans les reducers
3. **Testabilité** : Reducers et actions sont facilement testables
4. **Debugging** : Actions traçables et reproductibles
5. **Évolutivité** : Facile d'ajouter de nouvelles fonctionnalités
6. **Séparation des responsabilités** : Actions, reducers et state sont clairement séparés

### **⚠️ Inconvénients**

1. **Boilerplate** : Plus de code initial à écrire
2. **Complexité** : Courbe d'apprentissage pour les développeurs
3. **Overhead** : Légèrement plus verbeux que Zustand direct

## 🚀 **Migration**

### **Avant (Zustand direct)**

```typescript
// Store
export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      theme: "system",
      setTheme: theme => set({ theme }),
    }),
    { name: "theme-storage" }
  )
);

// Composant
export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
}
```

### **Après (Pattern Dispatch)**

```typescript
// Store avec dispatch
export const useSimpleStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: "system",
      dispatch: (action: AppAction) => {
        // ... logique de dispatch
      },
    }),
    { name: "diaspomoney-simple-store" }
  )
);

// Composant
export function ThemeToggle() {
  const theme = useTheme();
  const dispatch = useDispatch();

  const toggleTheme = () => {
    dispatch(themeActions.toggle());
  };
}
```

## 🔄 **Prochaines étapes**

### **Phase 1 : Store simplifié** ✅

- [x] Créer `simple-store.ts` avec pattern dispatch
- [x] Refactoriser `ThemeToggle`
- [x] Refactoriser `LoginForm`

### **Phase 2 : Store complet**

- [ ] Implémenter tous les reducers
- [ ] Ajouter la gestion d'erreurs
- [ ] Optimiser les performances

### **Phase 3 : Migration complète**

- [ ] Migrer tous les composants
- [ ] Ajouter des tests
- [ ] Documentation complète

## 📝 **Exemples d'utilisation**

### **Gestion des thèmes**

```typescript
import { useTheme, useDispatch, themeActions } from "@/store/simple-store";

export function ThemeSelector() {
  const theme = useTheme();
  const dispatch = useDispatch();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    dispatch(themeActions.set(newTheme));
  };

  return (
    <select value={theme} onChange={(e) => handleThemeChange(e.target.value as any)}>
      <option value="light">Clair</option>
      <option value="dark">Sombre</option>
      <option value="system">Système</option>
    </select>
  );
}
```

### **Gestion des notifications**

```typescript
import { useNotifications, useDispatch, notificationActions } from "@/store/simple-store";

export function NotificationManager() {
  const notifications = useNotifications();
  const dispatch = useDispatch();

  const addNotification = (message: string, type: 'success' | 'error' = 'info') => {
    dispatch(notificationActions.add({ message, type, duration: 5000 }));
  };

  const removeNotification = (id: string) => {
    dispatch(notificationActions.remove(id));
  };

  const clearAll = () => {
    dispatch(notificationActions.clearAll());
  };

  return (
    <div>
      {notifications.map(notification => (
        <div key={notification.id}>
          {notification.message}
          <button onClick={() => removeNotification(notification.id)}>×</button>
        </div>
      ))}
      <button onClick={clearAll}>Effacer tout</button>
    </div>
  );
}
```

## 🧪 **Tests**

### **Tester les Reducers**

```typescript
import { themeReducer } from "@/store/reducers";
import { themeActions } from "@/store/actions";

describe("Theme Reducer", () => {
  it("should handle SET_THEME", () => {
    const initialState = { theme: "system" };
    const action = themeActions.set("dark");
    const newState = themeReducer(initialState, action);

    expect(newState.theme).toBe("dark");
  });

  it("should handle TOGGLE_THEME", () => {
    const initialState = { theme: "light" };
    const action = themeActions.toggle();
    const newState = themeReducer(initialState, action);

    expect(newState.theme).toBe("dark");
  });
});
```

### **Tester les Actions**

```typescript
import { themeActions } from "@/store/actions";

describe("Theme Actions", () => {
  it("should create SET_THEME action", () => {
    const action = themeActions.set("dark");

    expect(action).toEqual({
      type: "THEME/SET",
      payload: "dark",
    });
  });

  it("should create TOGGLE_THEME action", () => {
    const action = themeActions.toggle();

    expect(action).toEqual({
      type: "THEME/TOGGLE",
    });
  });
});
```

## 📚 **Ressources**

- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Flux Architecture](https://facebook.github.io/flux/)
- [Redux Pattern](https://redux.js.org/understanding/thinking-in-redux/motivation)

## 🤝 **Contribution**

Pour contribuer à cette refactorisation :

1. Suivez le pattern établi
2. Ajoutez des tests pour les nouvelles fonctionnalités
3. Documentez les changements
4. Respectez la séparation des responsabilités

---

**Note** : Cette refactorisation est en cours et sera progressivement étendue à tous les composants du projet.
