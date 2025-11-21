'use client';

import Logo from '@/components/ui/Logo';
import { useAuth } from '@/hooks/auth/useAuth';
import { useSignOut } from '@/hooks/auth/useSignOut';
import imageLoader from '@/lib/image-loader';
import { ROLES } from '@/lib/constants';
import type { UINotification } from '@/lib/types';
import { Bell, ChevronDown, Mail, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function DashboardHeader() {
  const { user, isAuthenticated } = useAuth();
  const { signOut, isSigningOut } = useSignOut();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

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
      console.error('Error fetching unread count:', error);
    }
  }, [isAuthenticated]);

  // Charger les notifications au montage et périodiquement
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchUnreadCount();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
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
          console.error('Error fetching notifications:', error);
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
      console.error('Error marking notification as read:', error);
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

  if (!user) {
    return null;
  }

  return (
    <header className='bg-black shadow-sm border-b border-gray-800'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link href='/' className='flex-shrink-0'>
              <Logo
                src='/img/diaspo/Logo_Diaspo_Horizontal_enrichi.webp'
                width={200}
                height={100}
                alt='Diaspomoney'
              />
            </Link>
          </div>

          {/* Actions côté droit */}
          <div className='flex items-center space-x-4'>
            {/* Bouton Transférer un service */}
            <Link
              href='/services'
              className='hidden md:inline-flex items-center px-4 py-2 border border-[hsl(25,100%,53%)] text-sm font-medium rounded-md text-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)] hover:text-white transition-colors'
            >
              <svg
                className='w-4 h-4 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
                />
              </svg>
              Transférer un service
            </Link>

            {/* Icône de notifications */}
            <div className='relative'>
              <button
                onClick={() => {
                  setIsNotificationMenuOpen(!isNotificationMenuOpen);
                  setIsUserMenuOpen(false);
                }}
                className='relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors'
                aria-label='Notifications'
              >
                <Bell className='h-5 w-5' />
                {unreadCount > 0 && (
                  <span className='absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-[hsl(25,100%,53%)] rounded-full'>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown des notifications */}
              {isNotificationMenuOpen && (
                <div className='absolute right-0 mt-2 w-80 bg-gray-800 rounded-md shadow-lg border border-gray-700 py-2 z-50 max-h-96 overflow-y-auto'>
                  <div className='px-4 py-2 border-b border-gray-700 flex justify-between items-center'>
                    <h3 className='text-sm font-semibold text-white'>
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className='text-xs text-gray-400'>
                        {unreadCount} non {unreadCount === 1 ? 'lue' : 'lues'}
                      </span>
                    )}
                  </div>

                  {loadingNotifications ? (
                    <div className='px-4 py-8 text-center'>
                      <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-[hsl(25,100%,53%)] mx-auto'></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className='px-4 py-8 text-center text-sm text-gray-400'>
                      Aucune notification
                    </div>
                  ) : (
                    <div className='divide-y divide-gray-700'>
                      {notifications.slice(0, 5).map(notification => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-700 transition-colors cursor-pointer ${
                            !notification.read ? 'bg-gray-700/50' : ''
                          }`}
                          onClick={() => {
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                            router.push('/dashboard/notifications');
                            setIsNotificationMenuOpen(false);
                          }}
                        >
                          <div className='flex items-start justify-between'>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center space-x-2 mb-1'>
                                <h4
                                  className={`text-sm font-medium truncate ${
                                    !notification.read
                                      ? 'text-white'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  {notification.subject}
                                </h4>
                                {!notification.read && (
                                  <span className='h-1.5 w-1.5 bg-[hsl(25,100%,53%)] rounded-full flex-shrink-0'></span>
                                )}
                              </div>
                              <p className='text-xs text-gray-400 line-clamp-2 mb-2'>
                                {notification.content}
                              </p>
                              <div className='flex items-center space-x-3 text-xs text-gray-500'>
                                <span>
                                  {formatDate(notification.createdAt)}
                                </span>
                                <div className='flex items-center space-x-1'>
                                  {notification.channels
                                    .slice(0, 2)
                                    .map((channel, idx) => (
                                      <div
                                        key={idx}
                                        className='text-gray-500'
                                        title={channel.type}
                                      >
                                        {getChannelIcon(channel.type)}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {notifications.length > 0 && (
                    <div className='px-4 py-2 border-t border-gray-700'>
                      <Link
                        href='/dashboard/notifications'
                        onClick={() => setIsNotificationMenuOpen(false)}
                        className='block text-center text-sm text-[hsl(25,100%,53%)] hover:text-[hsl(25,100%,58%)] transition-colors'
                      >
                        Voir toutes les notifications
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profil utilisateur */}
            <div className='relative'>
              <button
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsNotificationMenuOpen(false);
                }}
                className='flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors border-l border-gray-700 pl-4'
              >
                {/* Avatar */}
                <div className='w-10 h-10 bg-[hsl(25,100%,53%)] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden'>
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={user.name || 'User'}
                      width={40}
                      height={40}
                      className='rounded-full object-cover'
                      loader={imageLoader}
                      unoptimized
                    />
                  ) : (
                    <span className='text-sm font-semibold text-white'>
                      {getInitials()}
                    </span>
                  )}
                </div>

                {/* Informations utilisateur */}
                <div className='hidden md:block text-left'>
                  <p className='text-sm font-semibold text-white'>
                    {getPrimaryRole()}
                  </p>
                  {getSecondaryRole() && (
                    <p className='text-xs text-gray-400'>
                      {getSecondaryRole()}
                    </p>
                  )}
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown menu utilisateur */}
              {isUserMenuOpen && (
                <div className='absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-lg border border-gray-700 py-1 z-50'>
                  <div className='px-4 py-3 border-b border-gray-700'>
                    <p className='text-sm font-medium text-white'>
                      {user?.name || 'Utilisateur'}
                    </p>
                    <p className='text-xs text-gray-400 truncate'>
                      {user?.email || ''}
                    </p>
                  </div>
                  <Link
                    href='/dashboard/settings'
                    className='block px-4 py-2 text-sm text-white hover:bg-gray-700 hover:text-[hsl(25,100%,53%)]'
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Paramètres
                  </Link>
                  <Link
                    href='/dashboard'
                    className='block px-4 py-2 text-sm text-white hover:bg-gray-700 hover:text-[hsl(25,100%,53%)]'
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <div className='border-t border-gray-700 my-1' />
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut();
                    }}
                    disabled={isSigningOut}
                    className='block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 hover:text-[hsl(25,100%,53%)] disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isSigningOut ? 'Déconnexion...' : 'Déconnexion'}
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
