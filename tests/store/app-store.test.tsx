import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appointmentActions,
  authActions,
  invoiceActions,
  notificationActions,
  providerActions,
  themeActions,
  userActions,
} from '@/store/actions';
import {
  useAllActions,
  useAsyncOperation,
  useFormActions,
  useInvoiceActions,
} from '@/store/hooks';
import {
  useAppointmentDispatch,
  useAuth,
  useAuthDispatch,
  useInvoiceDispatch,
  useNotificationCount,
  useNotificationDispatch,
  useProviderDispatch,
  useTheme,
  useThemeDispatch,
  useUserDispatch,
  useAppStore,
} from '@/store';

describe('useAppStore', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useAppStore.getState().reset();
    });
  });

  it('ignore une action vide ou un préfixe inconnu', () => {
    const before = useAppStore.getState().auth;
    act(() => {
      useAppStore.getState().dispatch(undefined as never);
      useAppStore.getState().dispatch({ type: '' } as never);
      useAppStore.getState().dispatch({ type: 'BILLING/PAY' } as never);
    });
    expect(useAppStore.getState().auth).toEqual(before);
  });

  it('connecte, déconnecte, et isole la remise à zéro de l’auth', () => {
    act(() => {
      useAppStore.getState().dispatch(authActions.loginStart());
    });
    expect(useAppStore.getState().auth.isLoading).toBe(true);

    act(() => {
      useAppStore.getState().dispatch(authActions.loginSuccess({ id: 'u1', name: 'Awa' }));
    });
    expect(useAppStore.getState().auth).toMatchObject({
      isLoading: false,
      isAuthenticated: true,
      user: { id: 'u1', name: 'Awa' },
    });

    act(() => {
      useAppStore.getState().dispatch(authActions.setError('session expirée'));
      useAppStore.getState().dispatch(authActions.setLoading(true));
    });
    expect(useAppStore.getState().auth.error).toBe('session expirée');

    act(() => {
      useAppStore.getState().dispatch(authActions.clearError());
      useAppStore.getState().dispatch(authActions.loginFailure('refus'));
    });
    expect(useAppStore.getState().auth).toMatchObject({
      error: 'refus',
      user: null,
      isAuthenticated: false,
    });

    act(() => {
      useAppStore.getState().dispatch(authActions.loginSuccess({ id: 'u1' }));
      useAppStore.getState().dispatch(themeActions.set('dark'));
      useAppStore.getState().resetAuth();
    });
    expect(useAppStore.getState().auth.isAuthenticated).toBe(false);
    expect(useAppStore.getState().theme.theme).toBe('dark');

    act(() => {
      useAppStore.getState().dispatch(authActions.logout());
    });
    expect(useAppStore.getState().auth.error).toBeNull();
  });

  it('range les notifications, le thème, l’utilisateur, les rendez-vous, les prestataires et les factures dans la bonne tranche', () => {
    act(() => {
      useAppStore.getState().dispatch(notificationActions.add({ message: 'bonjour', type: 'info' }));
      useAppStore.getState().dispatch(themeActions.set('dark'));
      useAppStore.getState().dispatch(themeActions.toggle());
      useAppStore.getState().dispatch(userActions.set({ id: 'u1', city: 'Dakar' }));
      useAppStore.getState().dispatch(userActions.update({ city: 'Paris' }));
      useAppStore.getState().dispatch(appointmentActions.setAll([{ id: 'a1', label: 'Visite' }]));
      useAppStore.getState().dispatch(appointmentActions.add({ id: 'a2', label: 'Suite' }));
      useAppStore.getState().dispatch(appointmentActions.update('a1', { label: 'Visite modifiée' }));
      useAppStore.getState().dispatch(appointmentActions.update('absente', { label: 'non' }));
      useAppStore.getState().dispatch(appointmentActions.setLoading(true));
      useAppStore.getState().dispatch(appointmentActions.setError('créneau pris'));
      useAppStore.getState().dispatch(providerActions.setAll([{ id: 'p1', name: 'Ndiaye' }]));
      useAppStore.getState().dispatch(providerActions.add({ id: 'p2', name: 'Diallo' }));
      useAppStore.getState().dispatch(providerActions.update('p2', { name: 'Diallo A.' }));
      useAppStore.getState().dispatch(providerActions.setLoading(true));
      useAppStore.getState().dispatch(providerActions.setError('indisponible'));
      useAppStore.getState().dispatch(invoiceActions.setAll([{ id: 'f1', total: 80 }]));
      useAppStore.getState().dispatch(invoiceActions.add({ id: 'f2', total: 10 }));
      useAppStore.getState().dispatch(invoiceActions.update('f1', { total: 90 }));
      useAppStore.getState().dispatch(invoiceActions.setLoading(true));
      useAppStore.getState().dispatch(invoiceActions.setError('impayée'));
    });

    const state = useAppStore.getState();
    expect(state.notifications.notifications).toHaveLength(1);
    expect(state.notifications.notifications[0].message).toBe('bonjour');
    expect(state.theme.theme).toBe('light');
    expect(state.user.currentUser).toEqual({ id: 'u1', city: 'Paris' });
    expect(state.appointments.appointments.map((item) => item.label)).toEqual(['Visite modifiée', 'Suite']);
    expect(state.appointments.error).toBe('créneau pris');
    expect(state.appointments.isLoading).toBe(false);
    expect(state.providers.providers[1].name).toBe('Diallo A.');
    expect(state.providers.error).toBe('indisponible');
    expect(state.invoices.invoices[0].total).toBe(90);
    expect(state.invoices.error).toBe('impayée');
    expect(state.providers.isLoading).toBe(false);

    const noteId = state.notifications.notifications[0].id;
    act(() => {
      useAppStore.getState().dispatch(notificationActions.remove(noteId));
      useAppStore.getState().dispatch(notificationActions.add({ message: 'autre' }));
      useAppStore.getState().dispatch(notificationActions.clearAll());
      useAppStore.getState().dispatch(appointmentActions.delete('a2'));
      useAppStore.getState().dispatch(providerActions.delete('p1'));
      useAppStore.getState().dispatch(invoiceActions.delete('f2'));
      useAppStore.getState().dispatch(userActions.clear());
      useAppStore.getState().dispatch(userActions.update({ city: 'Lyon' }));
      useAppStore.getState().dispatch(themeActions.set('system'));
      useAppStore.getState().dispatch(themeActions.toggle());
    });

    const after = useAppStore.getState();
    expect(after.notifications.notifications).toEqual([]);
    expect(after.appointments.appointments).toHaveLength(1);
    expect(after.providers.providers).toHaveLength(1);
    expect(after.invoices.invoices).toHaveLength(1);
    expect(after.user.currentUser).toBeNull();
    expect(after.theme.theme).toBe('light');
  });

  it('remet chaque tranche à zéro sans effacer les autres', () => {
    act(() => {
      useAppStore.getState().dispatch(themeActions.set('dark'));
      useAppStore.getState().dispatch(notificationActions.add({ message: 'x' }));
      useAppStore.getState().dispatch(userActions.set({ id: 'u1' }));
      useAppStore.getState().dispatch(appointmentActions.add({ id: 'a1' }));
      useAppStore.getState().dispatch(providerActions.add({ id: 'p1' }));
      useAppStore.getState().dispatch(invoiceActions.add({ id: 'f1' }));
      useAppStore.getState().resetNotifications();
      useAppStore.getState().resetTheme();
      useAppStore.getState().resetUser();
      useAppStore.getState().resetAppointments();
      useAppStore.getState().resetProviders();
      useAppStore.getState().resetInvoices();
    });
    const state = useAppStore.getState();
    expect(state.notifications.notifications).toEqual([]);
    expect(state.theme.theme).toBe('system');
    expect(state.user.currentUser).toBeNull();
    expect(state.appointments.appointments).toEqual([]);
    expect(state.providers.providers).toEqual([]);
    expect(state.invoices.invoices).toEqual([]);
  });

  it('persiste le thème et la session, pas les factures', () => {
    act(() => {
      useAppStore.getState().dispatch(authActions.loginSuccess({ id: 'u1' }));
      useAppStore.getState().dispatch(themeActions.set('dark'));
      useAppStore.getState().dispatch(invoiceActions.add({ id: 'f1' }));
    });
    const raw = localStorage.getItem('diaspomoney-store');
    expect(raw).toBeTruthy();
    const saved = JSON.parse(raw as string);
    expect(saved.state.theme).toBe('dark');
    expect(saved.state.auth.isAuthenticated).toBe(true);
    expect(saved.state.invoices).toBeUndefined();
    expect(useAppStore.getState().getState().auth.user.id).toBe('u1');
  });
});

