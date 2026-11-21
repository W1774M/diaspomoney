'use client';

/**
 * Composant de statistiques spécifiques par rôle
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useCustomerStats, useProviderIndividualStats, etc.)
 * - Service Layer Pattern (via API routes qui utilisent les services)
 * - Repository Pattern (via services qui utilisent les repositories)
 * - Separation of Concerns (logique dans les hooks, rendu dans les composants)
 * - Single Responsibility Principle (un composant par rôle)
 */

import React from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { ROLES } from '@/lib/constants';
import { usePathname } from 'next/navigation';
import {
  useCustomerStats,
  useProviderIndividualStats,
  useProviderInstitutionStats,
  useCsmStats,
  useAdminStats,
  useSuperAdminStats,
} from '@/hooks/statistics';
import {
  CustomerStats,
  ProviderIndividualStats,
  ProviderInstitutionStats,
  CsmStats,
  AdminStats,
  SuperAdminStats,
} from '@/components/dashboard/stats';

interface RoleSpecificStatsProps {
  userId?: string;
}

const RoleSpecificStats = React.memo<RoleSpecificStatsProps>(function RoleSpecificStats({
  userId,
}) {
  const { user, isProvider, isCustomer, isCSM, isAdmin } = useAuth();
  const pathname = usePathname();
  
  // Déterminer le dashboard actif selon le pathname
  const isProviderDashboard = pathname?.includes('/dashboard/provider');
  const isCustomerDashboard = pathname?.includes('/dashboard/customer');
  const isCsmDashboard = pathname?.includes('/dashboard/csm');
  const isAdminDashboard = pathname?.includes('/dashboard/admin') || pathname?.includes('/dashboard/superadmin');

  // Déterminer si l'utilisateur est super admin
  const userRoles = user?.roles || [];
  const hasAdmin = userRoles.includes(ROLES.ADMIN);
  const hasMultipleRoles = userRoles.length > 1;
  const isSuperAdmin = userRoles.includes(ROLES.SUPERADMIN) || (isAdmin() && hasAdmin && hasMultipleRoles);

  // Récupérer les statistiques selon le rôle
  const customerStats = useCustomerStats({
    ...(userId && { userId }),
    enabled: isCustomer(),
  });

  const providerInfo = (user as any)?.providerInfo;
  // Par défaut, utiliser ProviderIndividualStats si le type n'est pas défini ou est INDIVIDUAL
  const shouldUseIndividual = !providerInfo?.type || providerInfo.type === 'INDIVIDUAL';
  const providerIndividualStats = useProviderIndividualStats({
    ...(userId && { userId }),
    enabled: isProvider() && shouldUseIndividual,
    providerInfo,
  });

  const providerInstitutionStats = useProviderInstitutionStats({
    ...(userId && { userId }),
    enabled: isProvider() && !shouldUseIndividual,
    providerInfo,
  });

  const csmStats = useCsmStats({
    ...(userId && { userId }),
    enabled: isCSM(),
  });

  const adminStats = useAdminStats({
    enabled: isAdmin() && !isSuperAdmin,
  });

  const { stats: superAdminStats, loading: superAdminLoading, error: superAdminError } =
    useSuperAdminStats({
      enabled: isSuperAdmin,
    });

  // Rendu selon le dashboard actif (priorité au dashboard actif)
  // Si on est sur le dashboard provider, afficher les stats provider en priorité
  if (isProviderDashboard) {
    if (providerIndividualStats) {
      return <ProviderIndividualStats stats={providerIndividualStats} />;
    }
    if (providerInstitutionStats) {
      return <ProviderInstitutionStats stats={providerInstitutionStats} />;
    }
  }
  
  // Si on est sur le dashboard customer, afficher les stats customer en priorité
  if (isCustomerDashboard && customerStats) {
    return <CustomerStats stats={customerStats} />;
  }
  
  // Si on est sur le dashboard CSM, afficher les stats CSM en priorité
  if (isCsmDashboard && csmStats) {
    return <CsmStats stats={csmStats} />;
  }
  
  // Si on est sur le dashboard admin, afficher les stats admin en priorité
  if (isAdminDashboard) {
    if (superAdminStats) {
      return (
        <SuperAdminStats
          stats={superAdminStats}
          loading={superAdminLoading}
          error={superAdminError}
        />
      );
    }
    if (adminStats) {
      return <AdminStats stats={adminStats} />;
    }
  }
  
  // Fallback : afficher selon l'ordre de priorité des rôles (pour compatibilité)
  if (customerStats && !isProviderDashboard) {
    return <CustomerStats stats={customerStats} />;
  }

  if (providerIndividualStats) {
    return <ProviderIndividualStats stats={providerIndividualStats} />;
  }

  if (providerInstitutionStats) {
    return <ProviderInstitutionStats stats={providerInstitutionStats} />;
  }

  if (csmStats) {
    return <CsmStats stats={csmStats} />;
  }

  if (adminStats) {
    return <AdminStats stats={adminStats} />;
  }

  if (superAdminStats) {
    return (
      <SuperAdminStats
        stats={superAdminStats}
        loading={superAdminLoading}
        error={superAdminError}
      />
    );
  }

  return null;
});

RoleSpecificStats.displayName = 'RoleSpecificStats';

export default RoleSpecificStats;
