'use client';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions';
import RoleSpecificStats from '@/components/dashboard/RoleSpecificStats';
import { useAuth } from '@/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboardPage() {
  const { isAuthenticated, isLoading, user, isAdmin } = useAuth();
  const router = useRouter();


  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Rediriger si l'utilisateur n'est pas admin
    if (!isLoading && isAuthenticated && !isAdmin()) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router, isAdmin]);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin()) {
    return null;
  }

  return (
    <div className='space-y-6'>
      <DashboardHeader
        userName={user?.name || 'Administrateur'}
        subtitle='Tableau de bord administrateur - Gérez votre plateforme Diaspomoney'
      />
      <RoleSpecificStats userId={user?.id} />
      <DashboardQuickActions isAdmin={true} isCSM={false} />
    </div>
  );
}

