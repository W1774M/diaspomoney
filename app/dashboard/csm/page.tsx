'use client';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { useAuth } from '@/hooks';
import { useDashboardStats } from '@/hooks/dashboard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CSMDashboardPage() {
  const { isAuthenticated, isLoading, user, isCSM } = useAuth();
  const router = useRouter();

  const stats = useDashboardStats({
    userId: user?.id || '',
    isAdmin: false,
    isCSM: true,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Rediriger si l'utilisateur n'est pas CSM
    if (!isLoading && isAuthenticated && !isCSM()) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router, isCSM]);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated || !isCSM()) {
    return null;
  }

  return (
    <div className='space-y-6'>
      <DashboardHeader
        userName={user?.name || 'CSM'}
        subtitle='Tableau de bord CSM - Suivez et gérez les prestataires et clients'
      />
      <DashboardStats stats={stats} isAdmin={false} isCSM={true} />
      <DashboardQuickActions isAdmin={false} isCSM={true} />
    </div>
  );
}

