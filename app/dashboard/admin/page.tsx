'use client';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import RoleSpecificStats from '@/components/dashboard/RoleSpecificStats';
import { useAuth } from '@/hooks';
import { AdminRoute } from '@/components/auth';

/**
 * Contenu du tableau de bord admin
 */
function AdminDashboardContent() {
  const { user } = useAuth();

  return (
    <div className='space-y-6'>
      <DashboardHeader
        userName={user?.name || 'Administrateur'}
        subtitle='Tableau de bord administrateur - Gérez votre plateforme Diaspomoney'
      />
      <RoleSpecificStats {...(user?.id && { userId: user.id })} />
      {/* <DashboardQuickActions isAdmin={true} isCSM={false} /> */}
    </div>
  );
}

/**
 * Page du tableau de bord admin
 * Implémente les design patterns :
 * - Authorization Pattern (via AdminRoute aligné avec @Authorize decorator backend)
 */
export default function AdminDashboardPage() {
  return (
    <AdminRoute redirectTo="/dashboard">
      <AdminDashboardContent />
    </AdminRoute>
  );
}

