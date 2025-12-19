'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { useAuthorization } from '@/hooks/auth/useAuthorization';
import imageLoader from '@/lib/image-loader';
import { ROLES } from '@/lib/constants';
import {
  Dashboard,
  FooterActionsProps,
  NavigationItem,
  NavigationLinkProps,
  NavigationMenuProps,
  NavigationSection,
  NavigationSubItem,
  UserSectionProps,
} from '@/lib/types';
import {
  Bell,
  Book,
  Building,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Cog,
  CreditCard,
  FileText,
  GraduationCap,
  Headphones,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  Package,
  Paperclip,
  Settings,
  ShoppingCart,
  Stethoscope,
  Ticket,
  User,
  Users,
  Video,
  Wrench,
  Settings2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSidebar } from '../../contexts/SidebarContext';
import { X } from 'lucide-react';
import { childLogger } from '@/lib/logger';

const logger = childLogger({ component: 'Sidebar' });

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
  const hasAdmin = userRoles.includes(ROLES.ADMIN);
  if (hasAdmin) {
    dashboards.push({
      name: userRoles.length > 1 ? 'Super Admin' : 'Admin',
      href: '/dashboard/admin',
      role: ROLES.ADMIN,
    });
  }

  const roleDashboards: Array<{ role: string; name: string; href: string }> = [
    { role: ROLES.CSM, name: 'CSM', href: '/dashboard/csm' },
    { role: ROLES.PROVIDER, name: 'Prestataire', href: '/dashboard/provider' },
    { role: ROLES.CUSTOMER, name: 'Client', href: '/dashboard/customer' },
    {
      role: ROLES.BENEFICIARY,
      name: 'Dashboard Bénéficiaire',
      href: '/dashboard/beneficiary',
    },
  ];

  for (const cfg of roleDashboards) {
    if (userRoles.includes(cfg.role)) {
      dashboards.push({ name: cfg.name, href: cfg.href, role: cfg.role });
    }
  }

  return dashboards.length > 0
    ? dashboards
    : [{ name: 'Dashboard', href: '/dashboard', role: 'default' }];
}

/**
 * Construit les sections de navigation organisées
 */
