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
import { UINotification } from '@/lib/types';
import { PreferencesData } from '@/lib/types';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type NotificationCategory =
  | 'all'
  | 'payments'
  | 'kyc'
  | 'security'
  | 'services'
  | 'support'
  | 'system';

export default function NotificationsPage() {
  const { isAuthenticated, isLoading } = useAuth();
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
    'realtime' | 'actions' | 'history' | 'preferences'
  >('realtime');
  const [categoryFilter, setCategoryFilter] =
    useState<NotificationCategory>('all');

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
        `/api/notifications?page=${historyPage}&limit=50&status=all`,
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération de l'historique");
      }
      const data = await response.json();
      if (data.success) {
        setHistoryNotifications(data.notifications || []);
        setHistoryTotalPages(data.pagination?.pages || 1);
      }
    } catch (_error) {
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

  const getCategory = (notificationType: string): NotificationCategory => {
    const t = (notificationType || '').toUpperCase();
    if (t.startsWith('PAYMENT_')) return 'payments';
    if (t.startsWith('KYC_')) return 'kyc';
    if (t.startsWith('LOGIN_') || t.startsWith('TWO_FACTOR_')) return 'security';
    if (
      t.startsWith('BOOKING_') ||
      t.startsWith('APPOINTMENT_') ||
      t.startsWith('INVOICE_') ||
      t.startsWith('QUOTE_') ||
      t.startsWith('ORDER_')
    )
      return 'services';
    if (t.startsWith('TICKET_') || t.startsWith('COMPLAINT_')) return 'support';
    return 'system';
  };

  const isActionRequired = (n: UINotification) => {
    const t = (n.type || '').toUpperCase();
    return (
      (!n.read &&
        (t === 'PAYMENT_FAILED' ||
          t === 'KYC_REQUIRED_REMINDER' ||
          t === 'KYC_REJECTED')) ||
      t === 'DISPUTE_CREATED'
    );
  };

  const getPrimaryAction = (
    n: UINotification,
  ): { label: string; href: string } | null => {
    const t = (n.type || '').toUpperCase();
    if (t.startsWith('PAYMENT_')) {
      return { label: 'Voir mes transactions', href: '/dashboard/payments/transactions' };
    }
    if (t.startsWith('APPOINTMENT_') || t.startsWith('BOOKING_')) {
      return { label: 'Voir mes réservations', href: '/dashboard/bookings' };
    }
    if (t.startsWith('KYC_')) {
      return { label: 'Voir mon compte', href: '/dashboard/customer' };
    }
    if (t.startsWith('TICKET_') || t.startsWith('COMPLAINT_')) {
      return { label: 'Contacter le support', href: '/dashboard/settings/support' };
    }
    return null;
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
    <div className='space-y-4 sm:space-y-6 px-4 sm:px-0'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
            Centre de notifications
          </h1>
          <p className='text-sm sm:text-base text-gray-600 mt-1'>
            Gérez vos notifications et restez informé
          </p>
          <p className='text-xs sm:text-sm text-gray-500 mt-2'>
            Les emails importants (paiements, KYC) sont envoyés automatiquement. Le reste reste disponible ici.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className='flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors text-sm sm:text-base w-full sm:w-auto'
          >
            <CheckCheck className='h-4 w-4 sm:h-5 sm:w-5' />
            <span className='whitespace-nowrap'>Tout marquer comme lu</span>
          </button>
        )}
      </div>

      {/* Onglets */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
        <div className='flex overflow-x-auto border-b border-gray-200 scrollbar-hide'>
          <button
            onClick={() => setActiveTab('realtime')}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'realtime'
                ? 'border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)]'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Clock className='h-3 w-3 sm:h-4 sm:w-4' />
            <span>Temps réel</span>
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'actions'
                ? 'border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)]'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Bell className='h-3 w-3 sm:h-4 sm:w-4' />
            <span>À faire</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'history'
                ? 'border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)]'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <History className='h-3 w-3 sm:h-4 sm:w-4' />
            <span>Historique</span>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'preferences'
                ? 'border-[hsl(25,100%,53%)] text-[hsl(25,100%,53%)]'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Settings className='h-3 w-3 sm:h-4 sm:w-4' />
            <span>Préférences</span>
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className='p-4 sm:p-6'>
          {activeTab === 'realtime' && (
            <div className='space-y-4'>
              {/* Filtres pour Temps réel */}
              <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4'>
                <div className='flex items-center space-x-2'>
                  <Filter className='h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0' />
                  <span className='text-xs sm:text-sm text-gray-700 font-medium'>Filtres:</span>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      filter === 'all'
                        ? 'bg-[hsl(25,100%,53%)] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Toutes ({notifications.length})
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      filter === 'unread'
                        ? 'bg-[hsl(25,100%,53%)] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Non lues ({unreadCount})
                  </button>
                  <button
                    onClick={() => setFilter('read')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      filter === 'read'
                        ? 'bg-[hsl(25,100%,53%)] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Lues
                  </button>
                </div>
              </div>

              {/* Catégories (customer-friendly) */}
              <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4'>
                <div className='flex items-center space-x-2'>
                  <Filter className='h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0' />
                  <span className='text-xs sm:text-sm text-gray-700 font-medium'>Catégories:</span>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {(
                    [
                      { key: 'all', label: 'Tout' },
                      { key: 'payments', label: 'Paiements' },
                      { key: 'kyc', label: 'KYC' },
                      { key: 'security', label: 'Sécurité' },
                      { key: 'services', label: 'Services' },
                      { key: 'support', label: 'Support' },
                      { key: 'system', label: 'Système' },
                    ] as const
                  ).map(item => {
                    const count =
                      item.key === 'all'
                        ? notifications.length
                        : notifications.filter(n => getCategory(n.type) === item.key).length;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setCategoryFilter(item.key)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                          categoryFilter === item.key
                            ? 'bg-[hsl(25,100%,53%)] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {item.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Liste des notifications en temps réel */}
              <NotificationsList
                notifications={
                  categoryFilter === 'all'
                    ? notifications
                    : notifications.filter(n => getCategory(n.type) === categoryFilter)
                }
                loading={loading}
                filter={filter}
                markAsRead={markAsRead}
                formatDate={formatDate}
                getChannelIcon={getChannelIcon}
                getStatusColor={getStatusColor}
                getPrimaryAction={getPrimaryAction}
                onNavigate={(href: string) => router.push(href)}
                totalPages={totalPages}
                page={page}
                setPage={setPage}
              />
            </div>
          )}

          {activeTab === 'actions' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <h3 className='text-base sm:text-lg font-semibold text-gray-900'>
                    À faire
                  </h3>
                  <p className='text-xs sm:text-sm text-gray-600 mt-1'>
                    Les notifications qui nécessitent une action de votre part
                  </p>
                </div>
              </div>

              <NotificationsList
                notifications={notifications.filter(isActionRequired)}
                loading={loading}
                filter='unread'
                markAsRead={markAsRead}
                formatDate={formatDate}
                getChannelIcon={getChannelIcon}
                getStatusColor={getStatusColor}
                getPrimaryAction={getPrimaryAction}
                onNavigate={(href: string) => router.push(href)}
                totalPages={1}
                page={1}
                setPage={() => {}}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <h3 className='text-base sm:text-lg font-semibold text-gray-900'>
                    Historique complet
                  </h3>
                  <p className='text-xs sm:text-sm text-gray-600 mt-1'>
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
                    getPrimaryAction={getPrimaryAction}
                    onNavigate={(href: string) => router.push(href)}
                    totalPages={historyTotalPages}
                    page={historyPage}
                    setPage={setHistoryPage}
                  />
                </>
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
                  setData={(newData: PreferencesData) => {
                    setPreferences(newData);
                  }}
                  onSave={async () => {
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
  getPrimaryAction,
  onNavigate,
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
  getPrimaryAction: (
    n: UINotification,
  ) => { label: string; href: string } | null;
  onNavigate: (href: string) => void;
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
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
      {notifications.length === 0 ? (
        <div className='p-6 sm:p-12 text-center'>
          <Bell className='h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-base sm:text-lg font-medium text-gray-900 mb-2'>
            Aucune notification
          </h3>
          <p className='text-sm sm:text-base text-gray-600'>
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
              className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
            >
              <div className='flex items-start justify-between gap-3 sm:gap-4'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-start gap-2 sm:gap-3 mb-2'>
                    <h3
                      className={`text-base sm:text-lg font-semibold break-words ${
                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {notification.subject}
                    </h3>
                    {!notification.read && (
                      <span className='h-2 w-2 bg-[hsl(25,100%,53%)] rounded-full flex-shrink-0 mt-2'></span>
                    )}
                  </div>
                  <p className='text-sm sm:text-base text-gray-600 mb-3 break-words'>{notification.content}</p>
                  <div className='flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500'>
                    <span className='whitespace-nowrap'>{formatDate(notification.createdAt)}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                        notification.status,
                      )}`}
                    >
                      {notification.status}
                    </span>
                    <div className='flex items-center gap-1 sm:gap-2'>
                      {notification.channels.map((channel, idx) => (
                        <div
                          key={idx}
                          className='flex items-center text-gray-400'
                          title={channel.type}
                        >
                          {getChannelIcon(channel.type)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {getPrimaryAction(notification) && (
                    <div className='mt-3 flex flex-wrap gap-2'>
                      <button
                        onClick={() => onNavigate(getPrimaryAction(notification)!.href)}
                        className='px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors'
                      >
                        {getPrimaryAction(notification)!.label}
                      </button>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className='px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors'
                        >
                          Marquer comme lu
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className='ml-2 sm:ml-4 p-2 text-gray-400 hover:text-[hsl(25,100%,53%)] transition-colors flex-shrink-0'
                    title='Marquer comme lu'
                  >
                    <Check className='h-4 w-4 sm:h-5 sm:w-5' />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='p-3 sm:p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-0 sm:space-x-2'>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className='w-full sm:w-auto px-3 sm:px-4 py-2 rounded-md border border-gray-300 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Précédent
          </button>
          <span className='px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap'>
            Page {page} sur {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className='w-full sm:w-auto px-3 sm:px-4 py-2 rounded-md border border-gray-300 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
