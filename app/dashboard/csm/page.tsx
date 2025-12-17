'use client';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import RoleSpecificStats from '@/components/dashboard/RoleSpecificStats';
import { useAuth } from '@/hooks';
import { ROLES } from '@/lib/constants';
import { AuthorizedRoute } from '@/components/auth';

/**
 * Contenu de la page Dashboard CSM
 */
function CSMDashboardPageContent() {
  const { user } = useAuth();

  return (
    <div className='space-y-6'>
      <DashboardHeader
        userName={user?.name || 'CSM'}
        subtitle='Tableau de bord CSM - Suivez et gérez les prestataires et clients'
      />
      <RoleSpecificStats {...(user?.id && { userId: user.id })} />
      {/* <DashboardQuickActions isAdmin={false} isCSM={true} /> */}
    </div>
  );
}

/**
 * Page Dashboard CSM
 * Implémente les design patterns :
 * - Authorization Pattern (via AuthorizedRoute aligné avec @Authorize decorator backend)
 */
export default function CSMDashboardPage() {
  return (
    <AuthorizedRoute roles={[ROLES.CSM]} redirectTo="/dashboard">
      <CSMDashboardPageContent />
    </AuthorizedRoute>
  );
}

