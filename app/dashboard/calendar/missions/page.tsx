'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { ProviderInfo } from '@/lib/types';
import { Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Page de planning des missions
 * Accessible uniquement aux providers avec profil INDIVIDUAL
 */
export default function MissionPlanningPage() {
  const { isAuthenticated, isProvider, user, isLoading } = useAuth();
  const router = useRouter();

  const isIndividualProvider = isProvider() && (user as ProviderInfo)?.providerInfo?.type === 'INDIVIDUAL';

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isIndividualProvider)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isIndividualProvider, isLoading, router]);



  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center mb-4'>
            <Calendar className='h-8 w-8 text-[hsl(25,100%,53%)] mr-3' />
            <h1 className='text-3xl font-bold text-gray-900'>Planning des missions</h1>
          </div>
          <p className='text-gray-600'>
            Gérez votre planning et vos missions à venir.
          </p>
        </div>

        {/* Content */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
          <div className='text-center py-12'>
            <Calendar className='h-16 w-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Planning des missions
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

