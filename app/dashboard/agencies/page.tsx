'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Page de gestion des agences
 * Accessible uniquement aux administrateurs
 */
export default function AgenciesPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin())) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin()) {
    return null;
  }

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

