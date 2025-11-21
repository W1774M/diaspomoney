'use client';

import { useAuth } from '@/hooks';
import { ROLES } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Détermine le dashboard de priorité la plus haute selon les rôles
 * Ordre de priorité : Super Admin > Admin > CSM > Provider > Customer
 */
function getHighestPriorityDashboard(userRoles: string[] = []): string {
  if (userRoles.length === 0) {
    return '/dashboard';
  }

  // Super Admin : ADMIN avec plusieurs autres rôles
  if (userRoles.includes(ROLES.ADMIN) && userRoles.length > 1) {
    return '/dashboard/admin';
  }

  // Admin
  if (userRoles.includes(ROLES.ADMIN)) {
    return '/dashboard/admin';
  }

  // CSM
  if (userRoles.includes(ROLES.CSM)) {
    return '/dashboard/csm';
  }

  // Provider
  if (userRoles.includes(ROLES.PROVIDER)) {
    return '/dashboard/provider';
  }

  // Customer
  if (userRoles.includes(ROLES.CUSTOMER)) {
    return '/dashboard/customer';
  }

  // Beneficiary
  if (userRoles.includes(ROLES.BENEFICIARY)) {
    return '/dashboard/beneficiary';
  }

  return '/dashboard';
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Rediriger vers le dashboard de priorité la plus haute
    if (!isLoading && isAuthenticated && user?.roles) {
      const highestPriorityDashboard = getHighestPriorityDashboard(user.roles);
      if (highestPriorityDashboard !== '/dashboard') {
        router.replace(highestPriorityDashboard);
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Afficher un loader pendant la redirection
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
    </div>
  );
}