function buildProviderToolsItems(user?: any): NavigationItem[] {
  const items: NavigationItem[] = [];

  const providerType = user?.providerInfo?.type; // 'INDIVIDUAL' | 'INSTITUTION'
  const providerCategory = user?.providerInfo?.category; // 'HEALTH' | 'BTP' | 'EDUCATION'

  // Sous-catégories dynamiques selon le type et la catégorie
  switch (providerType) {
    case 'INDIVIDUAL': {
      // Providers INDIVIDUAL
      switch (providerCategory) {
        case 'HEALTH':
          // Santé - INDIVIDUAL
          items.push({
            name: '📅 Calendrier',
            key: 'calendar-health',
            icon: Calendar,
            show: true,
            values: [
              {
                name: 'Mes disponibilités',
                key: 'availabilities',
                href: '/dashboard/availabilities',
                icon: Clock,
                show: true,
              },
              {
                name: 'Mes patients',
                key: 'patients',
                href: '/dashboard/patients',
                icon: Users,
                show: true,
              },
              {
                name: 'Mes rendez-vous',
                key: 'appointments',
                href: '/dashboard/appointments',
                icon: Calendar,
                show: true,
              },
              {
                name: 'Planning des missions',
                key: 'mission-planning',
                href: '/dashboard/calendar/missions',
                icon: Stethoscope,
                show: true,
              },
            ],
          });
          break;
        case 'BTP':
          // BTP - INDIVIDUAL
          items.push({
            name: '📅 Calendrier',
            key: 'calendar-btp',
            icon: Calendar,
            show: false,
            values: [
              {
                name: 'Mes disponibilités',
                key: 'availabilities',
                href: '/dashboard/availabilities',
                icon: Clock,
                show: true,
              },
              {
                name: 'Mes missions',
                key: 'missions',
                href: '/dashboard/calendar/missions',
                icon: Wrench,
                show: true,
              },
              {
                name: 'Mes clients',
                key: 'clients',
                href: '/dashboard/clients',
                icon: Users,
                show: true,
              },
              {
                name: 'Réservations clients',
                key: 'client-bookings',
                href: '/dashboard/calendar/bookings',
                icon: ShoppingCart,
                show: true,
              },
            ],
          });
          break;
        case 'EDUCATION':
          // Éducation - INDIVIDUAL
          items.push({
            name: '📅 Calendrier',
            key: 'calendar-education',
            icon: Calendar,
            show: false,
            values: [
              {
                name: 'Mes disponibilités',
                key: 'availabilities',
                href: '/dashboard/availabilities',
                icon: Clock,
                show: true,
              },
              {
                name: 'Mes élèves',
                key: 'students',
                href: '/dashboard/students',
                icon: GraduationCap,
                show: true,
              },
              {
                name: 'Mes relevés',
                key: 'reports',
                href: '/dashboard/reports',
                icon: FileText,
                show: true,
              },
              {
                name: 'Planning des missions',
                key: 'mission-planning',
                href: '/dashboard/calendar/missions',
                icon: Book,
                show: true,
              },
            ],
          });
          break;
        default:
          // INDIVIDUAL sans catégorie spécifique - menu par défaut
          items.push({
            name: '📅 Calendrier',
            key: 'calendar-default',
            icon: Calendar,
            show: false,
            values: [
              {
                name: 'Mes disponibilités',
                key: 'availabilities',
                href: '/dashboard/availabilities',
                icon: Clock,
                show: true,
              },
              {
                name: 'Planning des missions',
                key: 'mission-planning',
                href: '/dashboard/calendar/missions',
                icon: Calendar,
                show: true,
              },
              {
                name: 'Réservations clients',
                key: 'client-bookings',
                href: '/dashboard/calendar/bookings',
                icon: ShoppingCart,
                show: true,
              },
              {
                name: 'Rappels importants',
                key: 'reminders',
                href: '/dashboard/calendar/reminders',
                icon: Bell,
                show: true,
              },
            ],
          });
          break;
      }
      break;
    }
    case 'INSTITUTION': {
      // Providers INSTITUTION
      switch (providerCategory) {
        case 'HEALTH':
          // Santé - INSTITUTION
          items.push({
            name: '🏥 Institution',
            key: 'institution-health',
            icon: Building,
            show: false,
            values: [
              {
                name: 'Mes médecins',
                key: 'doctors',
                href: '/dashboard/institution/doctors',
                icon: Stethoscope,
                show: true,
              },
              {
                name: 'Mes infirmiers',
                key: 'nurses',
                href: '/dashboard/institution/nurses',
                icon: Users,
                show: true,
              },
              {
                name: 'Mes patients',
                key: 'patients',
                href: '/dashboard/institution/patients',
                icon: Users,
                show: true,
              },
              {
                name: 'Mes rendez-vous',
                key: 'appointments',
                href: '/dashboard/institution/appointments',
                icon: Calendar,
                show: true,
              },
            ],
          });
          break;
        case 'BTP':
          // BTP - INSTITUTION
          items.push({
            name: '🏗️ Institution',
            key: 'institution-btp',
            icon: Building,
            show: false,
            values: [
              {
                name: 'Mes indépendants',
                key: 'freelancers',
                href: '/dashboard/institution/freelancers',
                icon: User,
                show: true,
              },
              {
                name: 'Mes clients',
                key: 'clients',
                href: '/dashboard/institution/clients',
                icon: Users,
                show: true,
              },
              {
                name: 'Mes missions',
                key: 'missions',
                href: '/dashboard/institution/missions',
                icon: Wrench,
                show: true,
              },
            ],
          });
          break;
        case 'EDUCATION':
          // Éducation - INSTITUTION
          items.push({
            name: '🎓 Institution',
            key: 'institution-education',
            icon: Building,
            show: false,
            values: [
              {
                name: 'Mes professeurs',
                key: 'teachers',
                href: '/dashboard/institution/teachers',
                icon: GraduationCap,
                show: true,
              },
              {
                name: 'Mes élèves',
                key: 'students',
                href: '/dashboard/institution/students',
                icon: Users,
                show: true,
              },
              {
                name: 'Mes classes',
                key: 'classes',
                href: '/dashboard/institution/classes',
                icon: Book,
                show: true,
              },
            ],
          });
          break;
        default:
          // INSTITUTION sans catégorie spécifique - menu par défaut
          items.push({
            name: '🏢 Institution',
            key: 'institution-default',
            icon: Building,
            show: false,
            values: [
              {
                name: 'Mes équipes',
                key: 'teams',
                href: '/dashboard/institution/teams',
                icon: Users,
                show: true,
              },
              {
                name: 'Mes clients',
                key: 'clients',
                href: '/dashboard/institution/clients',
                icon: Users,
                show: true,
              },
            ],
          });
          break;
      }
      break;
    }
    default:
      break;
  }

  return items;
}

