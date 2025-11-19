'use client';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { useAuth } from '@/hooks';
import { useDashboardStats } from '@/hooks/dashboard';
import { Calendar, CreditCard, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CustomerDashboardPage() {
  const { isAuthenticated, isLoading, user, isCustomer } = useAuth();
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

    // Rediriger si l'utilisateur n'est pas client
    if (!isLoading && isAuthenticated && !isCustomer()) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router, isCustomer]);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated || !isCustomer()) {
    return null;
  }

  return (
    <div className='space-y-6'>
      <DashboardHeader
        userName={user?.name || 'Client'}
        subtitle='Tableau de bord client - Gérez vos services et bénéficiaires'
      />
      <DashboardStats stats={stats} isAdmin={false} isCSM={false} />
      
      {/* Actions rapides spécifiques aux clients */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Link
          href='/dashboard/services'
          className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
        >
          <div className='flex items-center justify-between mb-4'>
            <Calendar className='h-8 w-8 text-blue-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Prendre rendez-vous
          </h3>
          <p className='text-sm text-gray-600'>
            Réservez un service pour vos bénéficiaires
          </p>
        </Link>

        <Link
          href='/dashboard/beneficiaries'
          className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
        >
          <div className='flex items-center justify-between mb-4'>
            <Users className='h-8 w-8 text-purple-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Mes bénéficiaires
          </h3>
          <p className='text-sm text-gray-600'>
            Gérez vos bénéficiaires
          </p>
        </Link>

        <Link
          href='/dashboard/invoices'
          className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
        >
          <div className='flex items-center justify-between mb-4'>
            <FileText className='h-8 w-8 text-green-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Mes factures
          </h3>
          <p className='text-sm text-gray-600'>
            Consultez et payez vos factures
          </p>
        </Link>

        <Link
          href='/dashboard/payments'
          className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
        >
          <div className='flex items-center justify-between mb-4'>
            <CreditCard className='h-8 w-8 text-orange-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Moyens de paiement
          </h3>
          <p className='text-sm text-gray-600'>
            Gérez vos cartes et méthodes de paiement
          </p>
        </Link>
      </div>
    </div>
  );
}

