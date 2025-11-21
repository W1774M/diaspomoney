'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { useProviders } from '@/hooks/useProviders';
import { USER_STATUSES } from '@/lib/constants';
import { User, Plus, Search, Building, Stethoscope, Wrench, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

export default function ProvidersPage() {
  const { isAuthenticated, isAdmin, isCSM, isLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(USER_STATUSES.ACTIVE);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Vérification des permissions
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (!isAdmin() && !isCSM()))) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isAdmin, isCSM, isLoading, router]);

  // Récupération des providers avec filtres
  // Note: L'API filtre déjà par rôle PROVIDER, pas besoin de le passer ici
  const providerFilters = useMemo(() => {
    const filters: any = {
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
    };
    if (statusFilter) filters.status = statusFilter;
    if (categoryFilter) filters.category = categoryFilter;
    return filters;
  }, [itemsPerPage, currentPage, statusFilter, categoryFilter]);
  
  const { providers, loading, error, total, refetch } = useProviders(providerFilters);

  // Filtrage local par terme de recherche
  const filteredProviders = useMemo(() => {
    if (!searchTerm) return providers;
    
    const searchLower = searchTerm.toLowerCase();
    return providers.filter(provider => {
      const name = provider['name'] || `${provider.firstName || ''} ${provider.lastName || ''}`.trim();
      const email = provider.email || '';
      const phone = provider.phone || '';
      const company = (provider as any).company || '';
      
      return (
        name.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower) ||
        phone.includes(searchTerm) ||
        company.toLowerCase().includes(searchLower)
      );
    });
  }, [providers, searchTerm]);

  // Calcul du nombre total de pages
  const totalPages = Math.ceil((total || 0) / itemsPerPage);

  // Gestion du changement de page
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Icône selon la catégorie
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'HEALTH':
        return Stethoscope;
      case 'BTP':
        return Wrench;
      case 'EDUCATION':
        return GraduationCap;
      default:
        return Building;
    }
  };

  // Format du nom du provider
  const getProviderName = (provider: any) => {
    if (provider.firstName && provider.lastName) {
      return `${provider.firstName} ${provider.lastName}`;
    }
    return provider.name || provider.email || 'Prestataire';
  };

  // Badge de statut
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      [USER_STATUSES.ACTIVE]: 'bg-green-100 text-green-800',
      [USER_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800',
      [USER_STATUSES.INACTIVE]: 'bg-gray-100 text-gray-800',
      [USER_STATUSES.SUSPENDED]: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated || (!isAdmin() && !isCSM())) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center'>
              <User className='h-8 w-8 text-[hsl(25,100%,53%)] mr-3' />
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Gestion des Prestataires</h1>
                <p className='text-gray-600 mt-1'>
                  {total || 0} prestataire{total !== 1 ? 's' : ''} au total
                </p>
              </div>
            </div>
            {isCSM() && (
              <Link
                href='/dashboard/providers/new'
                className='inline-flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors'
              >
                <Plus className='h-5 w-5 mr-2' />
                Nouveau prestataire
              </Link>
            )}
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className='bg-white rounded-lg shadow border border-gray-200 p-6 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Recherche */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
              <input
                type='text'
                placeholder='Rechercher...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
              />
            </div>

            {/* Filtre statut */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
            >
              <option value=''>Tous les statuts</option>
              <option value={USER_STATUSES.ACTIVE}>Actif</option>
              <option value={USER_STATUSES.PENDING}>En attente</option>
              <option value={USER_STATUSES.INACTIVE}>Inactif</option>
              <option value={USER_STATUSES.SUSPENDED}>Suspendu</option>
            </select>

            {/* Filtre catégorie */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
            >
              <option value=''>Toutes les catégories</option>
              <option value='HEALTH'>Santé</option>
              <option value='BTP'>BTP</option>
              <option value='EDUCATION'>Éducation</option>
            </select>

            {/* Filtre type */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
            >
              <option value=''>Tous les types</option>
              <option value='INDIVIDUAL'>Individuel</option>
              <option value='INSTITUTION'>Institution</option>
            </select>
          </div>
        </div>

        {/* Liste des providers */}
        {loading ? (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-12 text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)] mx-auto'></div>
            <p className='mt-4 text-gray-600'>Chargement des prestataires...</p>
          </div>
        ) : error ? (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-12 text-center'>
            <p className='text-red-600'>{error}</p>
            <button
              onClick={() => refetch()}
              className='mt-4 px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors'
            >
              Réessayer
            </button>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className='bg-white rounded-lg shadow border border-gray-200 p-12 text-center'>
            <User className='h-16 w-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Aucun prestataire trouvé
            </h3>
            <p className='text-gray-500 mb-4'>
              {searchTerm || statusFilter || categoryFilter || typeFilter
                ? 'Aucun résultat ne correspond à vos critères de recherche.'
                : 'Aucun prestataire n\'a été enregistré pour le moment.'}
            </p>
            {isCSM() && (
              <Link
                href='/dashboard/providers/new'
                className='inline-flex items-center px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors'
              >
                <Plus className='h-5 w-5 mr-2' />
                Ajouter un prestataire
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className='bg-white rounded-lg shadow border border-gray-200 overflow-hidden'>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Prestataire
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Type / Catégorie
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Contact
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Statut
                      </th>
                      <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {filteredProviders.map((provider: any) => {
                      const CategoryIcon = getCategoryIcon(provider.providerInfo?.category);
                      return (
                        <tr key={provider.id || provider._id} className='hover:bg-gray-50'>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='flex items-center'>
                              <div className='flex-shrink-0 h-10 w-10 rounded-full bg-[hsl(25,100%,53%)] flex items-center justify-center text-white font-semibold'>
                                {getProviderName(provider)
                                  .split(' ')
                                  .map((n: string) => n.charAt(0))
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>
                              <div className='ml-4'>
                                <div className='text-sm font-medium text-gray-900'>
                                  {getProviderName(provider)}
                                </div>
                                {provider.providerInfo?.isVerified && (
                                  <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1'>
                                    Vérifié
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='flex items-center text-sm text-gray-900'>
                              {CategoryIcon && <CategoryIcon className='h-4 w-4 mr-2 text-gray-400' />}
                              <div>
                                <div className='font-medium'>
                                  {provider.providerInfo?.type === 'INDIVIDUAL' ? 'Individuel' : 'Institution'}
                                </div>
                                <div className='text-gray-500 text-xs'>
                                  {provider.providerInfo?.category || 'Non spécifié'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            <div>{provider.email}</div>
                            {provider.phone && (
                              <div className='text-xs text-gray-400'>{provider.phone}</div>
                            )}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                provider.status || USER_STATUSES.PENDING,
                              )}`}
                            >
                              {provider.status || USER_STATUSES.PENDING}
                            </span>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                            <Link
                              href={`/dashboard/providers/${provider.id || provider._id}`}
                              className='text-[hsl(25,100%,53%)] hover:text-[hsl(25,100%,48%)] mr-4'
                            >
                              Voir
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-6 flex items-center justify-between'>
                <div className='text-sm text-gray-700'>
                  Page {currentPage} sur {totalPages} ({total || 0} résultat{(total || 0) !== 1 ? 's' : ''})
                </div>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className='px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className='px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

