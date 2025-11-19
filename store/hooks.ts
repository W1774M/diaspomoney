import { useCallback } from "react";
import {
  appointmentActions,
  authActions,
  invoiceActions,
  notificationActions,
  providerActions,
  themeActions,
  userActions,
} from "./actions";
import { useAppDispatch } from "./index";

// ============================================================================
// AUTH HOOKS
// ============================================================================

export const useAuthActions = () => {
  const dispatch = useAppDispatch();

  return {
    loginStart: useCallback(
      () => dispatch(authActions.loginStart()),
      [dispatch],
    ),
    loginSuccess: useCallback(
      (user: any) => dispatch(authActions.loginSuccess(user)),
      [dispatch],
    ),
    loginFailure: useCallback(
      (error: string) => dispatch(authActions.loginFailure(error)),
      [dispatch],
    ),
    logout: useCallback(() => dispatch(authActions.logout()), [dispatch]),
    setError: useCallback(
      (error: string) => dispatch(authActions.setError(error)),
      [dispatch],
    ),
    clearError: useCallback(
      () => dispatch(authActions.clearError()),
      [dispatch],
    ),
    setLoading: useCallback(
      (loading: boolean) => dispatch(authActions.setLoading(loading)),
      [dispatch],
    ),
  };
};

// ============================================================================
// NOTIFICATION HOOKS
// ============================================================================

export const useNotificationActions = () => {
  const dispatch = useAppDispatch();

  return {
    add: useCallback(
      (notification: Omit<any, "id">) =>
        dispatch(notificationActions.add(notification)),
      [dispatch],
    ),
    remove: useCallback(
      (id: string) => dispatch(notificationActions.remove(id)),
      [dispatch],
    ),
    clearAll: useCallback(
      () => dispatch(notificationActions.clearAll()),
      [dispatch],
    ),
  };
};

// ============================================================================
// THEME HOOKS
// ============================================================================

export const useThemeActions = () => {
  const dispatch = useAppDispatch();

  return {
    set: useCallback(
      (theme: "light" | "dark" | "system") => dispatch(themeActions.set(theme)),
      [dispatch],
    ),
    toggle: useCallback(() => dispatch(themeActions.toggle()), [dispatch]),
  };
};

// ============================================================================
// USER HOOKS
// ============================================================================

export const useUserActions = () => {
  const dispatch = useAppDispatch();

  return {
    set: useCallback(
      (user: any) => dispatch(userActions.set(user)),
      [dispatch],
    ),
    update: useCallback(
      (updates: Partial<any>) => dispatch(userActions.update(updates)),
      [dispatch],
    ),
    clear: useCallback(() => dispatch(userActions.clear()), [dispatch]),
  };
};

// ============================================================================
// APPOINTMENT HOOKS
// ============================================================================

export const useAppointmentActions = () => {
  const dispatch = useAppDispatch();

  return {
    setAll: useCallback(
      (appointments: any[]) =>
        dispatch(appointmentActions.setAll(appointments)),
      [dispatch],
    ),
    add: useCallback(
      (appointment: any) => dispatch(appointmentActions.add(appointment)),
      [dispatch],
    ),
    update: useCallback(
      (id: string, updates: Partial<any>) =>
        dispatch(appointmentActions.update(id, updates)),
      [dispatch],
    ),
    delete: useCallback(
      (id: string) => dispatch(appointmentActions.delete(id)),
      [dispatch],
    ),
    setLoading: useCallback(
      (loading: boolean) => dispatch(appointmentActions.setLoading(loading)),
      [dispatch],
    ),
    setError: useCallback(
      (error: string | null) => dispatch(appointmentActions.setError(error)),
      [dispatch],
    ),
  };
};

// ============================================================================
// PROVIDER HOOKS
// ============================================================================

export const useProviderActions = () => {
  const dispatch = useAppDispatch();

  return {
    setAll: useCallback(
      (providers: any[]) => dispatch(providerActions.setAll(providers)),
      [dispatch],
    ),
    add: useCallback(
      (provider: any) => dispatch(providerActions.add(provider)),
      [dispatch],
    ),
    update: useCallback(
      (id: string, updates: Partial<any>) =>
        dispatch(providerActions.update(id, updates)),
      [dispatch],
    ),
    delete: useCallback(
      (id: string) => dispatch(providerActions.delete(id)),
      [dispatch],
    ),
    setLoading: useCallback(
      (loading: boolean) => dispatch(providerActions.setLoading(loading)),
      [dispatch],
    ),
    setError: useCallback(
      (error: string | null) => dispatch(providerActions.setError(error)),
      [dispatch],
    ),
  };
};

// ============================================================================
// INVOICE HOOKS
// ============================================================================

export const useInvoiceActions = () => {
  const dispatch = useAppDispatch();

  return {
    setAll: useCallback(
      (invoices: any[]) => dispatch(invoiceActions.setAll(invoices)),
      [dispatch],
    ),
    add: useCallback(
      (invoice: any) => dispatch(invoiceActions.add(invoice)),
      [dispatch],
    ),
    update: useCallback(
      (id: string, updates: Partial<any>) =>
        dispatch(invoiceActions.update(id, updates)),
      [dispatch],
    ),
    delete: useCallback(
      (id: string) => dispatch(invoiceActions.delete(id)),
      [dispatch],
    ),
    setLoading: useCallback(
      (loading: boolean) => dispatch(providerActions.setLoading(loading)),
      [dispatch],
    ),
    setError: useCallback(
      (error: string | null) => dispatch(providerActions.setError(error)),
      [dispatch],
    ),
  };
};

// ============================================================================
// COMPOSITE HOOKS
// ============================================================================

// Hook that provides all actions
export const useAllActions = () => {
  const authActions = useAuthActions();
  const notificationActions = useNotificationActions();
  const themeActions = useThemeActions();
  const userActions = useUserActions();
  const appointmentActions = useAppointmentActions();
  const providerActions = useProviderActions();
  const invoiceActions = useInvoiceActions();

  return {
    auth: authActions,
    notifications: notificationActions,
    theme: themeActions,
    user: userActions,
    appointments: appointmentActions,
    providers: providerActions,
    invoices: invoiceActions,
  };
};

// Hook for async operations with loading states
export const useAsyncOperation = <T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
) => {
  return useCallback(
    async (...args: T): Promise<R | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await operation(...args);
        setLoading(false);
        return result;
      } catch (error) {
        setLoading(false);
        const errorMessage =
          error instanceof Error ? error.message : "Une erreur est survenue";
        setError(errorMessage);
        return null;
      }
    },
    [operation, setLoading, setError],
  );
};

// Hook for form operations
export const useFormActions = () => {
  const dispatch = useAppDispatch();

  return {
    resetForm: useCallback(() => {
      // Reset all form-related states
      dispatch(authActions.clearError());
      dispatch(authActions.setLoading(false));
    }, [dispatch]),

    handleFormError: useCallback(
      (error: string) => {
        dispatch(authActions.setError(error));
        dispatch(authActions.setLoading(false));
      },
      [dispatch],
    ),

    handleFormSuccess: useCallback(() => {
      dispatch(authActions.clearError());
      dispatch(authActions.setLoading(false));
    }, [dispatch]),
  };
};
