'use client';

import { useAuth } from '@/hooks';
import { ROLES } from '@/lib/constants';
import { AuthorizedRoute } from '@/components/auth';
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

  // Super Admin 
  if (userRoles.includes(ROLES.SUPERADMIN)) {
    return '/dashboard/superadmin';
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

/**
 * Contenu de la page dashboard (redirection)
 */
function DashboardPageContent() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers le dashboard de priorité la plus haute
    if (user?.roles) {
      const highestPriorityDashboard = getHighestPriorityDashboard(user.roles);
      if (highestPriorityDashboard !== '/dashboard') {
        router.replace(highestPriorityDashboard);
      }
    }
  }, [user?.roles, router]);

  // Afficher un loader pendant la redirection
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
    </div>
  );
}

/**
 * Page dashboard principale
 * Implémente les design patterns :
 * - Authorization Pattern (via AuthorizedRoute aligné avec @Authorize decorator backend)
 * - Redirection automatique vers le dashboard approprié selon le rôle
 */
export default function DashboardPage() {
  return (
    <AuthorizedRoute redirectTo="/login">
      <DashboardPageContent />
    </AuthorizedRoute>
  );
}
