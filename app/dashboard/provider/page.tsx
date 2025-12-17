'use client';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import RoleSpecificStats from '@/components/dashboard/RoleSpecificStats';
import { useAuth } from '@/hooks';
import { ROLES } from '@/lib/constants';
import { AuthorizedRoute } from '@/components/auth';

/**
 * Contenu de la page Dashboard Provider
 */
function ProviderDashboardPageContent() {
  const { user } = useAuth();

  return (
    <div className='space-y-6'>
      <DashboardHeader
        userName={user?.name || 'Prestataire'}
        subtitle='Tableau de bord prestataire - Gérez vos services et rendez-vous'
      />
      <RoleSpecificStats {...(user?.id && { userId: user.id })} />
      
      {/* Actions rapides spécifiques aux prestataires */}
      {/* <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
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
      </div> */}
    </div>
  );
}

/**
 * Page Dashboard Provider
 * Implémente les design patterns :
 * - Authorization Pattern (via AuthorizedRoute aligné avec @Authorize decorator backend)
 */
export default function ProviderDashboardPage() {
  return (
    <AuthorizedRoute roles={[ROLES.PROVIDER]} redirectTo="/dashboard">
      <ProviderDashboardPageContent />
    </AuthorizedRoute>
  );
}

