'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import imageLoader from '@/lib/image-loader';
import {
  Dashboard,
  FooterActionsProps,
  NavigationItem,
  NavigationLinkProps,
  NavigationMenuProps,
  NavigationSection,
  NavigationSubItem,
  UserSectionProps,
} from '@/types/layout';
import {
  BarChart3,
  Bell,
  Book,
  Building,
  ChevronDown,
  ChevronRight,
  Clock,
  Cog,
  CreditCard,
  FileText,
  Headphones,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  Package,
  Paperclip,
  Settings,
  ShoppingCart,
  Ticket,
  User,
  Users,
  Video,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Détermine les dashboards disponibles selon les rôles de l'utilisateur
 * Dans l'ordre de priorité : Super Admin > Admin > CSM > Provider > Customer
 */
function getAvailableDashboards(userRoles: string[] = []): Dashboard[] {
  const dashboards: Dashboard[] = [];

  if (userRoles.length === 0) {
    return [{ name: 'Dashboard', href: '/dashboard', role: 'default' }];
  }

  // Ajouter les dashboards selon l'ordre de priorité
  // Super Admin : ADMIN avec plusieurs autres rôles
  if (userRoles.includes('ADMIN') && userRoles.length > 1) {
    dashboards.push({
      name: 'Super Admin',
      href: '/dashboard/admin',
      role: 'ADMIN',
    });
  }

  // Admin (si pas déjà ajouté comme Super Admin)
  if (userRoles.includes('ADMIN') && userRoles.length === 1) {
    dashboards.push({
      name: 'Admin',
      href: '/dashboard/admin',
      role: 'ADMIN',
    });
  }

  // CSM
  if (userRoles.includes('CSM')) {
    dashboards.push({
      name: 'CSM',
      href: '/dashboard/csm',
      role: 'CSM',
    });
  }

  // Provider
  if (userRoles.includes('PROVIDER')) {
    dashboards.push({
      name: 'Prestataire',
      href: '/dashboard/provider',
      role: 'PROVIDER',
    });
  }

  // Customer
  if (userRoles.includes('CUSTOMER')) {
    dashboards.push({
      name: 'Client',
      href: '/dashboard/customer',
      role: 'CUSTOMER',
    });
  }

  // Beneficiary
  if (userRoles.includes('BENEFICIARY')) {
    dashboards.push({
      name: 'Dashboard Bénéficiaire',
      href: '/dashboard/beneficiary',
      role: 'BENEFICIARY',
    });
  }

  // Si aucun dashboard spécifique, utiliser le dashboard par défaut
  if (dashboards.length === 0) {
    dashboards.push({
      name: 'Dashboard',
      href: '/dashboard',
      role: 'default',
    });
  }

  return dashboards;
}

/**
 * Construit les sections de navigation organisées
 */
function buildNavigationSections(
  dashboards: Dashboard[],
  isAdmin: () => boolean,
  isProvider: () => boolean,
  isCSM: () => boolean,
  isCustomer: () => boolean,
  unreadNotificationsCount?: number,
  pendingBookingsCount?: number
): NavigationSection[] {
  const sections: NavigationSection[] = [];

  // Section PRINCIPAL
  const principalItems: NavigationItem[] = [];

  // Tableau de bord
  if (dashboards.length > 1) {
    principalItems.push({
      name: 'Tableau de bord',
      key: 'dashboards',
      icon: LayoutDashboard,
      show: true,
      values: dashboards.map(d => ({
        name: d.name,
        key: `dashboard-${d.role.toLowerCase()}`,
        href: d.href,
        icon: LayoutDashboard,
        show: true,
      })),
    });
  } else {
    const mainDashboard = dashboards[0] || {
      name: 'Dashboard',
      href: '/dashboard',
      role: 'default',
    };
    principalItems.push({
      name: 'Tableau de bord',
      key: 'dashboard',
      href: mainDashboard.href,
      icon: LayoutDashboard,
      show: true,
    });
  }

  // Statistiques - Disponible pour tous les utilisateurs
  principalItems.push({
    name: 'Statistiques',
    key: 'statistics',
    href: '/dashboard/statistics',
    icon: BarChart3,
    show: true,
  });

  // Messagerie Interne (menu déroulant)
  const messagingItem: NavigationItem = {
    name: 'Messagerie Interne',
    key: 'messaging',
    icon: MessageSquare,
    show: true,
    values: [
      {
        name: 'Chat avec support',
        key: 'support-chat',
        href: '/dashboard/messaging/support',
        icon: Headphones,
        show: true,
      },
      {
        name: 'Messages utilisateurs',
        key: 'user-messages',
        href: '/dashboard/messaging/users',
        icon: Users,
        show: true,
      },
      {
        name: 'Notifications',
        key: 'notifications',
        href: '/dashboard/notifications',
        icon: Bell,
        show: true,
        ...(unreadNotificationsCount !== undefined &&
        unreadNotificationsCount > 0
          ? { badge: unreadNotificationsCount }
          : {}),
      },
      {
        name: 'Pièces jointes',
        key: 'attachments',
        href: '/dashboard/messaging/attachments',
        icon: Paperclip,
        show: true,
      },
    ],
  };

  principalItems.push(messagingItem);

  if (principalItems.some(item => item.show)) {
    sections.push({
      title: 'PRINCIPAL',
      items: principalItems,
    });
  }

  // Section GESTION
  const gestionItems: NavigationItem[] = [];

  // Utilisateurs
  gestionItems.push({
    name: 'Utilisateurs',
    key: 'users',
    href: '/dashboard/users',
    icon: Users,
    show: isAdmin(),
  });

  // Prestataires
  gestionItems.push({
    name: 'Prestataires',
    key: 'providers',
    href: '/dashboard/providers',
    icon: User,
    show: isAdmin() || isCSM(),
  });

  // Agences (si applicable)
  gestionItems.push({
    name: 'Agences',
    key: 'agencies',
    href: '/dashboard/agencies',
    icon: Building,
    show: isAdmin(),
  });

  // Commandes / Bookings - Menu déroulant pour les clients
  if (isCustomer()) {
    gestionItems.push({
      name: 'Commandes',
      key: 'orders',
      icon: ShoppingCart,
      show: true,
      values: [
        {
          name: 'Commandes Actives',
          key: 'active-orders',
          href: '/dashboard/orders/active',
          icon: Package,
          show: true,
        },
        {
          name: 'Historique',
          key: 'order-history',
          href: '/dashboard/orders/history',
          icon: History,
          show: true,
        },
      ],
    });
  } else {
    // Pour admin/CSM/Provider, garder l'ancien lien
    gestionItems.push({
      name: 'Commandes',
      key: 'bookings',
      href: '/dashboard/bookings',
      icon: ShoppingCart,
      show: isAdmin() || isCSM() || isProvider(),
      badge:
        pendingBookingsCount !== undefined && pendingBookingsCount > 0
          ? pendingBookingsCount
          : 0,
    });
  }

  // CSM
  gestionItems.push({
    name: 'CSM',
    key: 'csm',
    href: '/dashboard/csm',
    icon: Headphones,
    show: isAdmin() || isCSM(),
  });

  if (gestionItems.some(item => item.show)) {
    sections.push({
      title: 'GESTION',
      items: gestionItems,
    });
  }

  // Section SERVICES
  const servicesItems: NavigationItem[] = [];

  // Services
  servicesItems.push({
    name: 'Services',
    key: 'services',
    href: '/dashboard/services',
    icon: Package,
    show: true,
  });

  // Mes bénéficiaires
  servicesItems.push({
    name: 'Mes bénéficiaires',
    key: 'beneficiaries',
    href: '/dashboard/beneficiaries',
    icon: Users,
    show: isCustomer(),
  });

  // Mes disponibilités
  servicesItems.push({
    name: 'Mes disponibilités',
    key: 'availabilities',
    href: '/dashboard/availabilities',
    icon: Clock,
    show: isProvider(),
  });

  if (servicesItems.some(item => item.show)) {
    sections.push({
      title: 'SERVICES',
      items: servicesItems,
    });
  }

  // Section FACTURATION
  const facturationItems: NavigationItem[] = [];

  facturationItems.push({
    name: 'Paiements & Facturation',
    key: 'billing',
    icon: CreditCard,
    show: true,
    values: [
      {
        name: 'Moyens de paiement',
        key: 'payment-methods',
        href: '/dashboard/payments',
        icon: CreditCard,
        show: true,
      },
      {
        name: 'Historique des transactions',
        key: 'transactions',
        href: '/dashboard/payments/transactions',
        icon: History,
        show: true,
      },
      {
        name: 'Factures',
        key: 'invoices',
        href: '/dashboard/invoices',
        icon: FileText,
        show: true,
      },
      {
        name: 'Mes Devis',
        key: 'quotes',
        href: '/dashboard/quotes',
        icon: FileText,
        show: isCustomer() || isProvider(),
      },
      {
        name: 'Bon de paiement',
        key: 'payment-receipts',
        href: '/dashboard/payment-receipts',
        icon: FileText,
        show: isCustomer(),
      },
    ],
  });

  if (facturationItems.some(item => item.show)) {
    sections.push({
      title: 'FACTURATION',
      items: facturationItems,
    });
  }

  return sections;
}

// ============================================================================
// COMPOSANTS
// ============================================================================

function NavigationLink({ item, pathname }: NavigationLinkProps) {
  if (!item.href) return null;

  const isActive =
    pathname === item.href ||
    (item.key === 'dashboard' && pathname.startsWith('/dashboard'));

  return (
    <Link
      href={item.href}
      className={`relative flex items-center px-4 py-3 transition-colors group ${
        isActive
          ? 'bg-slate-700 text-white'
          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
      }`}
    >
      {/* Barre verticale orange pour l'élément actif */}
      {isActive && (
        <div className='absolute left-0 top-0 bottom-0 w-1 bg-[hsl(25,100%,53%)]' />
      )}

      {item.icon && (
        <item.icon
          className={`h-5 w-5 mr-3 ${
            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
          }`}
        />
      )}
      <span className='flex-1 text-sm font-medium'>{item.name}</span>

      {/* Badge de notification */}
      {item.badge !== undefined && item.badge > 0 && (
        <span className='flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-[hsl(25,100%,53%)] rounded-full'>
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      )}
    </Link>
  );
}

function NavigationMenu({
  item,
  pathname,
  isExpanded,
  onToggle,
}: NavigationMenuProps) {
  if (!item.values || item.values.length === 0) return null;

  const visibleSubItems = item.values.filter(
    (subItem: NavigationSubItem) => subItem.show
  );
  if (visibleSubItems.length === 0) return null;

  const hasActiveSubItem = visibleSubItems.some(
    (subItem: NavigationSubItem) => pathname === subItem.href
  );

  return (
    <div className='flex flex-col'>
      <button
        onClick={onToggle}
        className={`relative flex items-center justify-between w-full text-left px-4 py-3 transition-colors group ${
          hasActiveSubItem
            ? 'bg-slate-700 text-white'
            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
        }`}
      >
        {/* Barre verticale orange si un sous-item est actif */}
        {hasActiveSubItem && (
          <div className='absolute left-0 top-0 bottom-0 w-1 bg-[hsl(25,100%,53%)]' />
        )}

        <div className='flex items-center flex-1'>
          {item.icon && (
            <item.icon
              className={`h-5 w-5 mr-3 ${
                hasActiveSubItem
                  ? 'text-white'
                  : 'text-slate-400 group-hover:text-white'
              }`}
            />
          )}
          <span className='text-sm font-medium'>{item.name}</span>
        </div>

        {isExpanded ? (
          <ChevronDown className='h-4 w-4 text-slate-400' />
        ) : (
          <ChevronRight className='h-4 w-4 text-slate-400' />
        )}
      </button>

      {isExpanded && (
        <div className='flex flex-col bg-slate-800/50'>
          {visibleSubItems.map((subItem: NavigationSubItem) => {
            const isActive = pathname === subItem.href;
            return (
              <Link
                key={subItem.key}
                href={subItem.href}
                className={`relative flex items-center px-4 py-2.5 pl-12 transition-colors text-sm ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                {/* Barre verticale orange pour le sous-item actif */}
                {isActive && (
                  <div className='absolute left-0 top-0 bottom-0 w-1 bg-[hsl(25,100%,53%)]' />
                )}

                {subItem.icon && (
                  <subItem.icon
                    className={`h-4 w-4 mr-2 ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                )}
                <span className='flex-1'>{subItem.name}</span>

                {/* Badge de notification */}
                {subItem.badge !== undefined && subItem.badge > 0 && (
                  <span className='flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-[hsl(25,100%,53%)] rounded-full'>
                    {subItem.badge > 9 ? '9+' : subItem.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UserSection({ user }: UserSectionProps) {
  const getInitials = () => {
    if (user?.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0]?.charAt(0)}${names[names.length - 1]?.charAt(
          0
        )}`.toUpperCase();
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

  return (
    <div className='p-4 sm:p-6 border-b border-slate-700 bg-slate-800'>
      <div className='flex items-start space-x-3'>
        <div className='flex-shrink-0 w-10 h-10 bg-[hsl(25,100%,53%)] rounded-full flex items-center justify-center overflow-hidden'>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={user?.name || 'Utilisateur'}
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
        <div className='flex-1 min-w-0 overflow-hidden'>
          <p className='text-sm font-medium text-white truncate'>
            {user?.name || 'Utilisateur'}
          </p>
          <p className='text-xs text-slate-400 truncate'>{user?.email || ''}</p>
          <div className='flex flex-wrap items-center gap-1 mt-1.5'>
            {user?.roles?.map((role: string) => (
              <span
                key={role}
                className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-200 whitespace-nowrap'
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FooterActions({
  onSignOut,
  isSigningOut,
  pathname,
  isSettingsExpanded,
  onToggleSettings,
}: FooterActionsProps) {
  const settingsItems = [
    {
      name: 'Configuration',
      key: 'configuration',
      href: '/dashboard/settings/configuration',
      icon: Cog,
      show: true,
    },
    {
      name: 'Tickets Support',
      key: 'tickets',
      href: '/dashboard/settings/tickets',
      icon: Ticket,
      show: true,
    },
    {
      name: 'FAQ par rôle',
      key: 'faq',
      href: '/dashboard/settings/faq',
      icon: HelpCircle,
      show: true,
    },
    {
      name: 'Tutoriels vidéo',
      key: 'tutorials',
      href: '/dashboard/settings/tutorials',
      icon: Video,
      show: true,
    },
    {
      name: 'Contact support',
      key: 'support',
      href: '/dashboard/settings/support',
      icon: Mail,
      show: true,
    },
    {
      name: 'Documentation',
      key: 'documentation',
      href: '/dashboard/settings/documentation',
      icon: Book,
      show: true,
    },
  ];

  const visibleSettingsItems = settingsItems.filter(item => item.show);
  const hasActiveSettingsItem = visibleSettingsItems.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  return (
    <div className='mt-auto border-t border-slate-700'>
      {/* Section Paramètres */}
      <div>
        <button
          onClick={onToggleSettings}
          className={`w-full flex items-center justify-between px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors ${
            hasActiveSettingsItem ? 'bg-slate-700/30' : ''
          }`}
        >
          <div className='flex items-center'>
            <Settings className='h-5 w-5 mr-3 text-slate-400' />
            <span className='text-sm font-medium'>Paramètres</span>
          </div>
          <ChevronRight
            className={`h-4 w-4 text-slate-400 transition-transform ${
              isSettingsExpanded ? 'rotate-90' : ''
            }`}
          />
        </button>

        {isSettingsExpanded && (
          <div className='flex flex-col bg-slate-800/50'>
            {visibleSettingsItems.map(item => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`relative flex items-center px-4 py-2.5 pl-12 transition-colors text-sm ${
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  {/* Barre verticale orange pour l'élément actif */}
                  {isActive && (
                    <div className='absolute left-0 top-0 bottom-0 w-1 bg-[hsl(25,100%,53%)]' />
                  )}

                  {item.icon && (
                    <item.icon
                      className={`h-4 w-4 mr-2 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                  )}
                  <span className='flex-1'>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Déconnexion */}
      <div className='border-t border-slate-700'>
        <button
          onClick={onSignOut}
          disabled={isSigningOut}
          className='flex items-center px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <LogOut className='h-5 w-5 mr-3 text-slate-400' />
          <span className='text-sm font-medium'>
            {isSigningOut ? 'Déconnexion...' : 'Déconnexion'}
          </span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function Sidebar() {
  const pathname = usePathname();
  const {
    user,
    isAdmin,
    isProvider,
    isCSM,
    isAuthenticated,
    isCustomer,
    signOut,
    isSigningOut,
  } = useAuth();

  const [isBillingExpanded, setIsBillingExpanded] = useState(false);
  const [isDashboardsExpanded, setIsDashboardsExpanded] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isMessagingExpanded, setIsMessagingExpanded] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<
    number | undefined
  >(undefined);
  const [pendingBookingsCount, setPendingBookingsCount] = useState<
    number | undefined
  >(undefined);

  // Gestion de l'expansion automatique selon le pathname
  useEffect(() => {
    const billingPaths = [
      '/dashboard/invoices',
      '/dashboard/quotes',
      '/dashboard/payment-receipts',
    ];
    if (billingPaths.includes(pathname)) {
      setIsBillingExpanded(true);
    }
  }, [pathname]);

  useEffect(() => {
    const dashboardPaths = [
      '/dashboard/admin',
      '/dashboard/csm',
      '/dashboard/provider',
      '/dashboard/customer',
      '/dashboard/beneficiary',
    ];
    if (dashboardPaths.includes(pathname)) {
      setIsDashboardsExpanded(true);
    }
  }, [pathname]);

  useEffect(() => {
    const settingsPaths = [
      '/dashboard/settings',
      '/dashboard/settings/configuration',
      '/dashboard/settings/tickets',
      '/dashboard/settings/faq',
      '/dashboard/settings/tutorials',
      '/dashboard/settings/support',
      '/dashboard/settings/documentation',
    ];
    if (settingsPaths.some(path => pathname.startsWith(path))) {
      setIsSettingsExpanded(true);
    }
  }, [pathname]);

  useEffect(() => {
    const messagingPaths = [
      '/dashboard/messaging',
      '/dashboard/messaging/support',
      '/dashboard/messaging/users',
      '/dashboard/notifications',
      '/dashboard/messaging/attachments',
    ];
    if (messagingPaths.some(path => pathname.startsWith(path))) {
      setIsMessagingExpanded(true);
    }
  }, [pathname]);

  // Récupérer le nombre de notifications non lues depuis l'API
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotificationsCount(undefined);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(
          '/api/notifications?page=1&limit=1&status=unread'
        );
        const data = await response.json();

        if (data.success) {
          setUnreadNotificationsCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching unread notifications count:', error);
        // En cas d'erreur, ne pas afficher de badge
        setUnreadNotificationsCount(undefined);
      }
    };

    fetchUnreadCount();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Récupérer le nombre de commandes en attente depuis l'API
  useEffect(() => {
    if (!isAuthenticated || (!isAdmin() && !isCSM() && !isProvider())) {
      setPendingBookingsCount(undefined);
      return;
    }

    const fetchPendingCount = async () => {
      try {
        const role = isAdmin()
          ? 'admin'
          : isCSM()
          ? 'csm'
          : isProvider()
          ? 'provider'
          : 'all';
        const response = await fetch(
          `/api/bookings/pending-count?role=${role}`
        );
        const data = await response.json();

        if (data.success) {
          setPendingBookingsCount(data.pendingCount || 0);
        }
      } catch (error) {
        console.error('Error fetching pending bookings count:', error);
        // En cas d'erreur, ne pas afficher de badge
        setPendingBookingsCount(undefined);
      }
    };

    fetchPendingCount();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isAdmin, isCSM, isProvider]);

  // Ne pas afficher la sidebar si l'utilisateur n'est pas connecté
  if (!isAuthenticated) {
    return null;
  }

  // Construction de la navigation par sections
  const dashboards = getAvailableDashboards(user?.roles || []);
  const sections = buildNavigationSections(
    dashboards,
    isAdmin,
    isProvider,
    isCSM,
    isCustomer,
    unreadNotificationsCount,
    pendingBookingsCount
  );

  return (
    <aside className='w-64 bg-slate-900 min-h-screen flex flex-col border-r border-slate-800'>
      <UserSection user={user} />

      <nav className='flex flex-col flex-1 overflow-y-auto'>
        {sections.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
            {/* En-tête de section */}
            <div className='px-4 py-2'>
              <h3 className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>
                {section.title}
              </h3>
            </div>

            {/* Items de la section */}
            <div className='space-y-1'>
              {section.items
                .filter(item => item.show)
                .map(item => {
                  // Lien simple
                  if (item.href) {
                    return (
                      <NavigationLink
                        key={item.key}
                        item={item}
                        pathname={pathname}
                      />
                    );
                  }

                  // Menu avec sous-éléments
                  if (item.values && Array.isArray(item.values)) {
                    const isDashboards = item.key === 'dashboards';
                    const isSettings = item.key === 'settings';
                    const isMessaging = item.key === 'messaging';
                    const isExpanded = isDashboards
                      ? isDashboardsExpanded
                      : isSettings
                      ? isSettingsExpanded
                      : isMessaging
                      ? isMessagingExpanded
                      : isBillingExpanded;
                    const onToggle = () => {
                      if (isDashboards) {
                        setIsDashboardsExpanded(!isDashboardsExpanded);
                      } else if (isSettings) {
                        setIsSettingsExpanded(!isSettingsExpanded);
                      } else if (isMessaging) {
                        setIsMessagingExpanded(!isMessagingExpanded);
                      } else {
                        setIsBillingExpanded(!isBillingExpanded);
                      }
                    };

                    return (
                      <NavigationMenu
                        key={item.key}
                        item={item}
                        pathname={pathname}
                        isExpanded={isExpanded}
                        onToggle={onToggle}
                      />
                    );
                  }

                  return null;
                })}
            </div>
          </div>
        ))}
      </nav>

      <FooterActions
        onSignOut={signOut}
        isSigningOut={isSigningOut}
        pathname={pathname}
        isSettingsExpanded={isSettingsExpanded}
        onToggleSettings={() => setIsSettingsExpanded(!isSettingsExpanded)}
      />
    </aside>
  );
}
