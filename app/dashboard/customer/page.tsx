'use client';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import RoleSpecificStats from '@/components/dashboard/RoleSpecificStats';
import CustomerDashboardCharts from '@/components/dashboard/customer/CustomerDashboardCharts';
import { useAuth } from '@/hooks';
import { ROLES } from '@/lib/constants';
import { AuthorizedRoute } from '@/components/auth';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

/**
 * Contenu de la page Dashboard Customer
 */
function CustomerDashboardPageContent() {
  const { user } = useAuth();

  return (
    <div className='space-y-6'>
      <DashboardHeader
        userName={user?.name || 'Client'}
        subtitle='Tableau de bord client - Gérez vos services et bénéficiaires'
      />
      <RoleSpecificStats {...(user?.id && { userId: user.id })} />
      <CustomerDashboardCharts />
      
      {/* Actions rapides spécifiques aux clients */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Link
          href='/services'
          className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
        >
          <div className='flex items-center justify-between mb-4'>
            <Calendar className='h-8 w-8 text-blue-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Services disponibles
          </h3>
          <p className='text-sm text-gray-600'>
            Découvrez les services disponibles
          </p>
        </Link>
      </div>
      {/* <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
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
      </div> */}
    </div>
  );
}

/**
 * Page Dashboard Customer
 * Implémente les design patterns :
 * - Authorization Pattern (via AuthorizedRoute aligné avec @Authorize decorator backend)
 */
export default function CustomerDashboardPage() {
  return (
    <AuthorizedRoute roles={[ROLES.CUSTOMER]} redirectTo="/dashboard">
      <CustomerDashboardPageContent />
    </AuthorizedRoute>
  );
}

