'use client';

/**
 * Custom Hook pour les notifications
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services
 */

import { UseNotificationsReturn } from '@/types/hooks';
import { UINotification } from '@/types/notifications';
import { useCallback, useState } from 'react';

/**
 * Custom Hook pour gérer les notifications
 * Implémente le Custom Hooks Pattern
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(
    async (filter: 'all' | 'unread' | 'read' = 'all', pageNum: number = 1) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/notifications?page=${pageNum}&limit=20&status=${filter}`,
        );

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des notifications');
        }

        const data = await response.json();

        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          setTotalPages(data.pagination?.pages || 1);
          setPage(pageNum);
        } else {
          throw new Error(data.error || 'Erreur inconnue');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        // Le logging est fait côté serveur via NotificationService avec @Log decorator
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, read: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)),
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      // Le logging est fait côté serveur via NotificationService avec @Log decorator
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      // Le logging est fait côté serveur via NotificationService avec @Log decorator
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    totalPages,
    page,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setPage,
  };
}
