import {
  APPOINTMENT_ACTIONS,
  AUTH_ACTIONS,
  INVOICE_ACTIONS,
  NOTIFICATION_ACTIONS,
  PROVIDER_ACTIONS,
  THEME_ACTIONS,
  USER_ACTIONS,
  type AppAction,
} from "./actions";

// ============================================================================
// INITIAL STATES
// ============================================================================

export const initialAuthState = {
  isLoading: false,
  error: null as string | null,
  user: null as any,
  isAuthenticated: false,
};

export const initialNotificationState = {
  notifications: [] as any[],
};

export const initialThemeState = {
  theme: "system" as "light" | "dark" | "system",
};

export const initialUserState = {
  currentUser: null as any,
  users: [] as any[],
  isLoading: false,
  error: null as string | null,
};

export const initialAppointmentState = {
  appointments: [] as any[],
  isLoading: false,
  error: null as string | null,
};

export const initialProviderState = {
  providers: [] as any[],
  isLoading: false,
  error: null as string | null,
};

export const initialInvoiceState = {
  invoices: [] as any[],
  isLoading: false,
  error: null as string | null,
};

// ============================================================================
// REDUCERS
// ============================================================================

// Auth Reducer
export const authReducer = (state = initialAuthState, action: AppAction) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null,
        user: action.payload,
        isAuthenticated: true,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        user: null,
        isAuthenticated: false,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: null,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};

// Notification Reducer
export const notificationReducer = (
  state = initialNotificationState,
  action: AppAction
) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      const id = Math.random().toString(36).substring(7);
      const newNotification = { ...action.payload, id };
      return {
        ...state,
        notifications: [...state.notifications, newNotification],
      };

    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    case NOTIFICATION_ACTIONS.CLEAR_ALL:
      return {
        ...state,
        notifications: [],
      };

    default:
      return state;
  }
};

// Theme Reducer
export const themeReducer = (state = initialThemeState, action: AppAction) => {
  switch (action.type) {
    case THEME_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };

    case THEME_ACTIONS.TOGGLE_THEME:
      const newTheme = state.theme === "light" ? "dark" : "light";
      return {
        ...state,
        theme: newTheme,
      };

    default:
      return state;
  }
};

// User Reducer
export const userReducer = (state = initialUserState, action: AppAction) => {
  switch (action.type) {
    case USER_ACTIONS.SET_USER:
      return {
        ...state,
        currentUser: action.payload,
      };

    case USER_ACTIONS.UPDATE_USER:
      return {
        ...state,
        currentUser: state.currentUser
          ? { ...state.currentUser, ...action.payload }
          : null,
      };

    case USER_ACTIONS.CLEAR_USER:
      return {
        ...state,
        currentUser: null,
      };

    default:
      return state;
  }
};

// Appointment Reducer
export const appointmentReducer = (
  state = initialAppointmentState,
  action: AppAction
) => {
  switch (action.type) {
    case APPOINTMENT_ACTIONS.SET_APPOINTMENTS:
      return {
        ...state,
        appointments: action.payload,
        isLoading: false,
        error: null,
      };

    case APPOINTMENT_ACTIONS.ADD_APPOINTMENT:
      return {
        ...state,
        appointments: [...state.appointments, action.payload],
      };

    case APPOINTMENT_ACTIONS.UPDATE_APPOINTMENT:
      return {
        ...state,
        appointments: state.appointments.map(apt =>
          apt.id === action.payload.id
            ? { ...apt, ...action.payload.updates }
            : apt
        ),
      };

    case APPOINTMENT_ACTIONS.DELETE_APPOINTMENT:
      return {
        ...state,
        appointments: state.appointments.filter(
          apt => apt.id !== action.payload
        ),
      };

    case APPOINTMENT_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case APPOINTMENT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Provider Reducer
export const providerReducer = (
  state = initialProviderState,
  action: AppAction
) => {
  switch (action.type) {
    case PROVIDER_ACTIONS.SET_PROVIDERS:
      return {
        ...state,
        providers: action.payload,
        isLoading: false,
        error: null,
      };

    case PROVIDER_ACTIONS.ADD_PROVIDER:
      return {
        ...state,
        providers: [...state.providers, action.payload],
      };

    case PROVIDER_ACTIONS.UPDATE_PROVIDER:
      return {
        ...state,
        providers: state.providers.map(provider =>
          provider.id === action.payload.id
            ? { ...provider, ...action.payload.updates }
            : provider
        ),
      };

    case PROVIDER_ACTIONS.DELETE_PROVIDER:
      return {
        ...state,
        providers: state.providers.filter(
          provider => provider.id !== action.payload
        ),
      };

    case PROVIDER_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case PROVIDER_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Invoice Reducer
export const invoiceReducer = (
  state = initialInvoiceState,
  action: AppAction
) => {
  switch (action.type) {
    case INVOICE_ACTIONS.SET_INVOICES:
      return {
        ...state,
        invoices: action.payload,
        isLoading: false,
        error: null,
      };

    case INVOICE_ACTIONS.ADD_INVOICE:
      return {
        ...state,
        invoices: [...state.invoices, action.payload],
      };

    case INVOICE_ACTIONS.UPDATE_INVOICE:
      return {
        ...state,
        invoices: state.invoices.map(invoice =>
          invoice.id === action.payload.id
            ? { ...invoice, ...action.payload.updates }
            : invoice
        ),
      };

    case INVOICE_ACTIONS.DELETE_INVOICE:
      return {
        ...state,
        invoices: state.invoices.filter(
          invoice => invoice.id !== action.payload
        ),
      };

    case INVOICE_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case INVOICE_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    default:
      return state;
  }
};

// ============================================================================
// ROOT REDUCER
// ============================================================================

export const rootReducer = {
  auth: authReducer,
  notifications: notificationReducer,
  theme: themeReducer,
  user: userReducer,
  appointments: appointmentReducer,
  providers: providerReducer,
  invoices: invoiceReducer,
};

// ============================================================================
// STATE TYPES
// ============================================================================

export type AuthState = ReturnType<typeof authReducer>;
export type NotificationState = ReturnType<typeof notificationReducer>;
export type ThemeState = ReturnType<typeof themeReducer>;
export type UserState = ReturnType<typeof userReducer>;
export type AppointmentState = ReturnType<typeof appointmentReducer>;
export type ProviderState = ReturnType<typeof providerReducer>;
export type InvoiceState = ReturnType<typeof invoiceReducer>;

export type RootState = {
  auth: AuthState;
  notifications: NotificationState;
  theme: ThemeState;
  user: UserState;
  appointments: AppointmentState;
  providers: ProviderState;
  invoices: InvoiceState;
};
