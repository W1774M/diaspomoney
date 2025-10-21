'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import {
  Building,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Home,
  LogOut,
  Package,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from '../ui/Logo';

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

  // Ouvrir automatiquement la section facturation si on est sur une page de facturation
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

  // Ne pas afficher la sidebar si l'utilisateur n'est pas connecté
  if (!isAuthenticated) {
    return null;
  }

  const navigation = [
    {
      name: 'Dashboard',
      key: 'dashboard',
      href: '/dashboard',
      icon: Home,
      show: true,
    },
    {
      name: 'Services',
      key: 'services',
      href: '/dashboard/services',
      icon: Package,
      show: true,
    },
    {
      name: 'Mes bénéficiaires',
      key: 'beneficiaries',
      href: '/dashboard/beneficiaries',
      icon: Users,
      show: isCustomer(),
    },
    {
      name: 'Facturation',
      key: 'billing',
      icon: FileText,
      values: [
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
      show: true,
    },
    {
      name: 'Utilisateurs',
      key: 'users',
      href: '/dashboard/users',
      icon: Users,
      show: isAdmin(),
    },
    {
      name: 'Spécialités',
      key: 'specialities',
      href: '/dashboard/specialities',
      icon: Building,
      show: isAdmin(),
    },
    {
      name: 'Mes disponibilités',
      key: 'availabilities',
      href: '/dashboard/availabilities',
      icon: Clock,
      show: isProvider(),
    },
    {
      name: 'Contacts prestataires',
      key: 'providers-contacts',
      href: '/dashboard/providers/contacts',
      icon: Eye,
      show: isCSM() || isAdmin(),
    },
  ];

  const visibleNavigation = (navigation || []).filter(item => item.show);

  return (
    <aside className='w-64 bg-white shadow-sm border-r min-h-screen flex flex-col'>
      {/* Section utilisateur en haut */}
      <div className='p-6 border-b border-gray-200'>
        <div className='flex items-center space-x-3'>
          <div className='w-10 h-10 bg-[hsl(25,100%,53%)] rounded-full flex items-center justify-center'>
            {/* <User className="h-5 w-5 text-white" /> */}
            <Logo
              src={
                user?.avatar?.image ||
                '/img/Logo_Diaspo_Horizontal_enrichi.webp'
              }
              width={60}
              height={60}
              alt={user?.avatar?.name || user?.name || 'Utilisateur'}
              fallbackText={(user?.name || 'U').slice(0, 1)}
            />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-gray-900 truncate'>
              {user?.name || 'Utilisateur'}
            </p>
            <p className='text-xs text-gray-500 truncate'>
              {user?.email || ''}
            </p>
            <div className='flex items-center mt-1'>
              {user?.roles?.map(role => (
                <span
                  key={role}
                  className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-1'
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <nav className='p-6 flex flex-col flex-1'>
        <div className='space-y-2 flex-1'>
          {visibleNavigation.map(item => {
            // Si href est défini, afficher un lien
            if (item.href) {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-gray-700 bg-[hsl(25,100%,53%)]/10'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon && <item.icon className='h-5 w-5 mr-3' />}
                  {item.name}
                </Link>
              );
            }
            // Sinon, si values est défini, afficher les sous-liens avec chevron
            if (item.values && Array.isArray(item.values)) {
              // Filtrer les sous-items visibles
              const visibleSubItems = (item.values || []).filter(
                subItem => subItem.show
              );
              if (visibleSubItems.length === 0) return null;

              // Vérifier si un sous-item est actif
              const hasActiveSubItem = visibleSubItems.some(
                subItem => pathname === subItem.href
              );

              return (
                <div key={item.name} className='flex flex-col'>
                  <button
                    onClick={() => setIsBillingExpanded(!isBillingExpanded)}
                    className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      hasActiveSubItem
                        ? 'text-gray-700 bg-[hsl(25,100%,53%)]/10'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className='flex items-center'>
                      {item.icon && <item.icon className='h-5 w-5 mr-3' />}
                      <span className='text-sm font-medium'>{item.name}</span>
                    </div>
                    {isBillingExpanded ? (
                      <ChevronDown className='h-4 w-4 text-gray-500' />
                    ) : (
                      <ChevronRight className='h-4 w-4 text-gray-500' />
                    )}
                  </button>

                  {isBillingExpanded && (
                    <div className='flex flex-col ml-4 mt-1'>
                      {visibleSubItems.map(subItem => {
                        const isActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.key}
                            href={subItem.href}
                            className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                              isActive
                                ? 'text-gray-700 bg-[hsl(25,100%,53%)]/10'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            {subItem.icon && (
                              <subItem.icon className='h-4 w-4 mr-2' />
                            )}
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            // Sinon, rien afficher
            return null;
          })}
        </div>

        {/* Section séparée pour les actions utilisateur en bas */}
        <div className='pt-6 border-t border-gray-200 space-y-2'>
          <Link
            href='/dashboard/settings'
            className='flex items-center px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg hover:text-gray-900'
          >
            <Settings className='h-5 w-5 mr-3' />
            Paramètres
          </Link>

          <button
            onClick={signOut}
            disabled={isSigningOut}
            className='flex items-center px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg hover:text-gray-900 w-full disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <LogOut className='h-5 w-5 mr-3' />
            {isSigningOut ? 'Déconnexion...' : 'Déconnexion'}
          </button>
        </div>
      </nav>
    </aside>
  );
}
