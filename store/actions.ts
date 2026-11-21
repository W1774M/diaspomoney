// ============================================================================
// ACTIONS TYPES
// ============================================================================

// Auth Actions
export const AUTH_ACTIONS = {
  LOGIN_START: "AUTH/LOGIN_START",
  LOGIN_SUCCESS: "AUTH/LOGIN_SUCCESS",
  LOGIN_FAILURE: "AUTH/LOGIN_FAILURE",
  LOGOUT: "AUTH/LOGOUT",
  SET_ERROR: "AUTH/SET_ERROR",
  CLEAR_ERROR: "AUTH/CLEAR_ERROR",
  SET_LOADING: "AUTH/SET_LOADING",
} as const;

// Notification Actions
export const NOTIFICATION_ACTIONS = {
  ADD_NOTIFICATION: "NOTIFICATION/ADD",
  REMOVE_NOTIFICATION: "NOTIFICATION/REMOVE",
  CLEAR_ALL: "NOTIFICATION/CLEAR_ALL",
} as const;

// Theme Actions
export const THEME_ACTIONS = {
  SET_THEME: "THEME/SET",
  TOGGLE_THEME: "THEME/TOGGLE",
} as const;

// User Actions
export const USER_ACTIONS = {
  SET_USER: "USER/SET",
  UPDATE_USER: "USER/UPDATE",
  CLEAR_USER: "USER/CLEAR",
} as const;

// Appointment Actions
export const APPOINTMENT_ACTIONS = {
  SET_APPOINTMENTS: "APPOINTMENT/SET_ALL",
  ADD_APPOINTMENT: "APPOINTMENT/ADD",
  UPDATE_APPOINTMENT: "APPOINTMENT/UPDATE",
  DELETE_APPOINTMENT: "APPOINTMENT/DELETE",
  SET_LOADING: "APPOINTMENT/SET_LOADING",
  SET_ERROR: "APPOINTMENT/SET_ERROR",
} as const;

// Provider Actions
export const PROVIDER_ACTIONS = {
  SET_PROVIDERS: "PROVIDER/SET_ALL",
  ADD_PROVIDER: "PROVIDER/ADD",
  UPDATE_PROVIDER: "PROVIDER/UPDATE",
  DELETE_PROVIDER: "PROVIDER/DELETE",
  SET_LOADING: "PROVIDER/SET_LOADING",
  SET_ERROR: "PROVIDER/SET_ERROR",
} as const;

// Invoice Actions
export const INVOICE_ACTIONS = {
  SET_INVOICES: "INVOICE/SET_ALL",
  ADD_INVOICE: "INVOICE/ADD",
  UPDATE_INVOICE: "INVOICE/UPDATE",
  DELETE_INVOICE: "INVOICE/DELETE",
  SET_LOADING: "INVOICE/SET_LOADING",
  SET_ERROR: "INVOICE/SET_ERROR",
} as const;

// ============================================================================
// ACTION CREATORS
// ============================================================================

// Auth Action Creators
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
  setError: (error: string) => ({
    type: AUTH_ACTIONS.SET_ERROR,
    payload: error,
  }),
  clearError: () => ({ type: AUTH_ACTIONS.CLEAR_ERROR }),
  setLoading: (loading: boolean) => ({
    type: AUTH_ACTIONS.SET_LOADING,
    payload: loading,
  }),
};

// Notification Action Creators
export const notificationActions = {
  add: (notification: Omit<any, "id">) => ({
    type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
    payload: notification,
  }),
  remove: (id: string) => ({
    type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION,
    payload: id,
  }),
  clearAll: () => ({ type: NOTIFICATION_ACTIONS.CLEAR_ALL }),
};

// Theme Action Creators
export const themeActions = {
  set: (theme: "light" | "dark" | "system") => ({
    type: THEME_ACTIONS.SET_THEME,
    payload: theme,
  }),
  toggle: () => ({ type: THEME_ACTIONS.TOGGLE_THEME }),
};

