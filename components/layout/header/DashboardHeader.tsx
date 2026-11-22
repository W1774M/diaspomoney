'use client';

import Logo from '@/components/ui/Logo';
import { useAuth } from '@/hooks/auth/useAuth';
import { useSignOut } from '@/hooks/auth/useSignOut';
import imageLoader from '@/lib/image-loader';
import { ROLES } from '@/lib/constants';
import type { UINotification } from '@/lib/types';
import { Bell, ChevronDown, Mail, MessageSquare, Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useDisclosure } from '@/hooks/_shared/useDisclosure';
import { useSidebar } from '@/contexts/SidebarContext';
import { childLogger } from '@/lib/logger';

const logger = childLogger({ component: 'DashboardHeader' });

export default function DashboardHeader({ className = '' }: { className?: string }) {
  const { user, isAuthenticated } = useAuth();
  const { signOut, isSigningOut } = useSignOut();
  const router = useRouter();
  const { open: openSidebar } = useSidebar();
  const userMenu = useDisclosure();
  const notificationMenu = useDisclosure();
  const isNotificationMenuOpen = notificationMenu.open;
  const setIsNotificationMenuOpen = notificationMenu.setOpen;
  const setIsUserMenuOpen = userMenu.setOpen;
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Récupérer le nombre de notifications non lues depuis l'API
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(
        '/api/notifications?page=1&limit=5&status=unread',
      );
      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.unreadCount || 0);
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      logger.error({ error }, 'Error fetching unread count');
    }
  }, [isAuthenticated]);

  // Charger les notifications au montage et périodiquement
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchUnreadCount();
    // Rafraîchir toutes les 30 s, seulement quand l'onglet est visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchUnreadCount();
    }, 30000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchUnreadCount();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAuthenticated, fetchUnreadCount]);

  // Charger les notifications quand le menu s'ouvre
  useEffect(() => {
    if (isNotificationMenuOpen && isAuthenticated) {
      setLoadingNotifications(true);
      fetch('/api/notifications?page=1&limit=5&status=all')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setNotifications(data.notifications || []);
          }
        })
        .catch(error => {
          logger.error({ error }, 'Error fetching notifications');
        })
        .finally(() => {
          setLoadingNotifications(false);
        });
    }
  }, [isNotificationMenuOpen, isAuthenticated]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, read: true }),
      });

      if (response.ok) {
        // Mettre à jour l'état local
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)),
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        // Rafraîchir les notifications
        fetchUnreadCount();
      }
    } catch (error) {
      logger.error({ error }, 'Error marking notification as read');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'EMAIL':
        return <Mail className='h-3 w-3' />;
      case 'SMS':
      case 'WHATSAPP':
        return <MessageSquare className='h-3 w-3' />;
      default:
        return <Bell className='h-3 w-3' />;
    }
  };

  // Déterminer le rôle principal pour l'affichage
  const getPrimaryRole = () => {
    if (!user?.roles || user.roles.length === 0) return 'Utilisateur';
    if (user.roles.includes(ROLES.ADMIN)) return 'Administrateur';
    if (user.roles.includes(ROLES.CSM)) return 'CSM';
    if (user.roles.includes(ROLES.PROVIDER)) return 'Prestataire';
    if (user.roles.includes(ROLES.CUSTOMER)) return 'Client';
    if (user.roles.includes(ROLES.BENEFICIARY)) return 'Bénéficiaire';
    return 'Utilisateur';
  };

  const getSecondaryRole = () => {
    if (!user?.roles || user.roles.length === 0) return '';
    if (user.roles.includes(ROLES.ADMIN) && user.roles.length > 1)
      return 'Super Admin';
    if (user.roles.length > 1) {
      const roles = user.roles.filter(r => r !== ROLES.ADMIN);
      return roles.join(', ') || '';
    }
    return '';
  };

  // Initiales pour l'avatar
  const getInitials = () => {
    if (user?.name) {
      const names = user.name.split(' ').filter(n => n && n.length > 0);
      if (names.length >= 2) {
        const first = names[0]?.charAt(0) || '';
        const last = names[names.length - 1]?.charAt(0) || '';
        return `${first}${last}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Extraire l'URL de l'avatar (peut être string ou objet)
  const getAvatarUrl = () => {
    if (!user?.avatar) return null;
    if (typeof user.avatar === 'string') return user.avatar;
    if (typeof user.avatar === 'object' && 'image' in user.avatar) {
      return (user.avatar as any).image;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  // Réinitialiser l'erreur d'avatar si l'URL change
  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  if (!user) {
    return null;
  }

  return (
    <header className={`bg-black border-b border-gray-800 ${className}`}>
      <div className='px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo et bouton hamburger */}
          <div className='flex items-center space-x-3'>
            {/* Bouton hamburger pour mobile/tablette */}
            <button
              onClick={openSidebar}
              type='button'
              className='lg:hidden inline-flex size-11 items-center justify-center text-white hover:text-brand-400 hover:bg-gray-800 rounded-md transition-colors'
              aria-label='Ouvrir le menu de navigation'
            >
              <Menu aria-hidden='true' className='h-6 w-6' />
            </button>
            <Link href='/' className='flex-shrink-0 flex items-center space-x-2'>
              <Logo
                loading='eager'
                src='/img/diaspo/Logo_Diaspo_Horizontal_enrichi.webp'
                width={640}
                height={320}
                alt='DiaspoMoney, accueil'
                className='h-12 w-auto'
              />
            </Link>
          </div>

          {/* Actions côté droit */}
          <div className='flex items-center space-x-4'>
            {/* Bouton Transférer un service */}
            <Link
              href='/#services'
              className='hidden md:inline-flex min-h-11 items-center px-5 text-sm font-semibold text-white rounded-full bg-brand-600 hover:bg-brand-700 transition-colors'
            >
              Transférer un service
            </Link>

            {/* Icône de notifications */}
            <div className='relative' ref={notificationMenu.containerRef}>
              <button
                {...notificationMenu.triggerProps}
                className='relative inline-flex size-11 items-center justify-center text-white hover:text-brand-400 hover:bg-gray-800 rounded-md transition-colors'
                aria-label={
                  unreadCount > 0
                    ? `Notifications, ${unreadCount} non ${unreadCount === 1 ? 'lue' : 'lues'}`
                    : 'Notifications'
                }
              >
                <Bell aria-hidden='true' className='h-5 w-5' />
                {unreadCount > 0 && (
                  <span aria-hidden='true' className='absolute top-0.5 right-0.5 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-brand-600 rounded-full'>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown des notifications */}
              {isNotificationMenuOpen && (
                <>
                  <div {...notificationMenu.panelProps} className='fixed sm:absolute right-4 sm:right-0 top-20 sm:top-auto sm:mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-gray-900 rounded-md shadow-lg border border-gray-800 py-2 z-50 max-h-[calc(100dvh-7rem)] sm:max-h-96 overflow-y-auto'>
                    <div className='px-3 sm:px-4 py-2 border-b border-gray-800 flex justify-between items-center gap-2'>
                      <h2 className='text-sm font-semibold text-white flex-shrink-0'>
                        Notifications
                      </h2>
                      {unreadCount > 0 && (
                        <span className='text-xs text-gray-300 whitespace-nowrap flex-shrink-0'>
                          {unreadCount} non {unreadCount === 1 ? 'lue' : 'lues'}
                        </span>
                      )}
                    </div>

                  {loadingNotifications ? (
                    <div className='px-3 sm:px-4 py-8 text-center'>
                      <div role='status' className='animate-spin rounded-full h-6 w-6 border-b-2 border-brand-400 mx-auto'>
                        <span className='visually-hidden'>Chargement des notifications</span>
                      </div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className='px-3 sm:px-4 py-8 text-center text-sm text-gray-400'>
                      Aucune notification
                    </div>
                  ) : (
                    <ul className='divide-y divide-gray-800' role='list'>
                      {notifications.slice(0, 5).map(notification => (
                        <li key={notification.id}>
                        <button
                          type='button'
                          className={`block w-full text-start px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-800 transition-colors ${
                            !notification.read ? 'bg-gray-800' : ''
                          }`}
                          onClick={() => {
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                            router.push('/dashboard/notifications');
                            setIsNotificationMenuOpen(false);
                          }}
                        >
                          <span className='flex items-start justify-between gap-2'>
                            <span className='flex-1 min-w-0'>
                              <span className='flex items-start gap-2 mb-1'>
                                <span
                                  className={`text-sm font-medium break-words flex-1 min-w-0 ${
                                    !notification.read
                                      ? 'text-white'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  {notification.subject}
                                </span>
                                {!notification.read && (
                                  <span className='h-2 w-2 bg-brand-400 rounded-full flex-shrink-0 mt-1.5'>
                                    <span className='visually-hidden'>Non lue</span>
                                  </span>
                                )}
                              </span>
                              <span className='block text-xs text-gray-300 line-clamp-2 mb-2 break-words overflow-hidden'>
                                {notification.content}
                              </span>
                              <span className='flex items-center flex-wrap gap-2 sm:gap-3 text-xs text-gray-400'>
                                <span className='whitespace-nowrap flex-shrink-0'>
                                  {formatDate(notification.createdAt)}
                                </span>
                                <span className='flex items-center gap-1 flex-shrink-0'>
                                  {notification.channels
                                    .slice(0, 2)
                                    .map((channel, idx) => (
                                      <span
                                        key={idx}
                                        className='text-gray-400 flex-shrink-0'
                                        aria-hidden='true'
                                      >
                                        {getChannelIcon(channel.type)}
                                      </span>
                                    ))}
                                </span>
                              </span>
                            </span>
                          </span>
                        </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {notifications.length > 0 && (
                    <div className='px-3 sm:px-4 py-2 border-t border-gray-800'>
                      <Link
                        href='/dashboard/notifications'
                        onClick={() => setIsNotificationMenuOpen(false)}
                        className='block text-center text-sm text-brand-400 hover:text-brand-300 hover:underline transition-colors font-medium'
                      >
                        Voir toutes les notifications
                      </Link>
                    </div>
                  )}
                </div>
                </>
              )}
            </div>

            {/* Profil utilisateur */}
            <div className='relative' ref={userMenu.containerRef}>
              <button
                {...userMenu.triggerProps}
                aria-label={`Mon compte : ${user.name || user.email || 'utilisateur'}`}
                className='flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors border-l border-gray-700 pl-4'
              >
                {/* Avatar */}
                <span className='w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden'>
                  {avatarUrl && !avatarError ? (
                    <Image
                      src={avatarUrl}
                      alt=''
                      width={40}
                      height={40}
                      className='rounded-full object-cover'
                      loader={imageLoader}
                      unoptimized
                      onError={() => {
                        // En cas d'erreur (404, etc.), afficher les initiales
                        setAvatarError(true);
                      }}
                    />
                  ) : (
                    <span aria-hidden='true' className='text-sm font-semibold text-white'>
                      {getInitials()}
                    </span>
                  )}
                </span>

                {/* Informations utilisateur */}
                <span className='hidden md:block text-left'>
                  <span className='block text-sm font-semibold text-white'>
                    {getPrimaryRole()}
                  </span>
                  {getSecondaryRole() && (
                    <span className='block text-xs text-gray-300'>
                      {getSecondaryRole()}
                    </span>
                  )}
                </span>

                <ChevronDown
                  aria-hidden='true'
                  className={`h-4 w-4 text-white transition-transform ${
                    userMenu.open ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown menu utilisateur */}
              {userMenu.open && (
                <div {...userMenu.panelProps} className='absolute right-0 mt-2 w-56 bg-gray-900 rounded-md shadow-lg border border-gray-800 py-1 z-50'>
                  <div className='px-4 py-3 border-b border-gray-800'>
                    <p className='text-sm font-medium text-white'>
                      {user?.name || 'Utilisateur'}
                    </p>
                    <p className='text-xs text-gray-300 truncate'>
                      {user?.email || ''}
                    </p>
                  </div>
                  <Link
                    href='/dashboard/settings'
                    className='block px-4 py-2.5 text-sm text-white hover:bg-gray-800 hover:text-brand-400'
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Paramètres
                  </Link>
                  <Link
                    href='/dashboard'
                    className='block px-4 py-2.5 text-sm text-white hover:bg-gray-800 hover:text-brand-400'
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Tableau de bord
                  </Link>
                  <div className='border-t border-gray-800 my-1' />
                  <button
                    type='button'
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut();
                    }}
                    disabled={isSigningOut}
                    className='block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 hover:text-brand-400 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isSigningOut ? 'Déconnexion…' : 'Se déconnecter'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
