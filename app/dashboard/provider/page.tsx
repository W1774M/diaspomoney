'use client';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { useAuth } from '@/hooks';
import { useDashboardStats } from '@/hooks/dashboard';
import { Calendar, Clock, DollarSign, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProviderDashboardPage() {
  const { isAuthenticated, isLoading, user, isProvider } = useAuth();
  const router = useRouter();

  const stats = useDashboardStats({
    userId: user?.id || '',
    isAdmin: false,
    isCSM: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Rediriger si l'utilisateur n'est pas prestataire
    if (!isLoading && isAuthenticated && !isProvider()) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router, isProvider]);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated || !isProvider()) {
    return null;
  }

  return (
    <div className='space-y-6'>
      <DashboardHeader
        userName={user?.name || 'Prestataire'}
        subtitle='Tableau de bord prestataire - Gérez vos services et rendez-vous'
      />
      <DashboardStats stats={stats} isAdmin={false} isCSM={false} />
      
      {/* Actions rapides spécifiques aux prestataires */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Link
          href='/dashboard/availabilities'
          className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
        >
          <div className='flex items-center justify-between mb-4'>
            <Clock className='h-8 w-8 text-orange-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Mes disponibilités
          </h3>
          <p className='text-sm text-gray-600'>
            Gérez vos créneaux disponibles
          </p>
        </Link>

        <Link
          href='/dashboard/services'
          className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
        >
          <div className='flex items-center justify-between mb-4'>
            <Calendar className='h-8 w-8 text-blue-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Mes rendez-vous
          </h3>
          <p className='text-sm text-gray-600'>
            Consultez vos rendez-vous à venir
          </p>
        </Link>

        <Link
          href='/dashboard/quotes'
          className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
        >
          <div className='flex items-center justify-between mb-4'>
            <DollarSign className='h-8 w-8 text-green-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Mes revenus
          </h3>
          <p className='text-sm text-gray-600'>
            Suivez vos revenus et factures
          </p>
        </Link>

        <Link
          href='/dashboard/invoices'
          className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
        >
          <div className='flex items-center justify-between mb-4'>
            <Users className='h-8 w-8 text-purple-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Mes clients
          </h3>
          <p className='text-sm text-gray-600'>
            Gérez vos relations clients
          </p>
        </Link>
      </div>
    </div>
  );
}