function buildNavigationSections(
  dashboards: Dashboard[],
  isAuthorizedAdmin: boolean,
  isAuthorizedProvider: boolean,
  isAuthorizedCSM: boolean,
  isAuthorizedCustomer: boolean,
  unreadNotificationsCount?: number,
  pendingBookingsCount?: number,
  user?: any,
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
        show: false,
      },
      {
        name: 'Messages utilisateurs',
        key: 'user-messages',
        href: '/dashboard/messaging/users',
        icon: Users,
        show: false,
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
        show: false,
      },
    ],
  };

  principalItems.push(messagingItem);

  // ----------------------------
  // PRINCIPAL : onglets accessibles par au moins un des rôles listés (Admin/CSM/Provider/Customer)
  // ----------------------------
  const canSeeBookings =
    isAuthorizedAdmin || isAuthorizedCSM || isAuthorizedProvider || isAuthorizedCustomer;

  const bookingsLabel =
    isAuthorizedCustomer && !(isAuthorizedAdmin || isAuthorizedCSM || isAuthorizedProvider)
      ? 'Mes réservations'
      : 'Commandes';
  const bookingsIcon =
    isAuthorizedCustomer && !(isAuthorizedAdmin || isAuthorizedCSM || isAuthorizedProvider)
      ? Package
      : ShoppingCart;

  principalItems.push({
    name: bookingsLabel,
    key: 'bookings',
    href: '/dashboard/bookings',
    icon: bookingsIcon,
    show: canSeeBookings,
    ...(pendingBookingsCount !== undefined && pendingBookingsCount > 0
      ? { badge: pendingBookingsCount }
      : {}),
  });

  // Mes bénéficiaires (Customer uniquement)
  principalItems.push({
    name: 'Mes bénéficiaires',
    key: 'beneficiaries',
    href: '/dashboard/beneficiaries',
    icon: Users,
    show: isAuthorizedCustomer,
  });

  // ----------------------------
  // ADMIN GESTION : uniquement Admin/SuperAdmin
  // ----------------------------
  const adminGestionItems: NavigationItem[] = [];
  if (isAuthorizedAdmin) {
    adminGestionItems.push({
      name: 'Utilisateurs',
      key: 'users',
      href: '/dashboard/users',
      icon: Users,
      show: true,
    });

    adminGestionItems.push({
      name: 'Agences',
      key: 'agencies',
      href: '/dashboard/agencies',
      icon: Building,
      show: false,
    });

    adminGestionItems.push({
      name: 'Prestataires',
      key: 'providers',
      href: '/dashboard/providers',
      icon: User,
      show: false,
    });

    adminGestionItems.push({
      name: 'Gestion de service',
      key: 'services',
      href: '/dashboard/services',
      icon: Settings2,
      show: true,
    });
  }

  // ----------------------------
  // GESTION CSM : uniquement CSM
  // ----------------------------
  const csmGestionItems: NavigationItem[] = [];
  if (isAuthorizedCSM) {
    csmGestionItems.push({
      name: 'Prestataires',
      key: 'providers',
      href: '/dashboard/providers',
      icon: User,
      show: true,
    });
  }

  // ----------------------------
  // PROVIDERS TOOLS : uniquement Provider
  // ----------------------------
  const providerToolsItems: NavigationItem[] = isAuthorizedProvider
    ? buildProviderToolsItems(user)
    : [];

  // Sections finales
  if (principalItems.some(item => item.show)) {
    sections.push({
      title: 'PRINCIPAL',
      items: principalItems,
    });
  }

  if (adminGestionItems.some(item => item.show)) {
    sections.push({
      title: 'ADMIN GESTION',
      items: adminGestionItems,
    });
  }

  if (csmGestionItems.some(item => item.show)) {
    sections.push({
      title: 'OUTILS CSM',
      items: csmGestionItems,
    });
  }

  if (providerToolsItems.some(item => item.show)) {
    sections.push({
      title: 'OUTILS PRESTATAIRE',
      items: providerToolsItems,
    });
  }

  return sections;
}