describe('sélecteurs et actions du store', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useAppStore.getState().reset();
    });
  });

  it('expose l’état auth et le compteur de notifications', () => {
    const auth = renderHook(() => useAuth());
    const count = renderHook(() => useNotificationCount());
    const theme = renderHook(() => useTheme());
    act(() => {
      useAppStore.getState().dispatch(authActions.loginSuccess({ id: 'u1' }));
      useAppStore.getState().dispatch(notificationActions.add({ message: 'a' }));
      useAppStore.getState().dispatch(themeActions.set('dark'));
    });
    expect(auth.result.current.isAuthenticated).toBe(true);
    expect(count.result.current).toBe(1);
    expect(theme.result.current).toBe('dark');
  });

  it('fait passer le chargement d’une facture par la tranche factures', () => {
    const { result } = renderHook(() => useInvoiceActions());
    act(() => {
      result.current.setLoading(true);
      result.current.setError('refusée');
    });
    expect(useAppStore.getState().invoices.isLoading).toBe(false);
    expect(useAppStore.getState().invoices.error).toBe('refusée');
    expect(useAppStore.getState().providers.isLoading).toBe(false);
    expect(useAppStore.getState().providers.error).toBeNull();
  });

  it('regroupe les actions et les formulaires', () => {
    const all = renderHook(() => useAllActions());
    const form = renderHook(() => useFormActions());
    act(() => {
      all.result.current.auth.loginSuccess({ id: 'u1' });
      all.result.current.notifications.add({ message: 'ok' });
      all.result.current.theme.toggle();
      all.result.current.user.set({ id: 'u1' });
      all.result.current.appointments.setError('x');
      all.result.current.providers.setAll([]);
      all.result.current.invoices.setLoading(true);
      form.result.current.handleFormError('champ requis');
    });
    expect(useAppStore.getState().auth.error).toBe('champ requis');
    expect(useAppStore.getState().auth.isLoading).toBe(false);
    expect(useAppStore.getState().invoices.isLoading).toBe(true);
    act(() => {
      form.result.current.handleFormSuccess();
      form.result.current.resetForm();
    });
    expect(useAppStore.getState().auth.error).toBeNull();
  });

  it('encadre une opération asynchrone, y compris un échec non Error', async () => {
    const setLoading = vi.fn();
    const setError = vi.fn();
    const ok = renderHook(() => useAsyncOperation(async (n: number) => n + 1, setLoading, setError));
    let value: number | null = null;
    await act(async () => {
      value = await ok.result.current(2);
    });
    expect(value).toBe(3);
    expect(setLoading).toHaveBeenCalledWith(false);

    const ko = renderHook(() =>
      useAsyncOperation(async () => {
        throw 'panne';
      }, setLoading, setError),
    );
    await act(async () => {
      value = await ko.result.current();
    });
    expect(value).toBeNull();
    expect(setError).toHaveBeenCalledWith('Une erreur est survenue');

    const err = renderHook(() =>
      useAsyncOperation(async () => {
        throw new Error('réseau');
      }, setLoading, setError),
    );
    await act(async () => {
      await err.result.current();
    });
    expect(setError).toHaveBeenCalledWith('réseau');
  });

  it('branche les hooks de tranche sur le dispatch', () => {
    const auth = renderHook(() => useAuthDispatch());
    const notes = renderHook(() => useNotificationDispatch());
    const theme = renderHook(() => useThemeDispatch());
    const user = renderHook(() => useUserDispatch());
    const appointments = renderHook(() => useAppointmentDispatch());
    const providers = renderHook(() => useProviderDispatch());
    const invoices = renderHook(() => useInvoiceDispatch());
    act(() => {
      auth.result.current.dispatch(authActions.loginStart());
      notes.result.current.dispatch(notificationActions.add({ message: 'n' }));
      theme.result.current.dispatch(themeActions.set('dark'));
      user.result.current.dispatch(userActions.set({ id: 'u1' }));
      appointments.result.current.dispatch(appointmentActions.setLoading(true));
      providers.result.current.dispatch(providerActions.setError('off'));
      invoices.result.current.dispatch(invoiceActions.add({ id: 'f1' }));
    });
    expect(auth.result.current.isLoading).toBe(true);
    expect(notes.result.current.notifications).toHaveLength(1);
    expect(theme.result.current.theme).toBe('dark');
    expect(user.result.current.currentUser).toEqual({ id: 'u1' });
    expect(appointments.result.current.isLoading).toBe(true);
    expect(providers.result.current.error).toBe('off');
    expect(invoices.result.current.invoices).toHaveLength(1);
  });
});
