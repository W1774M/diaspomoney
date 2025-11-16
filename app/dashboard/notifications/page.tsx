'use client';

/**
 * Page de notifications
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useNotifications, useAuth)
 * - Service Layer Pattern (via les API routes)
 * - Logger Pattern (logging structuré côté serveur)
 */

import NotificationSettings from '@/components/settings/NotificationSettings';
import { useAuth } from '@/hooks';
import {
  useNotificationPreferences,
  useNotifications,
} from '@/hooks/notifications';
import { UINotification } from '@/types/notifications';
import { PreferencesData } from '@/types/settings';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Filter,
  History,
  Mail,
  MessageSquare,
  Phone,
  Settings,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function NotificationsPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    totalPages,
    page,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setPage,
  } = useNotifications();
  const {
    preferences,
    loading: preferencesLoading,
    saving: preferencesSaving,
    setPreferences,
    updatePreferences,
  } = useNotificationPreferences();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [activeTab, setActiveTab] = useState<
    'realtime' | 'history' | 'personalized' | 'preferences'
  >('realtime');

  // États pour l'historique et les notifications personnalisées
  const [historyPage, setHistoryPage] = useState(1);
  const [historyNotifications, setHistoryNotifications] = useState<
    UINotification[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(filter, page);
    }
  }, [isAuthenticated, filter, page, fetchNotifications]);

  const fetchHistoryNotifications = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(
        `/api/notifications?page=${historyPage}&limit=50&status=all`
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération de l'historique");
      }
      const data = await response.json();
      if (data.success) {
        setHistoryNotifications(data.notifications || []);
        setHistoryTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      // Le logging est fait côté serveur
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage]);

  // Charger l'historique complet quand l'onglet est actif
  useEffect(() => {
    if (isAuthenticated && activeTab === 'history') {
      fetchHistoryNotifications();
    }
  }, [isAuthenticated, activeTab, fetchHistoryNotifications]);

  // Filtrer les notifications par rôle de l'utilisateur
  const getPersonalizedNotifications = () => {
    if (!user?.roles || user.roles.length === 0) return [];

    // Filtrer les notifications qui correspondent aux rôles de l'utilisateur
    // On suppose que le type de notification contient le rôle (ex: "BOOKING_CUSTOMER", "INVOICE_PROVIDER")
    return notifications.filter(notification => {
      const notificationType = notification.type?.toUpperCase() || '';
      return user.roles.some(role => {
        const roleUpper = role.toUpperCase();
        // Vérifier si le type de notification contient le rôle
        return (
          notificationType.includes(roleUpper) ||
          notificationType.includes(roleUpper.replace('SUPERADMIN', 'ADMIN'))
        );
      });
    });
  };

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'EMAIL':
        return <Mail className='h-4 w-4' />;
      case 'SMS':
        return <MessageSquare className='h-4 w-4' />;
      case 'WHATSAPP':
        return <MessageSquare className='h-4 w-4' />;
      case 'PUSH':
        return <Bell className='h-4 w-4' />;
      default:
        return <Phone className='h-4 w-4' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Centre de notifications
          </h1>
          <p className='text-gray-600 mt-1'>
            Gérez vos notifications et restez informé
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className='flex items-center space-x-2 px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors'
          >
            <CheckCheck className='h-5 w-5' />
            <span>Tout marquer comme lu</span>
          </button>
        )}
      </div>

      {/* Onglets */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <div className='flex border-b border-gray-200'>
          <button
            onClick={() => setActiveTab('realtime')}
            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'realtime'
                ? 'border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)]'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Clock className='h-4 w-4' />
            <span>Temps réel</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'history'
                ? 'border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)]'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <History className='h-4 w-4' />
            <span>Historique</span>
          </button>
          <button
            onClick={() => setActiveTab('personalized')}
            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'personalized'
                ? 'border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)]'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <User className='h-4 w-4' />
            <span>Personnalisées par rôle</span>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'preferences'
                ? 'border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)]'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Settings className='h-4 w-4' />
            <span>Préférences</span>
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className='p-6'>
          {activeTab === 'realtime' && (
            <div className='space-y-4'>
              {/* Filtres pour Temps réel */}
              <div className='flex items-center space-x-4'>
                <Filter className='h-5 w-5 text-gray-500' />
                <div className='flex space-x-2'>
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-[hsl(25,100%,53%)] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Toutes ({notifications.length})
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      filter === 'unread'
                        ? 'bg-[hsl(25,100%,53%)] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Non lues ({unreadCount})
                  </button>
                  <button
                    onClick={() => setFilter('read')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      filter === 'read'
                        ? 'bg-[hsl(25,100%,53%)] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Lues
                  </button>
                </div>
              </div>

              {/* Liste des notifications en temps réel */}
              <NotificationsList
                notifications={notifications}
                loading={loading}
                filter={filter}
                markAsRead={markAsRead}
                formatDate={formatDate}
                getChannelIcon={getChannelIcon}
                getStatusColor={getStatusColor}
                totalPages={totalPages}
                page={page}
                setPage={setPage}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Historique complet
                  </h3>
                  <p className='text-sm text-gray-600 mt-1'>
                    Toutes vos notifications depuis le début
                  </p>
                </div>
              </div>

              {historyLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
                </div>
              ) : (
                <>
                  <NotificationsList
                    notifications={historyNotifications}
                    loading={false}
                    filter='all'
                    markAsRead={markAsRead}
                    formatDate={formatDate}
                    getChannelIcon={getChannelIcon}
                    getStatusColor={getStatusColor}
                    totalPages={historyTotalPages}
                    page={historyPage}
                    setPage={setHistoryPage}
                  />
                </>
              )}
            </div>
          )}

          {activeTab === 'personalized' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Notifications personnalisées par rôle
                  </h3>
                  <p className='text-sm text-gray-600 mt-1'>
                    Notifications filtrées selon vos rôles:{' '}
                    {user?.roles?.join(', ') || 'Aucun rôle'}
                  </p>
                </div>
              </div>

              {getPersonalizedNotifications().length === 0 ? (
                <div className='text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200'>
                  <User className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    Aucune notification personnalisée
                  </h3>
                  <p className='text-gray-600'>
                    Aucune notification ne correspond à vos rôles actuels
                  </p>
                </div>
              ) : (
                <NotificationsList
                  notifications={getPersonalizedNotifications()}
                  loading={loading}
                  filter='all'
                  markAsRead={markAsRead}
                  formatDate={formatDate}
                  getChannelIcon={getChannelIcon}
                  getStatusColor={getStatusColor}
                  totalPages={1}
                  page={1}
                  setPage={() => {}}
                />
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className='space-y-4'>
              {preferencesLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
                </div>
              ) : (
                <NotificationSettings
                  data={preferences}
                  setData={newData => {
                    // NotificationSettings met à jour localement via setData
                    // On met à jour les préférences localement pour l'UI immédiate
                    setPreferences(newData as PreferencesData);
                  }}
                  onSave={async () => {
                    // La sauvegarde réelle se fait via updatePreferences
                    await updatePreferences(preferences);
                  }}
                  saving={preferencesSaving}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant pour la liste des notifications
function NotificationsList({
  notifications,
  loading,
  filter,
  markAsRead,
  formatDate,
  getChannelIcon,
  getStatusColor,
  totalPages,
  page,
  setPage,
}: {
  notifications: UINotification[];
  loading: boolean;
  filter: 'all' | 'unread' | 'read';
  markAsRead: (id: string) => void;
  formatDate: (dateString: string) => string;
  getChannelIcon: (channelType: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  totalPages: number;
  page: number;
  setPage: (page: number) => void;
}) {
  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
      {notifications.length === 0 ? (
        <div className='p-12 text-center'>
          <Bell className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Aucune notification
          </h3>
          <p className='text-gray-600'>
            {filter === 'unread'
              ? "Vous n'avez aucune notification non lue"
              : "Vous n'avez aucune notification"}
          </p>
        </div>
      ) : (
        <div className='divide-y divide-gray-200'>
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-6 hover:bg-gray-50 transition-colors ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center space-x-3 mb-2'>
                    <h3
                      className={`text-lg font-semibold ${
                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {notification.subject}
                    </h3>
                    {!notification.read && (
                      <span className='h-2 w-2 bg-[hsl(25,100%,53%)] rounded-full'></span>
                    )}
                  </div>
                  <p className='text-gray-600 mb-3'>{notification.content}</p>
                  <div className='flex items-center space-x-4 text-sm text-gray-500'>
                    <span>{formatDate(notification.createdAt)}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        notification.status
                      )}`}
                    >
                      {notification.status}
                    </span>
                    <div className='flex items-center space-x-2'>
                      {notification.channels.map((channel, idx) => (
                        <div
                          key={idx}
                          className='flex items-center space-x-1 text-gray-400'
                        >
                          {getChannelIcon(channel.type)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className='ml-4 p-2 text-gray-400 hover:text-[hsl(25,100%,53%)] transition-colors'
                    title='Marquer comme lu'
                  >
                    <Check className='h-5 w-5' />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='p-4 border-t border-gray-200 flex justify-center space-x-2'>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className='px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Précédent
          </button>
          <span className='px-4 py-2 text-sm text-gray-700'>
            Page {page} sur {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className='px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
