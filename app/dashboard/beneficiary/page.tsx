'use client';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { useAuth } from '@/hooks';
import { useDashboardStats } from '@/hooks/dashboard';
import { Calendar, FileText, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BeneficiaryDashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const stats = useDashboardStats({
    userId: user?.id || '',
    isAdmin: false,
    isCSM: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

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

  return (
    <div className='space-y-6'>
      <DashboardHeader
        userName={user?.name || 'Bénéficiaire'}
        subtitle='Tableau de bord bénéficiaire - Consultez vos services et rendez-vous'
      />
      <DashboardStats stats={stats} isAdmin={false} isCSM={false} />
      
      {/* Actions rapides spécifiques aux bénéficiaires */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
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
            Consultez vos rendez-vous à venir et passés
          </p>
        </Link>

        <Link
          href='/dashboard/services/history'
          className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
        >
          <div className='flex items-center justify-between mb-4'>
            <FileText className='h-8 w-8 text-green-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Historique
          </h3>
          <p className='text-sm text-gray-600'>
            Consultez l'historique de vos services
          </p>
        </Link>

        <Link
          href='/dashboard/services'
          className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
        >
          <div className='flex items-center justify-between mb-4'>
            <Heart className='h-8 w-8 text-red-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Services disponibles
          </h3>
          <p className='text-sm text-gray-600'>
            Découvrez les services disponibles
          </p>
        </Link>
      </div>
    </div>
  );
}

