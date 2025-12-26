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
  const providerIndividualStats = useProviderIndividualStats({
    ...(userId && { userId }),
    enabled: isProvider(),
    providerInfo,
  });

  const providerInstitutionStats = useProviderInstitutionStats({
    ...(userId && { userId }),
    enabled: isProvider(),
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

  // Rendu selon le rôle
  if (customerStats) {
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
