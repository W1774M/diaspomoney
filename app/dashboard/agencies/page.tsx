'use client';

import { ROLES } from '@/lib/constants';
import { AuthorizedRoute } from '@/components/auth';
import { Building } from 'lucide-react';

/**
 * Contenu de la page de gestion des agences
 */
function AgenciesPageContent() {

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center mb-4'>
            <Building className='h-8 w-8 text-[hsl(25,100%,53%)] mr-3' />
            <h1 className='text-3xl font-bold text-gray-900'>Gestion des Agences</h1>
          </div>
          <p className='text-gray-600'>
            Gérez les agences et leurs configurations.
          </p>
        </div>

        {/* Content */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
          <div className='text-center py-12'>
            <Building className='h-16 w-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Gestion des agences
            </h3>
            <p className='text-gray-500'>
              Cette fonctionnalité sera bientôt disponible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Page de gestion des agences
 * Implémente les design patterns :
 * - Authorization Pattern (via AuthorizedRoute aligné avec @Authorize decorator backend)
 */
export default function AgenciesPage() {
  return (
    <AuthorizedRoute roles={[ROLES.ADMIN]} redirectTo="/dashboard">
      <AgenciesPageContent />
    </AuthorizedRoute>
  );
}

