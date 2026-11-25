import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authActions, notificationActions, themeActions, useSimpleStore } from '@/store/simple-store';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';
import { useThemeStore } from '@/store/theme';

describe('stores utilisés par l’écran', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSimpleStore.setState({
      theme: 'system',
      notifications: [],
      auth: { isLoading: false, error: null, user: null, isAuthenticated: false },
    });
    useNotificationStore.setState({ notifications: [] });
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('fait vivre le store simple de la connexion', () => {
    const { dispatch } = useSimpleStore.getState();
    dispatch(authActions.loginStart());
    expect(useSimpleStore.getState().auth.isLoading).toBe(true);
    dispatch(authActions.loginFailure('refus'));
    expect(useSimpleStore.getState().auth.error).toBe('refus');
    dispatch(authActions.loginSuccess({ id: 'u1' }));
    expect(useSimpleStore.getState().auth.isAuthenticated).toBe(true);
    dispatch(themeActions.toggle());
    expect(useSimpleStore.getState().theme).toBe('light');
    dispatch(themeActions.set('dark'));
    dispatch(themeActions.toggle());
    expect(useSimpleStore.getState().theme).toBe('light');
    dispatch(notificationActions.add({ message: 'ok' }));
    const id = useSimpleStore.getState().notifications[0].id as string;
    expect(id.startsWith('notification-')).toBe(true);
    dispatch(notificationActions.remove(id));
    dispatch(notificationActions.add({ message: 'encore' }));
    dispatch(notificationActions.clearAll());
    dispatch(authActions.logout());
    dispatch({ type: 'BILLING/X' } as never);
    expect(useSimpleStore.getState().notifications).toEqual([]);
    expect(useSimpleStore.getState().auth.user).toBeNull();
    expect(useSimpleStore.getState().theme).toBe('light');
  });

  it('affiche un toast puis le retire, ou le garde si la durée est nulle', () => {
    useNotificationStore.getState().addNotification({
      type: 'success',
      message: 'Demande envoyée',
      duration: 5000,
    });
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
    vi.advanceTimersByTime(5000);
    expect(useNotificationStore.getState().notifications).toEqual([]);

    useNotificationStore.getState().addNotification({
      type: 'info',
      message: 'reste affiché',
      duration: 0,
    });
    vi.advanceTimersByTime(10000);
    expect(useNotificationStore.getState().notifications).toHaveLength(1);

    useNotificationStore.getState().addNotification({ type: 'info', message: 'défaut' });
    vi.advanceTimersByTime(4999);
    expect(useNotificationStore.getState().notifications).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(useNotificationStore.getState().notifications).toHaveLength(1);

    const id = useNotificationStore.getState().notifications[0]?.id;
    expect(id).toBeTruthy();
    useNotificationStore.getState().removeNotification(id ?? '');
    useNotificationStore.getState().addNotification({ type: 'info', message: 'x' });
    useNotificationStore.getState().clearNotifications();
    expect(useNotificationStore.getState().notifications).toEqual([]);
  });

  it('connecte et inscrit via le store auth, et distingue les erreurs connues', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'user_not_found' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'invalid_password' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'autre' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'u1', email: 'awa@example.com' } }),
      })
      .mockRejectedValueOnce(new Error('réseau'))
      .mockRejectedValueOnce('panne')
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'u2' } }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await useAuthStore.getState().login('awa@example.com', 'secret');
    expect(useAuthStore.getState().error).toContain('enregistrer');
    await useAuthStore.getState().login('awa@example.com', 'secret');
    expect(useAuthStore.getState().error).toContain('Mot de passe');
    await useAuthStore.getState().login('awa@example.com', 'secret');
    expect(useAuthStore.getState().error).toContain('connexion');
    await useAuthStore.getState().login('awa@example.com', 'secret');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();

    await useAuthStore.getState().login('awa@example.com', 'secret');
    expect(useAuthStore.getState().error).toBe('réseau');
    await useAuthStore.getState().register({ email: 'a@b.c' });
    expect(useAuthStore.getState().error).toBe('Une erreur est survenue');
    await useAuthStore.getState().register({ email: 'a@b.c' });
    expect(useAuthStore.getState().error).toContain('inscription');
    await useAuthStore.getState().register({ email: 'a@b.c' });
    expect(useAuthStore.getState().user).toEqual({ id: 'u2' });

    useAuthStore.getState().setError('figé');
    expect(useAuthStore.getState().error).toBe('figé');
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
