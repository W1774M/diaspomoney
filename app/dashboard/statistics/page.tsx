'use client';

/**
 * Page Statistiques Personnelles
 * Affiche le budget, services utilisés, économies et prestataires préférés
 *
 * Implémente les design patterns :
 * - Custom Hooks Pattern (via useStatistics)
 * - Middleware Pattern (authentification via useAuth)
 * - Service Layer Pattern (via API route)
 * - Logger Pattern (logging structuré côté serveur)
 * - Repository Pattern (via API route)
 */

import { useAuth, useStatistics } from '@/hooks';
import {
  BarChart3,
  DollarSign,
  Package,
  TrendingDown,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StatisticsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { statistics, loading, error, fetchStatistics } = useStatistics();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatistics();
    }
  }, [isAuthenticated, fetchStatistics]);

  if (isLoading || loading) {
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
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Statistiques Personnelles
          </h1>
          <p className='text-gray-600 mt-1'>
            Analysez votre utilisation et vos économies
          </p>
        </div>
      </div>

      {error ? (
        <div className='text-center py-12 bg-white rounded-lg shadow-sm border border-red-200'>
          <BarChart3 className='h-12 w-12 text-red-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-red-900 mb-2'>
            Erreur lors du chargement
          </h3>
          <p className='text-red-600 mb-4'>{error}</p>
          <button
            onClick={() => fetchStatistics()}
            className='px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors'
          >
            Réessayer
          </button>
        </div>
      ) : !statistics ? (
        <div className='text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200'>
          <BarChart3 className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Aucune statistique disponible
          </h3>
          <p className='text-gray-600'>
            Vos statistiques apparaîtront après vos premières commandes
          </p>
        </div>
      ) : (
        <>
          {/* Budget Section */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <DollarSign className='h-6 w-6 text-[hsl(25,100%,53%)]' />
              <h2 className='text-xl font-semibold text-gray-900'>Budget</h2>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <h3 className='text-sm font-medium text-gray-600 mb-2'>
                  Budget Mensuel
                </h3>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Budget</span>
                    <span className='text-lg font-bold text-gray-900'>
                      {statistics.budget.monthly.budget.toFixed(2)} €
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Dépensé</span>
                    <span className='text-lg font-bold text-orange-600'>
                      {statistics.budget.monthly.spent.toFixed(2)} €
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Restant</span>
                    <span className='text-lg font-bold text-green-600'>
                      {statistics.budget.monthly.remaining.toFixed(2)} €
                    </span>
                  </div>
                  <div className='h-2 bg-gray-200 rounded-full overflow-hidden mt-2'>
                    <div
                      className='h-full bg-[hsl(25,100%,53%)] transition-all'
                      style={{
                        width: `${statistics.budget.monthly.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className='text-sm font-medium text-gray-600 mb-2'>
                  Budget Annuel
                </h3>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Budget</span>
                    <span className='text-lg font-bold text-gray-900'>
                      {statistics.budget.annual.budget.toFixed(2)} €
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Dépensé</span>
                    <span className='text-lg font-bold text-orange-600'>
                      {statistics.budget.annual.spent.toFixed(2)} €
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Restant</span>
                    <span className='text-lg font-bold text-green-600'>
                      {statistics.budget.annual.remaining.toFixed(2)} €
                    </span>
                  </div>
                  <div className='h-2 bg-gray-200 rounded-full overflow-hidden mt-2'>
                    <div
                      className='h-full bg-[hsl(25,100%,53%)] transition-all'
                      style={{
                        width: `${statistics.budget.annual.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <Package className='h-6 w-6 text-[hsl(25,100%,53%)]' />
              <h2 className='text-xl font-semibold text-gray-900'>
                Services les plus utilisés
              </h2>
            </div>
            <div className='space-y-3'>
              {statistics.services.mostUsed
                .slice(0, 5)
                .map((service, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                  >
                    <div className='flex-1'>
                      <p className='text-sm font-medium text-gray-900'>
                        {service.serviceName}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {service.count} utilisation
                        {service.count > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-bold text-gray-900'>
                        {service.totalAmount.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Savings Section */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <TrendingDown className='h-6 w-6 text-green-500' />
              <h2 className='text-xl font-semibold text-gray-900'>
                Économies réalisées
              </h2>
            </div>
            <div className='text-center py-4'>
              <p className='text-4xl font-bold text-green-600 mb-2'>
                {statistics.savings.total.toFixed(2)}{' '}
                {statistics.savings.currency}
              </p>
              <p className='text-sm text-gray-600'>Total économisé</p>
            </div>
            <div className='mt-4 space-y-2'>
              {statistics.savings.breakdown.slice(0, 5).map((saving, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-2 bg-gray-50 rounded'
                >
                  <span className='text-sm text-gray-700'>
                    {saving.description}
                  </span>
                  <span className='text-sm font-medium text-green-600'>
                    +{saving.amount.toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Providers Section */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <Users className='h-6 w-6 text-[hsl(25,100%,53%)]' />
              <h2 className='text-xl font-semibold text-gray-900'>
                Prestataires préférés
              </h2>
            </div>
            <div className='space-y-3'>
              {statistics.providers.favorites
                .slice(0, 5)
                .map((provider, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                  >
                    <div className='flex items-center gap-3 flex-1'>
                      {provider.avatar ? (
                        <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-200'>
                          <img
                            src={provider.avatar}
                            alt={provider.providerName}
                            className='w-full h-full object-cover'
                          />
                        </div>
                      ) : (
                        <div className='w-10 h-10 rounded-full bg-[hsl(25,100%,53%)] flex items-center justify-center'>
                          <span className='text-white text-sm font-medium'>
                            {provider.providerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-gray-900'>
                          {provider.providerName}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {provider.orderCount} commande
                          {provider.orderCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='flex items-center gap-1'>
                        {[1, 2, 3, 4, 5].map(star => (
                          <span
                            key={star}
                            className={`text-xs ${
                              star <= provider.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