// User Action Creators
export const userActions = {
  set: (user: any) => ({
    type: USER_ACTIONS.SET_USER,
    payload: user,
  }),
  update: (updates: Partial<any>) => ({
    type: USER_ACTIONS.UPDATE_USER,
    payload: updates,
  }),
  clear: () => ({ type: USER_ACTIONS.CLEAR_USER }),
};

// Appointment Action Creators
export const appointmentActions = {
  setAll: (appointments: any[]) => ({
    type: APPOINTMENT_ACTIONS.SET_APPOINTMENTS,
    payload: appointments,
  }),
  add: (appointment: any) => ({
    type: APPOINTMENT_ACTIONS.ADD_APPOINTMENT,
    payload: appointment,
  }),
  update: (id: string, updates: Partial<any>) => ({
    type: APPOINTMENT_ACTIONS.UPDATE_APPOINTMENT,
    payload: { id, updates },
  }),
  delete: (id: string) => ({
    type: APPOINTMENT_ACTIONS.DELETE_APPOINTMENT,
    payload: id,
  }),
  setLoading: (loading: boolean) => ({
    type: APPOINTMENT_ACTIONS.SET_LOADING,
    payload: loading,
  }),
  setError: (error: string | null) => ({
    type: APPOINTMENT_ACTIONS.SET_ERROR,
    payload: error,
  }),
};

// Provider Action Creators
export const providerActions = {
  setAll: (providers: any[]) => ({
    type: PROVIDER_ACTIONS.SET_PROVIDERS,
    payload: providers,
  }),
  add: (provider: any) => ({
    type: PROVIDER_ACTIONS.ADD_PROVIDER,
    payload: provider,
  }),
  update: (id: string, updates: Partial<any>) => ({
    type: PROVIDER_ACTIONS.UPDATE_PROVIDER,
    payload: { id, updates },
  }),
  delete: (id: string) => ({
    type: PROVIDER_ACTIONS.DELETE_PROVIDER,
    payload: id,
  }),
  setLoading: (loading: boolean) => ({
    type: PROVIDER_ACTIONS.SET_LOADING,
    payload: loading,
  }),
  setError: (error: string | null) => ({
    type: PROVIDER_ACTIONS.SET_ERROR,
    payload: error,
  }),
};

// Invoice Action Creators
export const invoiceActions = {
  setAll: (invoices: any[]) => ({
    type: INVOICE_ACTIONS.SET_INVOICES,
    payload: invoices,
  }),
  add: (invoice: any) => ({
    type: INVOICE_ACTIONS.ADD_INVOICE,
    payload: invoice,
  }),
  update: (id: string, updates: Partial<any>) => ({
    type: INVOICE_ACTIONS.UPDATE_INVOICE,
    payload: { id, updates },
  }),
  delete: (id: string) => ({
    type: INVOICE_ACTIONS.DELETE_INVOICE,
    payload: id,
  }),
  setLoading: (loading: boolean) => ({
    type: INVOICE_ACTIONS.SET_LOADING,
    payload: loading,
  }),
  setError: (error: string | null) => ({
    type: INVOICE_ACTIONS.SET_ERROR,
    payload: error,
  }),
};

// ============================================================================
// ACTION TYPES UNION
// ============================================================================

export type AuthAction = ReturnType<
  (typeof authActions)[keyof typeof authActions]
>;
export type NotificationAction = ReturnType<
  (typeof notificationActions)[keyof typeof notificationActions]
>;
export type ThemeAction = ReturnType<
  (typeof themeActions)[keyof typeof themeActions]
>;
export type UserAction = ReturnType<
  (typeof userActions)[keyof typeof userActions]
>;
export type AppointmentAction = ReturnType<
  (typeof appointmentActions)[keyof typeof appointmentActions]
>;
export type ProviderAction = ReturnType<
  (typeof providerActions)[keyof typeof providerActions]
>;
export type InvoiceAction = ReturnType<
  (typeof invoiceActions)[keyof typeof invoiceActions]
>;

export type AppAction =
  | AuthAction
  | NotificationAction
  | ThemeAction
  | UserAction
  | AppointmentAction
  | ProviderAction
  | InvoiceAction;
