'use client';

import {
  Provider,
  useProvidersOptimized,
} from '@/hooks/api/useProvidersOptimized';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import ServicesFilters from './ServicesFilters';
import ServicesProviderList from './ServicesProviderList';
import ServicesSearchBar from './ServicesSearchBar';
import ServicesStats from './ServicesStats';

const ServicesPage = React.memo(function ServicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // État local pour les filtres
  const [filters, setFilters] = useState({
    category: '',
    service: '',
    city: '',
    specialty: '',
    rating: 0,
  });

  // Utiliser le hook useProvidersOptimized avec les filtres
  const {
    providers,
    loading,
    error: _error,
    // hasResults,
    refetch,
  } = useProvidersOptimized({
    category: filters.category,
    city: filters.city,
    specialty: filters.specialty,
    service: filters.service,
    ...(filters.rating > 0 && { minRating: filters.rating }),
  });

  // Fonctions de gestion des filtres
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      category: '',
      service: '',
      city: '',
      specialty: '',
      rating: 0,
    });
  }, []);

  const hasActiveFilters = Object.values(filters).some(
    value => value !== '' && value !== 0
  );

  // Extraire les services et spécialités disponibles
  const availableServices = React.useMemo(() => {
    const services = new Set<string>();
    providers.forEach(provider => {
      if (provider['services']) {
        provider['services'].forEach((service: string) =>
          services.add(service)
        );
      }
    });
    return Array.from(services).sort();
  }, [providers]);

  const availableSpecialties = React.useMemo(() => {
    const specialties = new Set<string>();
    providers.forEach(provider => {
      if (provider.specialties) {
        provider.specialties.forEach((specialty: string) =>
          specialties.add(specialty)
        );
      }
    });
    return Array.from(specialties).sort();
  }, [providers]);

  // Recharger les données quand les filtres changent
  useEffect(() => {
    if (isClient) {
      refetch();
    }
  }, [filters, refetch, isClient]);

  // Gérer le filtrage par catégorie depuis l'URL (clé courte "t" et valeurs en lowercase)
  useEffect(() => {
    const raw = searchParams.get('t');
    const category = raw ? raw.toUpperCase() : '';
    if (category && ['HEALTH', 'EDU', 'IMMO'].includes(category)) {
      updateFilter('category', category);
    } else {
      updateFilter('category', '');
    }
  }, [searchParams, updateFilter]);

  // Calculer les statistiques
  const stats = React.useMemo(() => {
    const totalProviders = providers.length;
    const activeProviders = providers.filter(p => p.status === 'ACTIVE').length;
    const averageRating =
      providers.length > 0
        ? providers.reduce((sum, p) => sum + (p.rating || 0), 0) /
          providers.length
        : 0;

    return {
      totalProviders,
      activeProviders,
      averageRating: Math.round(averageRating * 10) / 10,
      specialties: availableSpecialties,
      services: availableServices,
    };
  }, [providers, availableSpecialties, availableServices]);

  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleProviderSelect = useCallback(
    (provider: Provider) => {
      router.push(`/services/${provider._id}`);
    },
    [router]
  );

  const handleServiceChange = useCallback(
    (value: string) => {
      updateFilter('service', value);
    },
    [updateFilter]
  );

  const handleCityChange = useCallback(
    (value: string) => {
      updateFilter('city', value);
    },
    [updateFilter]
  );

  const handleSpecialtyChange = useCallback(
    (value: string) => {
      updateFilter('specialty', value);
    },
    [updateFilter]
  );

  const handleRatingChange = useCallback(
    (value: number) => {
      updateFilter('rating', value);
    },
    [updateFilter]
  );

  // Logique de pagination
  const totalPages = Math.ceil(providers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProviders = providers.slice(startIndex, endIndex);

  // Reset de la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll vers le haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Trouvez votre prestataire
          </h1>
          <p className='text-gray-600'>
            Découvrez nos prestataires qualifiés et réservez vos services en
            ligne.
          </p>
        </div>

        {/* Category Filters */}
        <div className='mb-6'>
          <div className='flex flex-wrap gap-3'>
            <button
              onClick={() => {
                updateFilter('category', '');
                const url = new URL(window.location.href);
                url.searchParams.delete('t');
                window.history.replaceState({}, '', url.toString());
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !filters.category
                  ? 'bg-[hsl(25,100%,53%)] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous les services
            </button>
            <button
              onClick={() => {
                updateFilter('category', 'HEALTH');
                const url = new URL(window.location.href);
                url.searchParams.set('t', 'health');
                window.history.replaceState({}, '', url.toString());
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.category === 'HEALTH'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏥 Santé
            </button>
            <button
              onClick={() => {
                updateFilter('category', 'EDU');
                const url = new URL(window.location.href);
                url.searchParams.set('t', 'edu');
                window.history.replaceState({}, '', url.toString());
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.category === 'EDU'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🎓 Éducation
            </button>
            <button
              onClick={() => {
                updateFilter('category', 'IMMO');
                const url = new URL(window.location.href);
                url.searchParams.set('t', 'immo');
                window.history.replaceState({}, '', url.toString());
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.category === 'IMMO'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏠 Immobilier
            </button>
          </div>
        </div>

        {/* Stats */}
        {isClient && <ServicesStats stats={stats} />}

        {/* Search Bar */}
        <div className='mb-6'>
          <ServicesSearchBar
            availableServices={availableServices}
            selectedService={filters.service}
            setSelectedService={handleServiceChange}
            selectedCity={filters.city}
            setSelectedCity={handleCityChange}
          />
        </div>

        {/* Filters Toggle */}
        <div className='mb-6'>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className='flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
          >
            <svg
              className='w-4 h-4 mr-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
              />
            </svg>
            Filtres avancés
            {hasActiveFilters && (
              <span className='ml-2 px-2 py-1 bg-[hsl(25,100%,53%)] text-white text-xs rounded-full'>
                Actifs
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className='mb-6'>
            <ServicesFilters
              specialties={availableSpecialties}
              selectedSpecialty={filters.specialty}
              setSelectedSpecialty={handleSpecialtyChange}
              minRating={filters.rating}
              setMinRating={handleRatingChange}
            />

            {hasActiveFilters && (
              <div className='mt-4 flex justify-end'>
                <button
                  onClick={clearFilters}
                  className='px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors'
                >
                  Effacer tous les filtres
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {isClient && providers.length > 0 && (
          <div className='mb-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-gray-900'>
                {providers.length} prestataire
                {providers.length !== 1 ? 's' : ''} trouvé
                {providers.length !== 1 ? 's' : ''}
                {filters.category && (
                  <span className='text-sm font-normal text-gray-600 ml-2'>
                    dans la catégorie{' '}
                    <span className='text-[hsl(25,100%,53%)]'>
                      {filters.category === 'HEALTH' && 'Santé'}
                      {filters.category === 'EDU' && 'Éducation'}
                      {filters.category === 'IMMO' && 'Immobilier'}
                    </span>
                  </span>
                )}
                {totalPages > 1 && (
                  <span className='text-sm font-normal text-gray-600 ml-2'>
                    (Page {currentPage} sur {totalPages})
                  </span>
                )}
              </h2>

              {hasActiveFilters && (
                <span className='text-sm text-gray-600'>Filtres appliqués</span>
              )}
            </div>
          </div>
        )}

        {/* No Results Message */}
        {isClient && !loading && providers.length === 0 && (
          <div className='text-center py-12'>
            <div className='mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
              <svg
                className='w-12 h-12 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {filters.category ? (
                <>
                  Aucun prestataire trouvé dans la catégorie{' '}
                  <span className='text-[hsl(25,100%,53%)]'>
                    {filters.category === 'HEALTH' && 'Santé'}
                    {filters.category === 'EDU' && 'Éducation'}
                    {filters.category === 'IMMO' && 'Immobilier'}
                  </span>
                </>
              ) : (
                'Aucun prestataire trouvé'
              )}
            </h3>
            <p className='text-gray-500 mb-6'>
              {filters.category ? (
                <>
                  Il n&apos;y a actuellement aucun prestataire disponible dans
                  cette catégorie.
                  <br />
                  Essayez de modifier vos filtres ou de revenir à tous les
                  services.
                </>
              ) : (
                'Essayez de modifier vos critères de recherche ou vos filtres.'
              )}
            </p>
            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              {filters.category && (
                <button
                  onClick={() => {
                    updateFilter('category', '');
                    const url = new URL(window.location.href);
                    url.searchParams.delete('t');
                    window.history.replaceState({}, '', url.toString());
                  }}
                  className='px-6 py-3 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors'
                >
                  Voir tous les services
                </button>
              )}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className='px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          </div>
        )}

        {/* Provider List */}
        {isClient && (loading || providers.length > 0) && (
          <ServicesProviderList
            providers={paginatedProviders}
            loading={loading}
            error={_error}
            onProviderSelect={handleProviderSelect}
          />
        )}

        {/* Pagination */}
        {isClient && totalPages > 1 && (
          <div className='mt-8 flex justify-center'>
            <nav className='flex items-center space-x-2'>
              {/* Bouton Précédent */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Précédent
              </button>

              {/* Numéros de page */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Afficher seulement les pages proches de la page actuelle
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                if (!showPage) {
                  // Afficher des points de suspension
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span
                        key={page}
                        className='px-3 py-2 text-sm text-gray-500'
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-[hsl(25,100%,53%)] text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              {/* Bouton Suivant */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Suivant
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
});

ServicesPage.displayName = 'ServicesPage';

export default ServicesPage;
