'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

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
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-white rounded-lg shadow p-6'>
          <h1 className='text-3xl font-bold text-gray-900 mb-4'>Dashboard</h1>
          <p className='text-gray-600 mb-4'>
            Bienvenue, {user?.name || 'Utilisateur'} !
          </p>
          <div className='bg-green-50 border border-green-200 rounded-md p-4'>
            <p className='text-green-800'>
              ✅ Connexion réussie ! Vous êtes maintenant sur le dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
