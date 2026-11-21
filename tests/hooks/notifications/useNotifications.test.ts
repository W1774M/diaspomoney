/**
 * Tests unitaires pour useNotifications
 * 
 * Implémente les tests pour :
 * - Gestion des notifications
 * - Marquage comme lu
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '@/hooks/notifications/useNotifications';

// Mock de fetch global
global.fetch = vi.fn();

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les notifications', async () => {
    const mockNotifications = [
      { id: 'n1', title: 'Notification 1', read: false },
      { id: 'n2', title: 'Notification 2', read: true },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        notifications: mockNotifications,
        unreadCount: 1,
        pagination: { pages: 1 },
      }),
    } as Response);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.fetchNotifications();
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.loading).toBe(false);
  });

  it('devrait marquer une notification comme lue', async () => {
    const mockNotifications = [
      { id: 'n1', title: 'Notification 1', read: false },
    ];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          notifications: mockNotifications,
          unreadCount: 1,
          pagination: { pages: 1 },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.fetchNotifications('all', 1);
    });

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    expect(result.current.notifications?.[0]?.read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('devrait marquer toutes les notifications comme lues', async () => {
    const mockNotifications = [
      { id: 'n1', title: 'Notification 1', read: false },
      { id: 'n2', title: 'Notification 2', read: false },
    ];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          notifications: mockNotifications,
          unreadCount: 2,
          pagination: { pages: 1 },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.fetchNotifications();
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(result.current.notifications.every(n => n.read)).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('devrait filtrer les notifications (all, unread, read)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        notifications: [],
        unreadCount: 0,
        pagination: { pages: 1 },
      }),
    } as Response);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.fetchNotifications('unread', 1);
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/notifications?page=1&limit=20&status=unread',
    );
  });

  it('devrait gérer la pagination', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        notifications: [],
        unreadCount: 0,
        pagination: { pages: 5 },
      }),
    } as Response);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.fetchNotifications('all', 3);
    });

    expect(result.current.totalPages).toBe(5);
    expect(result.current.page).toBe(3);
  });

  it('devrait gérer les erreurs API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.fetchNotifications();
    });

    expect(result.current.error).toBe('Erreur lors de la récupération des notifications');
  });

  it('devrait gérer les états de chargement', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(fetch).mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.fetchNotifications();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({
          success: true,
          notifications: [],
          unreadCount: 0,
          pagination: { pages: 1 },
        }),
      });
      await promise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('devrait gérer les erreurs', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.fetchNotifications();
    });

    expect(result.current.error).toBe('Network error');
  });

  it('devrait gérer les erreurs avec data.error lors de la récupération', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Erreur personnalisée',
      }),
    } as Response);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.fetchNotifications();
    });

    expect(result.current.error).toBe('Erreur personnalisée');
  });

  it('devrait gérer les erreurs lors du marquage comme lu', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    expect(result.current.error).toBe('Erreur lors de la mise à jour');
  });

  it('devrait gérer les erreurs lors du marquage de toutes les notifications comme lues', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(result.current.error).toBe('Erreur lors de la mise à jour');
  });
});

