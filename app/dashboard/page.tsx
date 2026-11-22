'use client';

import { useAuth } from '@/hooks';
import { ROLES } from '@/lib/constants';
import { AuthorizedRoute } from '@/components/auth';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { LayoutDashboard } from 'lucide-react';

/**
 * Détermine les dashboards disponibles selon les rôles de l'utilisateur
 * Ne jumelle pas ADMIN et SUPERADMIN
 */
function getAvailableDashboards(userRoles: string[] = []): Array<{ name: string; href: string; role: string }> {
  const dashboards: Array<{ name: string; href: string; role: string }> = [];

  if (userRoles.length === 0) {
    return [{ name: 'Dashboard', href: '/dashboard', role: 'default' }];
  }

  // Super Admin
  if (userRoles.includes(ROLES.SUPERADMIN)) {
    dashboards.push({
      name: 'Super Admin',
      href: '/dashboard/superadmin',
      role: ROLES.SUPERADMIN,
    });
  }

  // Admin - peut apparaître même si SUPERADMIN est présent
  if (userRoles.includes(ROLES.ADMIN)) {
    dashboards.push({
      name: 'Admin',
      href: '/dashboard/admin',
      role: ROLES.ADMIN,
    });
  }

  // CSM
  if (userRoles.includes(ROLES.CSM)) {
    dashboards.push({
      name: 'CSM',
      href: '/dashboard/csm',
      role: ROLES.CSM,
    });
  }

  // Provider
  if (userRoles.includes(ROLES.PROVIDER)) {
    dashboards.push({
      name: 'Prestataire',
      href: '/dashboard/provider',
      role: ROLES.PROVIDER,
    });
  }

  // Customer
  if (userRoles.includes(ROLES.CUSTOMER)) {
    dashboards.push({
      name: 'Client',
      href: '/dashboard/customer',
      role: ROLES.CUSTOMER,
    });
  }

  return dashboards.length > 0
    ? dashboards
    : [{ name: 'Dashboard', href: '/dashboard', role: 'default' }];
}

/**
 * Contenu de la page dashboard principale avec switch entre les dashboards
 */
function DashboardPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const availableDashboards = useMemo(() => {
    return getAvailableDashboards(user?.roles || []);
  }, [user?.roles]);

  const [selectedDashboard, setSelectedDashboard] = useState<string>(() => {
    // Déterminer le dashboard initial selon l'URL ou le rôle
    if (pathname && pathname !== '/dashboard') {
      return pathname;
    }
    
    // Par défaut, rediriger vers le premier dashboard disponible
    if (availableDashboards.length > 0 && availableDashboards[0]) {
      return availableDashboards[0].href;
    }
    return '/dashboard';
  });

  // Rediriger vers le dashboard sélectionné si on est sur /dashboard
  useEffect(() => {
    if (pathname === '/dashboard' && availableDashboards.length > 0 && availableDashboards[0]) {
      const defaultDashboard = availableDashboards[0].href;
      if (selectedDashboard !== defaultDashboard) {
        setSelectedDashboard(defaultDashboard);
      }
      router.replace(defaultDashboard);
    }
  }, [pathname, availableDashboards, router, selectedDashboard]);

  // Si un seul dashboard, rediriger directement
  if (availableDashboards.length === 1 && availableDashboards[0]) {
    router.replace(availableDashboards[0].href);
    return (
      <div className='min-h-dvh flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600'></div>
      </div>
    );
  }

  // Si plusieurs dashboards, afficher le switch
  return (
    <div className='space-y-6'>
      <DashboardHeader
        userName={user?.name || 'Utilisateur'}
        subtitle='Tableau de bord - Sélectionnez votre vue'
      />
      
      {/* Switch entre les dashboards */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
        <div className='flex items-center gap-2 mb-4'>
          <LayoutDashboard className='h-5 w-5 text-gray-600' />
          <h2 className='text-lg font-semibold text-gray-900'>Sélectionner un tableau de bord</h2>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {availableDashboards.map((dashboard) => (
            <button
              key={dashboard.href}
              onClick={() => {
                setSelectedDashboard(dashboard.href);
                router.push(dashboard.href);
              }}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedDashboard === dashboard.href
                  ? 'border-brand-600 bg-brand-500/5'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className='flex items-center gap-3'>
                <LayoutDashboard className={`h-6 w-6 ${
                  selectedDashboard === dashboard.href
                    ? 'text-brand-700'
                    : 'text-gray-500'
                }`} />
                <div>
                  <h3 className='font-semibold text-gray-900'>{dashboard.name}</h3>
                  <p className='text-sm text-gray-500'>Tableau de bord {dashboard.name.toLowerCase()}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Page dashboard principale
 * Implémente les design patterns :
 * - Authorization Pattern (via AuthorizedRoute aligné avec @Authorize decorator backend)
 * - Switch Pattern pour basculer entre les dashboards selon les rôles
 */
export default function DashboardPage() {
  return (
    <AuthorizedRoute redirectTo="/login">
      <DashboardPageContent />
    </AuthorizedRoute>
  );
}