// ============================================================================
// COMPOSANTS
// ============================================================================

function NavigationLink({ item, pathname }: NavigationLinkProps) {
  const { close } = useSidebar();
  
  if (!item.href) return null;

  const isActive =
    pathname === item.href ||
    (item.key === 'dashboard' && pathname.startsWith('/dashboard'));

  return (
    <Link
      href={item.href}
      onClick={() => {
        // Fermer la sidebar sur mobile/tablette après un clic
        if (window.innerWidth < 1024) {
          close();
        }
      }}
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
  const { close } = useSidebar();
  
  if (!item.values || item.values.length === 0) return null;

  const visibleSubItems = item.values.filter(
    (subItem: NavigationSubItem) => subItem.show,
  );
  if (visibleSubItems.length === 0) return null;

  const hasActiveSubItem = visibleSubItems.some(
    (subItem: NavigationSubItem) => pathname === subItem.href,
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
                onClick={() => {
                  // Fermer la sidebar sur mobile/tablette après un clic
                  if (window.innerWidth < 1024) {
                    close();
                  }
                }}
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
  const [avatarError, setAvatarError] = useState(false);

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

  return (
    <div className='p-4 sm:p-5 lg:p-6 border-b border-slate-700 bg-slate-800'>
      <div className='flex items-start space-x-3'>
        <div className='flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-[hsl(25,100%,53%)] rounded-full flex items-center justify-center overflow-hidden'>
          {avatarUrl && !avatarError ? (
            <Image
              src={avatarUrl}
              alt={user?.name || 'Utilisateur'}
              width={48}
              height={48}
              className='rounded-full object-cover'
              loader={imageLoader}
              unoptimized
              onError={() => {
                // En cas d'erreur (404, etc.), afficher les initiales
                setAvatarError(true);
              }}
            />
          ) : (
            <span className='text-sm sm:text-base font-semibold text-white'>
              {getInitials()}
            </span>
          )}
        </div>
        <div className='flex-1 min-w-0 overflow-hidden'>
          <p className='text-sm sm:text-base font-medium text-white truncate'>
            {user?.name || 'Utilisateur'}
          </p>
          <p className='text-xs sm:text-sm text-slate-400 truncate'>{user?.email || ''}</p>
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
  tabsEnabled = true,
  onToggleTabs,
}: FooterActionsProps) {
  const { close } = useSidebar();
  
  const settingsItems = [
    {
      name: 'Paiements & Facturation',
      key: 'billing',
      href: '/dashboard/payments',
      icon: CreditCard,
      show: true,
    },
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
      show: false,
    },
    {
      name: 'FAQ par rôle',
      key: 'faq',
      href: '/dashboard/settings/faq',
      icon: HelpCircle,
      show: false,
    },
    {
      name: 'Tutoriels vidéo',
      key: 'tutorials',
      href: '/dashboard/settings/tutorials',
      icon: Video,
      show: false,
    },
    {
      name: 'Contact support',
      key: 'support',
      href: '/dashboard/settings/support',
      icon: Mail, 
      show: false,
    },
    {
      name: 'Documentation',
      key: 'documentation',
      href: '/dashboard/settings/documentation',
      icon: Book,
      show: false,
    },
  ];

  const visibleSettingsItems = settingsItems.filter(item => item.show);
  const hasActiveSettingsItem = visibleSettingsItems.some(
    (item: NavigationItem) => pathname === item.href || pathname.startsWith(`${item.href}/`),
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
            {visibleSettingsItems.map((item: NavigationItem) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.key}
                  href={item.href || ''}
                  onClick={() => {
                    // Fermer la sidebar sur mobile/tablette après un clic
                    if (window.innerWidth < 1024) {
                      close();
                    }
                  }}
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

      {/* Toggle des onglets */}
      {onToggleTabs && (
        <div className='border-t border-slate-700'>
          <button
            onClick={onToggleTabs}
            className='flex items-center justify-between px-4 py-3 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors w-full'
            title={tabsEnabled ? 'Désactiver les onglets' : 'Activer les onglets'}
          >
            <div className='flex items-center'>
              {tabsEnabled ? (
                <ToggleRight className='h-5 w-5 mr-3 text-slate-400' />
              ) : (
                <ToggleLeft className='h-5 w-5 mr-3 text-slate-400' />
              )}
              <span className='text-sm font-medium'>
                {tabsEnabled ? 'Onglets activés' : 'Onglets désactivés'}
              </span>
            </div>
          </button>
        </div>
      )}

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
  const { isOpen, close } = useSidebar();
  const {
    user,
    isAuthenticated,
    signOut,
    isSigningOut,
  } = useAuth();
  
  // Utiliser useAuthorization pour les vérifications d'autorisation
  const { isAuthorized: isAuthorizedAdmin } = useAuthorization({ roles: [ROLES.ADMIN] });
  const { isAuthorized: isAuthorizedCSM } = useAuthorization({ roles: [ROLES.CSM] });
  const { isAuthorized: isAuthorizedProvider } = useAuthorization({ roles: [ROLES.PROVIDER] });
  const { isAuthorized: isAuthorizedCustomer } = useAuthorization({ roles: [ROLES.CUSTOMER] });

  const [isDashboardsExpanded, setIsDashboardsExpanded] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isMessagingExpanded, setIsMessagingExpanded] = useState(false);
  // États d'expansion pour les sous-menus dynamiques des providers
  const [expandedProviderItems, setExpandedProviderItems] = useState<Set<string>>(new Set());
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<
    number | undefined
  >(undefined);
  const [pendingBookingsCount, setPendingBookingsCount] = useState<
    number | undefined
  >(undefined);
  // État pour l'activation/désactivation des onglets
  const [tabsEnabled, setTabsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-tabs-enabled');
      return saved !== null ? saved === 'true' : true; // Par défaut activé
    }
    return true;
  });

  // Sauvegarder l'état dans localStorage quand il change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-tabs-enabled', String(tabsEnabled));
    }
  }, [tabsEnabled]);

  // Sur desktop, la sidebar est toujours visible (gérée par CSS lg:translate-x-0)
  // On ne ferme automatiquement que sur mobile/tablette lors du redimensionnement
  useEffect(() => {
    const handleResize = () => {
      // Si on passe de desktop à mobile/tablette, fermer la sidebar
      if (window.innerWidth < 1024 && isOpen) {
        // La sidebar se fermera automatiquement via CSS sur mobile
        // On garde juste l'état pour la cohérence
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Gestion de l'expansion automatique selon le pathname
  useEffect(() => {
    // Facturation est maintenant dans "Paramètres" (FooterActions),
    // donc on n'a plus besoin d'auto-expansion du menu "billing".
  }, [pathname]);

  useEffect(() => {
    // Expansion automatique des sous-menus selon le pathname pour les providers
    const expandedKeys = new Set<string>();
    
    // Calendrier (providers INDIVIDUAL)
    const calendarPaths = [
      '/dashboard/calendar',
      '/dashboard/availabilities',
      '/dashboard/patients',
      '/dashboard/appointments',
      '/dashboard/missions',
      '/dashboard/clients',
      '/dashboard/students',
      '/dashboard/reports',
    ];
    if (calendarPaths.some(path => pathname.startsWith(path))) {
      expandedKeys.add('calendar-health');
      expandedKeys.add('calendar-btp');
      expandedKeys.add('calendar-education');
      expandedKeys.add('calendar-default');
    }
    
    // Institution (providers INSTITUTION)
    if (pathname.startsWith('/dashboard/institution')) {
      expandedKeys.add('institution-health');
      expandedKeys.add('institution-btp');
      expandedKeys.add('institution-education');
      expandedKeys.add('institution-default');
    }
    
    setExpandedProviderItems(expandedKeys);
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
      '/dashboard/payments',
      '/dashboard/payments/transactions',
      '/dashboard/invoices',
      '/dashboard/quotes',
      '/dashboard/payment-receipts',
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
          '/api/notifications?page=1&limit=1&status=unread',
        );
        const data = await response.json();

        if (data.success) {
          setUnreadNotificationsCount(data.unreadCount || 0);
        }
      } catch (error) {
        logger.error({ error }, 'Error fetching unread notifications count');
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
    if (!isAuthenticated || (!isAuthorizedAdmin && !isAuthorizedCSM && !isAuthorizedProvider)) {
      setPendingBookingsCount(undefined);
      return;
    }

    const fetchPendingCount = async () => {
      try {
        const role = isAuthorizedAdmin
          ? 'admin'
          : isAuthorizedCSM
          ? 'csm'
          : isAuthorizedProvider
          ? 'provider'
          : 'all';
        const response = await fetch(
          `/api/bookings/pending-count?role=${role}`,
        );
        const data = await response.json();

        if (data.success) {
          setPendingBookingsCount(data.pendingCount || 0);
        }
      } catch (error) {
        logger.error({ error }, 'Error fetching pending bookings count');
        // En cas d'erreur, ne pas afficher de badge
        setPendingBookingsCount(undefined);
      }
    };

    fetchPendingCount();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isAuthorizedAdmin, isAuthorizedCSM, isAuthorizedProvider]);

  // Ne pas afficher la sidebar si l'utilisateur n'est pas connecté
  if (!isAuthenticated) {
    return null;
  }

  // Construction de la navigation par sections
  const dashboards = getAvailableDashboards(user?.roles || []);
  const sections = buildNavigationSections(
    dashboards,
    isAuthorizedAdmin,
    isAuthorizedProvider,
    isAuthorizedCSM,
    isAuthorizedCustomer,
    unreadNotificationsCount,
    pendingBookingsCount,
    user,
  );

  return (
    <>
      {/* Overlay pour mobile et tablette */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm'
          onClick={close}
          aria-hidden='true'
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static
          top-0 left-0
          w-64 md:w-72 lg:w-64
          h-screen
          lg:h-full
          bg-slate-900
          flex flex-col
          flex-shrink-0
          border-r border-slate-800
          z-50 lg:z-auto
          transform transition-transform duration-300 ease-in-out
          shadow-xl lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Bouton de fermeture pour mobile et tablette */}
        <button
          onClick={close}
          className='lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors z-10'
          aria-label='Fermer le menu'
        >
          <X className='h-5 w-5' />
        </button>

        <div className='flex-shrink-0'>
          <UserSection user={user} />
        </div>

      <nav className='flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-contain pb-2'>
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
                .filter((item: NavigationItem) => item.show)
                .map((item: NavigationItem) => {
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
                    const isProviderSubMenu =
                      item.key?.startsWith('calendar-') ||
                      item.key?.startsWith('institution-');

                    type MenuKind =
                      | 'dashboards'
                      | 'settings'
                      | 'messaging'
                      | 'provider-submenu'
                      | 'unknown';

                    const menuKind: MenuKind = (() => {
                      switch (item.key) {
                        case 'dashboards':
                        case 'settings':
                        case 'messaging':
                          return item.key;
                        default:
                          return isProviderSubMenu ? 'provider-submenu' : 'unknown';
                      }
                    })();

                    const isExpanded = (() => {
                      switch (menuKind) {
                        case 'dashboards':
                          return isDashboardsExpanded;
                        case 'settings':
                          return isSettingsExpanded;
                        case 'messaging':
                          return isMessagingExpanded;
                        case 'provider-submenu':
                          return expandedProviderItems.has(item.key || '');
                        default:
                          return false;
                      }
                    })();
                    const onToggle = () => {
                      switch (menuKind) {
                        case 'dashboards':
                          setIsDashboardsExpanded(!isDashboardsExpanded);
                          break;
                        case 'settings':
                          setIsSettingsExpanded(!isSettingsExpanded);
                          break;
                        case 'messaging':
                          setIsMessagingExpanded(!isMessagingExpanded);
                          break;
                        case 'provider-submenu': {
                          const newExpanded = new Set(expandedProviderItems);
                          const key = item.key || '';
                          if (newExpanded.has(key)) {
                            newExpanded.delete(key);
                          } else {
                            newExpanded.add(key);
                          }
                          setExpandedProviderItems(newExpanded);
                          break;
                        }
                        default:
                          break;
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

      <div className='flex-shrink-0'>
        <FooterActions
          onSignOut={signOut}
          isSigningOut={isSigningOut}
          pathname={pathname}
          isSettingsExpanded={isSettingsExpanded}
          onToggleSettings={() => setIsSettingsExpanded(!isSettingsExpanded)}
          tabsEnabled={tabsEnabled}
          onToggleTabs={() => setTabsEnabled(!tabsEnabled)}
        />
      </div>
      </aside>
    </>
  );
}
