'use client';

// import { useAuth } from '@/hooks';
// import { ProviderInfo } from '@/lib/types';
import { ROLES } from '@/lib/constants';
import { AuthorizedRoute } from '@/components/auth';
import { ShoppingCart } from 'lucide-react';

/**
 * Contenu de la page de réservations clients
 * Accessible uniquement aux providers avec profil INDIVIDUAL
 */
function ClientBookingsPageContent() {
  // const { user, isProvider } = useAuth();
  // const isIndividualProvider = isProvider() && (user as ProviderInfo)?.providerInfo?.type === 'INDIVIDUAL';

  // Note: La vérification du type INDIVIDUAL doit être faite côté backend
  // Ici on vérifie seulement que l'utilisateur est un provider

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center mb-4'>
            <ShoppingCart className='h-8 w-8 text-[hsl(25,100%,53%)] mr-3' />
            <h1 className='text-3xl font-bold text-gray-900'>Réservations clients</h1>
          </div>
          <p className='text-gray-600'>
            Consultez et gérez les réservations de vos clients.
          </p>
        </div>

        {/* Content */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
          <div className='text-center py-12'>
            <ShoppingCart className='h-16 w-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Réservations clients
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
 * Page de réservations clients
 * Implémente les design patterns :
 * - Authorization Pattern (via AuthorizedRoute aligné avec @Authorize decorator backend)
 */
export default function ClientBookingsPage() {
  return (
    <AuthorizedRoute roles={[ROLES.PROVIDER]} redirectTo="/dashboard">
      <ClientBookingsPageContent />
    </AuthorizedRoute>
  );
}

