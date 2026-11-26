'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks';
import { ROLES } from '@/lib/constants';
import { usePathname } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';
import { useMemo } from 'react';

/**
 * Détermine les dashboards disponibles selon les rôles de l'utilisateur
 * Ne jumelle pas ADMIN et SUPERADMIN
 */
function getAvailableDashboards(userRoles: string[] = []): Array<{ name: string; href: string; role: string }> {
  const dashboards: Array<{ name: string; href: string; role: string }> = [];

  if (userRoles.length === 0) {
    return [];
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

  return dashboards;
}

/**
 * Composant pour switcher entre les dashboards selon les rôles
 */
export default function DashboardSwitcher() {
  const { user } = useAuth();
  const pathname = usePathname();

  const availableDashboards = useMemo(() => {
    return getAvailableDashboards(user?.roles || []);
  }, [user?.roles]);

  // Ne pas afficher le switch s'il n'y a qu'un seul dashboard ou aucun
  if (availableDashboards.length <= 1) {
    return null;
  }

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6'>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <LayoutDashboard className='h-5 w-5 text-gray-600' />
          <h3 className='text-sm font-semibold text-gray-900'>Tableaux de bord disponibles</h3>
        </div>
      </div>
      <div className='flex flex-wrap gap-2'>
        {availableDashboards.map((dashboard) => {
          const isActive = pathname?.startsWith(dashboard.href);
          return (
            <Link
              key={dashboard.href}
              href={dashboard.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {dashboard.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
