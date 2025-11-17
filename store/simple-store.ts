import { create } from "zustand";

// ============================================================================
// ACTIONS
// ============================================================================

export const THEME_ACTIONS = {
  SET_THEME: "THEME/SET",
  TOGGLE_THEME: "THEME/TOGGLE",
} as const;

export const NOTIFICATION_ACTIONS = {
  ADD: "NOTIFICATION/ADD",
  REMOVE: "NOTIFICATION/REMOVE",
  CLEAR_ALL: "NOTIFICATION/CLEAR_ALL",
} as const;

export const AUTH_ACTIONS = {
  LOGIN_START: "AUTH/LOGIN_START",
  LOGIN_SUCCESS: "AUTH/LOGIN_SUCCESS",
  LOGIN_FAILURE: "AUTH/LOGIN_FAILURE",
  LOGOUT: "AUTH/LOGOUT",
} as const;

// ============================================================================
// ACTION CREATORS
// ============================================================================

export const themeActions = {
  set: (theme: "light" | "dark" | "system") => ({
    type: THEME_ACTIONS.SET_THEME,
    payload: theme,
  }),
  toggle: () => ({ type: THEME_ACTIONS.TOGGLE_THEME }),
};

export const notificationActions = {
  add: (notification: Omit<any, "id">) => ({
    type: NOTIFICATION_ACTIONS.ADD,
    payload: notification,
  }),
  remove: (id: string) => ({
    type: NOTIFICATION_ACTIONS.REMOVE,
    payload: id,
  }),
  clearAll: () => ({ type: NOTIFICATION_ACTIONS.CLEAR_ALL }),
};

export const authActions = {
  loginStart: () => ({ type: AUTH_ACTIONS.LOGIN_START }),
  loginSuccess: (user: any) => ({
    type: AUTH_ACTIONS.LOGIN_SUCCESS,
    payload: user,
  }),
  loginFailure: (error: string) => ({
    type: AUTH_ACTIONS.LOGIN_FAILURE,
    payload: error,
  }),
  logout: () => ({ type: AUTH_ACTIONS.LOGOUT }),
};

// ============================================================================
// ACTION TYPES
// ============================================================================

export type ThemeAction = ReturnType<
  (typeof themeActions)[keyof typeof themeActions]
>;
export type NotificationAction = ReturnType<
  (typeof notificationActions)[keyof typeof notificationActions]
>;
export type AuthAction = ReturnType<
  (typeof authActions)[keyof typeof authActions]
>;
export type AppAction = ThemeAction | NotificationAction | AuthAction;

// ============================================================================
// REDUCERS
// ============================================================================

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

const notificationReducer = (state: any, action: AppAction) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.ADD:
      // Use a more stable ID generation to prevent hydration mismatches
      const id = `notification-${Date.now()}-${Math.floor(
        Math.random() * 1000,
      )}`;
      const newNotification = { ...action.payload, id };
      return {
        ...state,
        notifications: [...state.notifications, newNotification],
      };
    case NOTIFICATION_ACTIONS.REMOVE:
      return {
        ...state,
        notifications: state.notifications.filter(
          (n: any) => n.id !== action.payload,
        ),
      };
    case NOTIFICATION_ACTIONS.CLEAR_ALL:
      return { ...state, notifications: [] };
    default:
      return state;
  }
};

const authReducer = (state: any, action: AppAction) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return { ...state, isLoading: true, error: null };
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
    default:
      return state;
  }
};

// ============================================================================
// STORE
// ============================================================================

interface AppState {
  theme: "light" | "dark" | "system";
  notifications: any[];
  auth: {
    isLoading: boolean;
    error: string | null;
    user: any;
    isAuthenticated: boolean;
  };
  dispatch: (action: AppAction) => void;
}

export const useSimpleStore = create<AppState>()((set, get) => ({
  theme: "system",
  notifications: [],
  auth: {
    isLoading: false,
    error: null,
    user: null,
    isAuthenticated: false,
  },

  dispatch: (action: AppAction) => {
    const currentState = get();

    // Apply the appropriate reducer based on action type
    const sliceName = action.type.split("/")[0]?.toLowerCase();
    if (!sliceName) return;

    if (sliceName === "theme") {
      const newThemeState = themeReducer(currentState, action);
      set({ theme: newThemeState.theme });
    } else if (sliceName === "notification") {
      const newNotificationState = notificationReducer(currentState, action);
      set({ notifications: newNotificationState.notifications });
    } else if (sliceName === "auth") {
      const newAuthState = authReducer(currentState.auth, action);
      set({ auth: newAuthState });
    }
  },
}));

// ============================================================================
// SELECTORS
// ============================================================================

export const useTheme = () => useSimpleStore(state => state.theme);
export const useNotifications = () =>
  useSimpleStore(state => state.notifications);
export const useAuth = () => useSimpleStore(state => state.auth);
export const useDispatch = () => useSimpleStore(state => state.dispatch);
