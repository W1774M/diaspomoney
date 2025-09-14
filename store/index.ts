import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { type AppAction } from "./actions";
import {
  initialAppointmentState,
  initialAuthState,
  initialInvoiceState,
  initialNotificationState,
  initialProviderState,
  initialThemeState,
  initialUserState,
  rootReducer,
  type RootState,
} from "./reducers";

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface AppStore {
  // Slices
  auth: typeof initialAuthState;
  notifications: typeof initialNotificationState;
  theme: typeof initialThemeState;
  user: typeof initialUserState;
  appointments: typeof initialAppointmentState;
  providers: typeof initialProviderState;
  invoices: typeof initialInvoiceState;

  // Dispatch function
  dispatch: (action: AppAction) => void;

  // Selectors
  getState: () => RootState;

  // Utility methods
  reset: () => void;
  resetAuth: () => void;
  resetNotifications: () => void;
  resetTheme: () => void;
  resetUser: () => void;
  resetAppointments: () => void;
  resetProviders: () => void;
  resetInvoices: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial states as slices
        auth: { ...initialAuthState },
        notifications: { ...initialNotificationState },
        theme: { ...initialThemeState },
        user: { ...initialUserState },
        appointments: { ...initialAppointmentState },
        providers: { ...initialProviderState },
        invoices: { ...initialInvoiceState },

        // Dispatch function - core of the dispatch pattern
        dispatch: (action: AppAction) => {
          if (!action?.type) return;
          const currentState = get();

          // Extract the slice name from action type (e.g., "AUTH/LOGIN_START" -> "auth")
          const typeParts = action.type.split("/");
          if (!typeParts[0]) return;
          const sliceName =
            typeParts[0].toLowerCase() as keyof typeof rootReducer;

          if (rootReducer[sliceName]) {
            // Get current slice state
            const currentSliceState = (currentState as any)[sliceName];
            if (typeof currentSliceState === "undefined") return;

            // Apply reducer to get new slice state
            const newSliceState = rootReducer[sliceName](
              currentSliceState,
              action
            );

            // Update the store with the new slice state
            set(state => ({
              ...state,
              [sliceName]: newSliceState,
            }));
          }
        },

        // Get current state
        getState: () => {
          // Return the current state as is
          return get();
        },

        // Reset entire store
        reset: () =>
          set({
            auth: { ...initialAuthState },
            notifications: { ...initialNotificationState },
            theme: { ...initialThemeState },
            user: { ...initialUserState },
            appointments: { ...initialAppointmentState },
            providers: { ...initialProviderState },
            invoices: { ...initialInvoiceState },
          }),

        // Reset specific slices
        resetAuth: () =>
          set(state => ({ ...state, auth: { ...initialAuthState } })),
        resetNotifications: () =>
          set(state => ({
            ...state,
            notifications: { ...initialNotificationState },
          })),
        resetTheme: () =>
          set(state => ({ ...state, theme: { ...initialThemeState } })),
        resetUser: () =>
          set(state => ({ ...state, user: { ...initialUserState } })),
        resetAppointments: () =>
          set(state => ({
            ...state,
            appointments: { ...initialAppointmentState },
          })),
        resetProviders: () =>
          set(state => ({ ...state, providers: { ...initialProviderState } })),
        resetInvoices: () =>
          set(state => ({ ...state, invoices: { ...initialInvoiceState } })),
      }),
      {
        name: "diaspomoney-store",
        partialize: state => ({
          // Only persist certain slices
          theme: state.theme.theme,
          auth: {
            user: state.auth.user,
            isAuthenticated: state.auth.isAuthenticated,
          },
        }),
      }
    )
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

// Auth selectors
export const useAuth = () =>
  useAppStore(state => ({
    isLoading: state.auth.isLoading,
    error: state.auth.error,
    user: state.auth.user,
    isAuthenticated: state.auth.isAuthenticated,
  }));

export const useAuthLoading = () => useAppStore(state => state.auth.isLoading);
export const useAuthError = () => useAppStore(state => state.auth.error);
export const useAuthUser = () => useAppStore(state => state.auth.user);
export const useIsAuthenticated = () =>
  useAppStore(state => state.auth.isAuthenticated);

// Notification selectors
export const useNotifications = () =>
  useAppStore(state => state.notifications.notifications);
export const useNotificationCount = () =>
  useAppStore(state => state.notifications.notifications.length);

// Theme selectors
export const useTheme = () => useAppStore(state => state.theme.theme);

// User selectors
export const useCurrentUser = () =>
  useAppStore(state => state.user.currentUser);
export const useUsers = () => useAppStore(state => state.user.users);
export const useUserLoading = () => useAppStore(state => state.user.isLoading);
export const useUserError = () => useAppStore(state => state.user.error);

// Appointment selectors
export const useAppointments = () =>
  useAppStore(state => state.appointments.appointments);
export const useAppointmentLoading = () =>
  useAppStore(state => state.appointments.isLoading);
export const useAppointmentError = () =>
  useAppStore(state => state.appointments.error);

// Provider selectors
export const useProviders = () =>
  useAppStore(state => state.providers.providers);
export const useProviderLoading = () =>
  useAppStore(state => state.providers.isLoading);
export const useProviderError = () =>
  useAppStore(state => state.providers.error);

// Invoice selectors
export const useInvoices = () => useAppStore(state => state.invoices.invoices);
export const useInvoiceLoading = () =>
  useAppStore(state => state.invoices.isLoading);
export const useInvoiceError = () => useAppStore(state => state.invoices.error);

// ============================================================================
// HOOKS WITH DISPATCH
// ============================================================================

// Hook that provides dispatch and state
export const useAppDispatch = () => useAppStore(state => state.dispatch);

// Hook that provides dispatch and specific slice
export const useAuthDispatch = () => {
  const dispatch = useAppStore(state => state.dispatch);
  const authState = useAuth();

  return {
    dispatch,
    ...authState,
  };
};

export const useNotificationDispatch = () => {
  const dispatch = useAppStore(state => state.dispatch);
  const notifications = useNotifications();

  return {
    dispatch,
    notifications,
  };
};

export const useThemeDispatch = () => {
  const dispatch = useAppStore(state => state.dispatch);
  const theme = useTheme();

  return {
    dispatch,
    theme,
  };
};

export const useUserDispatch = () => {
  const dispatch = useAppStore(state => state.dispatch);
  const userState = useCurrentUser();
  const users = useUsers();
  const isLoading = useUserLoading();
  const error = useUserError();

  return {
    dispatch,
    currentUser: userState,
    users,
    isLoading,
    error,
  };
};

export const useAppointmentDispatch = () => {
  const dispatch = useAppStore(state => state.dispatch);
  const appointments = useAppointments();
  const isLoading = useAppointmentLoading();
  const error = useAppointmentError();

  return {
    dispatch,
    appointments,
    isLoading,
    error,
  };
};

export const useProviderDispatch = () => {
  const dispatch = useAppStore(state => state.dispatch);
  const providers = useProviders();
  const isLoading = useProviderLoading();
  const error = useProviderError();

  return {
    dispatch,
    providers,
    isLoading,
    error,
  };
};

export const useInvoiceDispatch = () => {
  const dispatch = useAppStore(state => state.dispatch);
  const invoices = useInvoices();
  const isLoading = useInvoiceLoading();
  const error = useInvoiceError();

  return {
    dispatch,
    invoices,
    isLoading,
    error,
  };
};

// ============================================================================
// RE-EXPORT HOOKS FROM HOOKS FILE
// ============================================================================

export * from "./hooks";
